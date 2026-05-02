const { scanText, scanImage, scanCaption } = require('../services/aiModerationService');
const { getGroup } = require('../utils/groupSettings');
const { logNsfw } = require('../services/loggingService');
const logger = require('../utils/logger');

const textCache = new Map();
const fileCache = new Map();
const TTL_TEXT = 5 * 60_000;
const TTL_FILE = 30 * 60_000;

// Per-chat cooldown: only one AI scan per chat every CHAT_SCAN_INTERVAL ms.
// Hard-rule / cache hits still work instantly; only new API calls are throttled.
const CHAT_SCAN_INTERVAL = 4_000; // 4 seconds between API scans per chat
const chatLastScan = new Map();

function chatOnCooldown(chatId) {
  const last = chatLastScan.get(chatId);
  return last && (Date.now() - last) < CHAT_SCAN_INTERVAL;
}

function stampChat(chatId) {
  chatLastScan.set(chatId, Date.now());
  if (chatLastScan.size > 2000) {
    const cutoff = Date.now() - CHAT_SCAN_INTERVAL * 2;
    for (const [id, ts] of chatLastScan) {
      if (ts < cutoff) chatLastScan.delete(id);
    }
  }
}

const MAX_DOWNLOAD = 5 * 1024 * 1024; // 5 MB cap
const HARD_NSFW_STICKER_KEYWORDS = ['porn','hentai','xxx','nsfw','nude','sex','adult','lewd','ecchi'];

function setCache(map, key, value, ttl) {
  map.set(key, value);
  setTimeout(() => map.delete(key), ttl);
}

async function downloadTelegramFile(ctx, fileId) {
  try {
    const link = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(link.href);
    if (!res.ok) return null;
    const len = parseInt(res.headers.get('content-length') || '0', 10);
    if (len && len > MAX_DOWNLOAD) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_DOWNLOAD) return null;
    return { buffer: buf, mime: res.headers.get('content-type') || 'image/jpeg' };
  } catch (e) {
    logger.warn(`tg download failed: ${e.message}`);
    return null;
  }
}

function pickPhoto(photos) {
  if (!photos || !photos.length) return null;
  // pick the largest under 5 MB; PhotoSize array is sorted small→large
  for (let i = photos.length - 1; i >= 0; i--) {
    if (!photos[i].file_size || photos[i].file_size <= MAX_DOWNLOAD) return photos[i];
  }
  return photos[0];
}

function checkSticker(sticker) {
  if (!sticker) return false;
  const setName = (sticker.set_name || '').toLowerCase();
  // Only block stickers from packs whose name contains a hard NSFW keyword.
  // No vision scan — nsfwjs has too many false positives on anime/cartoon thumbnails.
  return HARD_NSFW_STICKER_KEYWORDS.some((kw) => setName.includes(kw));
}

async function checkFileCached(ctx, fileId) {
  const cached = fileCache.get(fileId);
  if (cached !== undefined) return cached;
  const dl = await downloadTelegramFile(ctx, fileId);
  if (!dl) { setCache(fileCache, fileId, false, TTL_FILE); return false; }
  let mime = dl.mime;
  if (mime && mime.startsWith('image/webp')) mime = 'image/webp';
  if (!mime || !mime.startsWith('image/')) mime = 'image/jpeg';
  const bad = await scanImage(dl.buffer, mime);
  setCache(fileCache, fileId, bad, TTL_FILE);
  return bad;
}

async function detect(ctx) {
  const m = ctx.message;
  if (!m) return { bad: false, reason: '' };

  const chatId = ctx.chat?.id;

  // ── 1. Text / caption ────────────────────────────────────────────────────────
  // Cooldown only gates UNCACHED text API calls (to protect Groq RPM).
  // Rules inside scanText always run instantly regardless of cooldown.
  const text = m.text || m.caption || '';
  if (text && !text.startsWith('/')) {
    const cacheKey = text.slice(0, 200).toLowerCase();
    let bad = textCache.get(cacheKey);
    if (bad === undefined) {
      const onCooldown = chatId ? chatOnCooldown(chatId) : false;
      if (!onCooldown && chatId) stampChat(chatId);
      bad = await scanText(text); // rules run regardless; AI skipped when on cooldown handled inside groqLimiter
      setCache(textCache, cacheKey, bad, TTL_TEXT);
    }
    if (bad) return { bad: true, reason: 'text' };
  }

  // ── 2. Photo ─────────────────────────────────────────────────────────────────
  // Images are HIGH-RISK — NEVER skipped due to cooldown.
  // Cache prevents redundant downloads of the same file_id.
  if (m.photo && m.photo.length) {
    // a) Scan caption instantly (no download needed)
    if (m.caption && await scanCaption(m.caption)) return { bad: true, reason: 'image-caption' };

    // b) Scan the image itself — always, even if chat was recently scanned
    const ph = pickPhoto(m.photo);
    if (ph) {
      if (await checkFileCached(ctx, ph.file_id)) return { bad: true, reason: 'image' };
    }
  }

  // ── 3. Sticker ───────────────────────────────────────────────────────────────
  // Only block stickers from packs with NSFW keywords in the pack name.
  // No vision scan — too many false positives on anime/cartoon thumbnails.
  if (m.sticker) {
    if (checkSticker(m.sticker)) return { bad: true, reason: 'sticker' };
  }

  // ── 4. Animation / GIF / Video / Image-document ───────────────────────────────
  // Thumbnail scans always run; file cache prevents duplicate downloads.
  for (const mediaKey of ['animation', 'video', 'video_note', 'document']) {
    const obj = m[mediaKey];
    if (!obj) continue;

    const thumb = obj.thumbnail || obj.thumb;
    if (thumb && await checkFileCached(ctx, thumb.file_id)) {
      return { bad: true, reason: mediaKey };
    }

    if (
      mediaKey === 'document' &&
      obj.mime_type?.startsWith('image/') &&
      (obj.file_size || 0) <= MAX_DOWNLOAD
    ) {
      if (await checkFileCached(ctx, obj.file_id)) return { bad: true, reason: 'document-image' };
    }
  }

  return { bad: false, reason: '' };
}

async function aiModeration(ctx, next) {
  if (!ctx.message || !ctx.chat || ctx.chat.type === 'private') return next();
  if (ctx.from?.is_bot) return next();
  if (ctx.from?.id === ctx.botInfo?.id) return next();

  let group;
  try { group = await getGroup(ctx.chat.id); } catch { return next(); }

  // NSFW protection is ALWAYS-ON by default; admins are NOT exempt.
  if (group.nsfwProtection === false) return next();

  let result;
  try {
    result = await detect(ctx);
  } catch (e) {
    logger.warn(`moderation detect error: ${e.message}`);
    return next();
  }

  if (!result.bad) return next();

  const userTag = ctx.from.first_name ? `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>` : 'User';
  try { await ctx.deleteMessage(); } catch {}
  try {
    await ctx.reply(
      `🚫 <b>Content removed.</b>\n` +
      `User: ${userTag}\n` +
      `Reason: prohibited <b>${result.reason}</b> (NSFW / drugs / abuse / hate / scam).\n` +
      `<i>This protection applies to everyone, including admins.</i>`,
      { parse_mode: 'HTML' }
    );
  } catch {}
  logNsfw(ctx, result.reason).catch(() => {});

  // Optional escalation in strict mode (don't restrict admins, just warn)
  if (group.strictMode) {
    try {
      const cm = await ctx.getChatMember(ctx.from.id);
      if (!['administrator', 'creator'].includes(cm.status)) {
        await ctx.restrictChatMember(ctx.from.id, {
          permissions: { can_send_messages: false, can_send_media_messages: false },
          until_date: Math.floor(Date.now() / 1000) + 3600,
        });
      }
    } catch {}
  }
  return; // stop further middleware
}

module.exports = aiModeration;
