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

async function checkSticker(ctx, sticker) {
  if (!sticker) return false;
  const setName = (sticker.set_name || '').toLowerCase();
  const emoji = sticker.emoji || '';
  for (const kw of HARD_NSFW_STICKER_KEYWORDS) {
    if (setName.includes(kw)) return true;
  }
  // text-scan emoji + set name
  const ctxStr = `Sticker pack "${setName}" with emoji ${emoji}`;
  const cached = textCache.get(ctxStr);
  if (cached !== undefined) return cached;
  const bad = await scanText(ctxStr);
  setCache(textCache, ctxStr, bad, TTL_TEXT);
  if (bad) return true;
  // also vision-scan the sticker thumbnail
  const fileId = sticker.thumbnail?.file_id || sticker.thumb?.file_id || sticker.file_id;
  if (!fileId) return false;
  return await checkFileCached(ctx, fileId);
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
  const onCooldown = chatId ? chatOnCooldown(chatId) : false;

  // 1. Text / caption
  const text = m.text || m.caption || '';
  if (text && !text.startsWith('/')) {
    const key = text.slice(0, 200).toLowerCase();
    let bad = textCache.get(key);
    if (bad === undefined) {
      if (onCooldown) {
        // Skip live API call — chat scanned too recently; pass through as safe
        bad = false;
      } else {
        if (chatId) stampChat(chatId);
        bad = await scanText(text);
        setCache(textCache, key, bad, TTL_TEXT);
      }
    }
    if (bad) return { bad: true, reason: 'text' };
  }

  // 2. Photo — scan caption first (instant, no download), then pixels via AI
  if (m.photo && m.photo.length) {
    if (m.caption && await scanCaption(m.caption)) return { bad: true, reason: 'image-caption' };
    const ph = pickPhoto(m.photo);
    if (ph) {
      const cached = fileCache.get(ph.file_id);
      if (cached !== undefined) {
        if (cached) return { bad: true, reason: 'image' };
      } else if (!onCooldown) {
        if (chatId) stampChat(chatId);
        if (await checkFileCached(ctx, ph.file_id)) return { bad: true, reason: 'image' };
      }
    }
  }

  // 3. Sticker
  if (m.sticker) {
    const setName = (m.sticker.set_name || '').toLowerCase();
    const hardHit = HARD_NSFW_STICKER_KEYWORDS.some((kw) => setName.includes(kw));
    if (hardHit) return { bad: true, reason: 'sticker' };
    if (!onCooldown) {
      if (chatId) stampChat(chatId);
      if (await checkSticker(ctx, m.sticker)) return { bad: true, reason: 'sticker' };
    }
  }

  // 4. Animation / GIF / Video — scan thumbnail (respect cooldown for uncached files)
  for (const key of ['animation', 'video', 'video_note', 'document']) {
    const obj = m[key];
    if (!obj) continue;
    const thumb = obj.thumbnail || obj.thumb;
    if (thumb) {
      const cachedThumb = fileCache.get(thumb.file_id);
      if (cachedThumb !== undefined) {
        if (cachedThumb) return { bad: true, reason: key };
      } else if (!onCooldown) {
        if (chatId) stampChat(chatId);
        if (await checkFileCached(ctx, thumb.file_id)) return { bad: true, reason: key };
      }
    }
    if (key === 'document' && obj.mime_type && obj.mime_type.startsWith('image/') && (obj.file_size || 0) <= MAX_DOWNLOAD) {
      const cachedDoc = fileCache.get(obj.file_id);
      if (cachedDoc !== undefined) {
        if (cachedDoc) return { bad: true, reason: 'document-image' };
      } else if (!onCooldown) {
        if (chatId) stampChat(chatId);
        if (await checkFileCached(ctx, obj.file_id)) return { bad: true, reason: 'document-image' };
      }
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
