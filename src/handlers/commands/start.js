const os = require('os');
const { Markup } = require('telegraf');
const config = require('../../config/index');
const { formatDuration, escapeHtml } = require('../../utils/helpers');
const { getGroup } = require('../../utils/groupSettings');

const STICKER_SET = process.env.START_STICKER_SET || 'Koylakoyla_by_fStikBot';

// Loading frames
const LOADING_FRAMES = [
  'нℓσ вαву ✨',
  'ℓσα∂ιиɢ.',
  'ℓσα∂ιиɢ..',
  'ℓσα∂ιиɢ...',
  'нιиαтα',
  'нιиαтα χ',
  'нιиαтα χ ιиfιиιту',
  'ѕтαятє∂ 👑',
];

const FRAME_DELAY_MS  = 200;
const STICKER_HOLD_MS = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches the first sticker file_id from a sticker set.
 * Replaces the missing stickerCache module.
 */
async function getFirstSticker(telegram, stickerSetName) {
  try {
    const stickerSet = await telegram.getStickerSet(stickerSetName);
    if (stickerSet && stickerSet.stickers && stickerSet.stickers.length > 0) {
      return stickerSet.stickers[0].file_id;
    }
  } catch (err) {
    console.error('[startCommand] Failed to fetch sticker set:', err.message);
  }
  return null;
}

/**
 * Run the start-up animation:
 *   1. send sticker → wait 2 s → delete sticker
 *   2. send first loading frame, then edit it through every frame, 0.2 s each
 *   3. delete the loading message
 */
async function playStartAnimation(ctx) {
  // ── Stage 1: sticker
  try {
    const fileId = await getFirstSticker(ctx.telegram, STICKER_SET);
    if (fileId) {
      const stickerMsg = await ctx.replyWithSticker(fileId);
      await sleep(STICKER_HOLD_MS);
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, stickerMsg.message_id);
      } catch (err) {
        console.error('[startCommand] Failed to delete sticker message:', err.message);
      }
    }
  } catch (err) {
    console.error('[startCommand] Failed to send sticker:', err.message);
  }

  // ── Stage 2: loading text frames
  let loadingMsg = null;
  try {
    loadingMsg = await ctx.reply(
      `<blockquote>${LOADING_FRAMES[0]}</blockquote>`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    console.error('[startCommand] Failed to send loading message:', err.message);
    return;
  }

  for (let i = 1; i < LOADING_FRAMES.length; i++) {
    await sleep(FRAME_DELAY_MS);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        undefined,
        `<blockquote>${LOADING_FRAMES[i]}</blockquote>`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      console.error(`[startCommand] Failed to edit loading frame ${i}:`, err.message);
    }
  }

  await sleep(FRAME_DELAY_MS);
  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
  } catch (err) {
    console.error('[startCommand] Failed to delete loading message:', err.message);
  }
}

const startCommand = async (ctx) => {
  const username = ctx.from.first_name || 'User';
  const botName  = 'Hinata';
  const upt      = formatDuration(Math.floor(process.uptime()));
  const mem      = process.memoryUsage();
  const heapMB   = (mem.heapUsed / 1024 / 1024).toFixed(1);

  // Deep-link: rules_<chatId>
  const arg = (ctx.message?.text || '').split(/\s+/)[1];
  if (arg && arg.startsWith('rules_')) {
    const chatId = parseInt(arg.slice(6), 10);
    if (Number.isInteger(chatId) && isFinite(chatId)) {
      try {
        const g   = await getGroup(chatId);
        const txt = g.rules || 'No rules set for that chat.';
        return ctx.reply(`📜 <b>Rules</b>:\n\n${escapeHtml(txt)}`, { parse_mode: 'HTML' });
      } catch (err) {
        console.error('[startCommand] Failed to fetch group rules:', err.message);
        return ctx.reply('⚠️ Failed to fetch rules for that chat. Please try again later.');
      }
    }
  }

  // ── Play the entrance animation first ──
  await playStartAnimation(ctx);

  const startMsg =
    `<blockquote>┌────── ˹ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ˼─── ⏤\n` +
    `┆🌺 ʜєʏ, <b>${escapeHtml(username)}</b>\n` +
    `┆🌺 ɪ ᴀᴍ <b>${botName}</b> ✨\n` +
    `└──────────────────────•\n\n` +
    `Aɴ ᴀʟʟ-ɪɴ-ᴏɴᴇ ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ ʙᴏᴛ — ʀᴏsᴇ ʟᴇᴠᴇʟ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ.\n\n` +
    `➥ <b>Uptime</b>: ${upt}\n` +
    `➥ <b>Heap</b>: ${heapMB} MB\n` +
    `➥ <b>Node</b>: ${process.version}\n` +
    `➥ <b>Host</b>: ${os.hostname()}\n` +
    `•──────────────────────•\n` +
    `🌺 ᴘᴏᴡєʀєᴅ ʙʏ <b>|𝐌 ᴀ ᴅ ᴀ ʀ ᴀ •|</b></blockquote>`;

  const kb = Markup.inlineKeyboard([
    [
      Markup.button.url('тαρ тσ ѕєє мαɢιc ✨', `https://t.me/${ctx.botInfo.username}?startgroup=true`),
    ],
    [
      Markup.button.callback('cσммαи∂ѕ', 'help_main'),
      Markup.button.url('ωєвѕιтє', 'https://gmsxabouttgaura.netlify.app/'),
    ],
    [
      Markup.button.url('мү ℓσя∂', `tg://user?id=${config.ownerId}`),
      Markup.button.url('cнαииєℓ', 'https://t.me/+1NRRqUd1replNTM1'),
    ],
  ]);

  const photoUrl = process.env.START_IMAGE_URL || 'https://i.ibb.co/JWnXps3t/image.jpg';
  try {
    await ctx.replyWithPhoto(photoUrl, {
      caption: startMsg,
      parse_mode: 'HTML',
      has_spoiler: true,
      ...kb,
    });
  } catch (err) {
    console.error('[startCommand] Failed to send photo, falling back to text:', err.message);
    try {
      await ctx.reply(startMsg, { parse_mode: 'HTML', ...kb });
    } catch (fallbackErr) {
      console.error('[startCommand] Fallback text reply also failed:', fallbackErr.message);
    }
  }
};

module.exports = startCommand;
