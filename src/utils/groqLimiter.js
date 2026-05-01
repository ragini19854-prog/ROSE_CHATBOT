/**
 * Groq rate-limiter with dual-API failover + circuit breaker + auto-recovery
 *
 * Free tier limit: 30 RPM per model.
 * Target: 24 RPM (1 call per 2.5 s) — safe under the hard cap.
 *
 * Key switching:
 *   PRIMARY   — uses GROQ_API_KEY (env)
 *   BACKUP    — uses GROQ_API_KEY_2 (env) when primary circuit opens
 *
 * Circuit breaker states (per key slot):
 *   CLOSED    — normal; calls go through
 *   OPEN      — too many failures; calls blocked, background probe runs
 *   HALF_OPEN — one probe in-flight to test recovery
 *
 * Callers never need to handle 429 / outage errors.
 */

const Groq   = require('groq-sdk');
const config = require('../config/index');
const logger = require('./logger');

const INTERVAL_MS       = 2500;   // 24 calls/min
const MAX_RETRIES       = 4;      // 429 retries per call
const MAX_QUEUE         = 50;     // evict oldest when queue is full
const FAILURE_THRESHOLD = 5;      // consecutive failures before opening circuit
const RECOVERY_INTERVAL = 60_000; // ms between circuit-breaker probes
const PROBE_TIMEOUT     = 15_000; // probe must respond within 15 s

const STATE = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

// ─── one circuit per API key slot ─────────────────────────────────────────────

function makeCircuit(apiKey, label) {
  return {
    label,
    groq:         apiKey ? new Groq({ apiKey }) : null,
    state:        STATE.CLOSED,
    failures:     0,
    probeTimer:   null,
    probeRunning: false,
  };
}

class GroqLimiter {
  constructor() {
    this._queue   = [];
    this._running = false;
    this._primary = makeCircuit(config.groqApiKey,  'PRIMARY');
    this._backup  = makeCircuit(config.groqApiKey2, 'BACKUP');
    this._active  = this._primary; // slot currently in use
  }

  // ─── public API ─────────────────────────────────────────────────────────────

  /**
   * Schedule a Groq API call.
   * @param {(groq: Groq) => Promise<any>} fn  accepts a Groq instance
   */
  call(fn) {
    return new Promise((resolve, reject) => {
      const slot = this._pickSlot();
      if (!slot) {
        reject(new Error('All Groq API keys are currently unavailable. Auto-recovering…'));
        return;
      }
      if (this._queue.length >= MAX_QUEUE) this._queue.shift();
      this._queue.push({ fn, resolve, reject, retries: 0 });
      if (!this._running) this._drain();
    });
  }

  // ─── slot selection ──────────────────────────────────────────────────────────

  _pickSlot() {
    if (this._active.state !== STATE.OPEN && this._active.groq) return this._active;
    // active slot is open — try the other one
    const other = this._active === this._primary ? this._backup : this._primary;
    if (other.groq && other.state !== STATE.OPEN) {
      const was = this._active.label;
      this._active = other;
      logger.warn(`🔄 Groq failover: switched from ${was} → ${other.label}`);
      return other;
    }
    return null; // both circuits open
  }

  // ─── drain loop ──────────────────────────────────────────────────────────────

  async _drain() {
    this._running = true;
    while (this._queue.length > 0) {
      const slot = this._pickSlot();
      if (!slot) {
        // Both circuits open — flush remaining with rejection
        const err = new Error('All Groq API keys are currently unavailable. Auto-recovering…');
        while (this._queue.length > 0) this._queue.shift().reject(err);
        break;
      }
      const item = this._queue.shift();
      await this._execute(item, slot);
      if (this._queue.length > 0) await _sleep(INTERVAL_MS);
    }
    this._running = false;
  }

  // ─── execute one call ────────────────────────────────────────────────────────

  async _execute(item, slot) {
    try {
      const result = await item.fn(slot.groq);
      this._onSuccess(slot);
      item.resolve(result);
    } catch (err) {
      if (_is429(err) && item.retries < MAX_RETRIES) {
        const wait = _retryAfter(err);
        logger.warn(`Groq [${slot.label}] 429 — backing off ${wait}ms (attempt ${item.retries + 1}/${MAX_RETRIES})`);
        await _sleep(wait);
        item.retries += 1;
        this._queue.unshift(item);
      } else {
        this._onFailure(slot, err);
        item.reject(err);
      }
    }
  }

  // ─── circuit state transitions ───────────────────────────────────────────────

  _onSuccess(slot) {
    if (slot.state !== STATE.CLOSED) {
      logger.info(`✅ Groq [${slot.label}] recovered — circuit CLOSED.`);
    }
    slot.failures = 0;
    slot.state    = STATE.CLOSED;
    this._clearProbe(slot);
    // If we were on backup, try switching back to primary next
    if (slot === this._backup && this._primary.groq && this._primary.state === STATE.CLOSED) {
      this._active = this._primary;
      logger.info('🔄 Groq failback: returned to PRIMARY key.');
    }
  }

  _onFailure(slot, err) {
    slot.failures += 1;
    logger.warn(`Groq [${slot.label}] failure ${slot.failures}/${FAILURE_THRESHOLD}: ${err.message}`);
    if (slot.failures >= FAILURE_THRESHOLD && slot.state === STATE.CLOSED) {
      slot.state = STATE.OPEN;
      logger.error(
        `⚡ Groq [${slot.label}] circuit OPEN — switching to ${
          slot === this._primary && this._backup.groq ? 'BACKUP key' : 'auto-recovery mode'
        }. Probing every ${RECOVERY_INTERVAL / 1000}s.`
      );
      this._scheduleProbe(slot);
    }
  }

  // ─── background probe ────────────────────────────────────────────────────────

  _scheduleProbe(slot) {
    this._clearProbe(slot);
    slot.probeTimer = setTimeout(() => this._probe(slot), RECOVERY_INTERVAL);
  }

  _clearProbe(slot) {
    if (slot.probeTimer) { clearTimeout(slot.probeTimer); slot.probeTimer = null; }
  }

  async _probe(slot) {
    if (slot.probeRunning || !slot.groq) return;
    slot.probeRunning = true;
    slot.state = STATE.HALF_OPEN;
    logger.info(`🔍 Groq [${slot.label}] HALF_OPEN — probing…`);
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('probe timeout')), PROBE_TIMEOUT));
      await Promise.race([
        slot.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        timeout,
      ]);
      slot.probeRunning = false;
      this._onSuccess(slot);
      if (!this._running && this._queue.length > 0) this._drain();
    } catch (err) {
      slot.probeRunning = false;
      slot.state = STATE.OPEN;
      logger.warn(`Groq [${slot.label}] probe failed: ${err.message} — retry in ${RECOVERY_INTERVAL / 1000}s`);
      this._scheduleProbe(slot);
    }
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function _is429(err) {
  return err?.status === 429
    || err?.message?.includes('429')
    || err?.message?.toLowerCase().includes('rate limit');
}

function _retryAfter(err) {
  const match = err?.message?.match(/try again in\s+([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  return 5000;
}

function _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

module.exports = new GroqLimiter();
