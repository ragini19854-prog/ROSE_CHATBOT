const { Markup } = require('telegraf');
const os = require('os');
const config = require('../../config/index');
const { formatDuration, escapeHtml } = require('../../utils/helpers');
const { getGroup } = require('../../utils/groupSettings');

const startCommand = async (ctx) => {
  const username = ctx.from.first_name || 'User';
  const botName = 'Hinata';
  const upt = formatDuration(Math.floor(process.uptime()));
  const mem = process.memoryUsage();
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);

  // Deep-link: rules_<chatId>
  const arg = (ctx.message?.text || '').split(/\s+/)[1];
  if (arg && arg.startsWith('rules_')) {
    const chatId = parseInt(arg.slice(6), 10);
    if (chatId) {
      try {
        const g = await getGroup(chatId);
        const txt = g.rules || 'No rules set for that chat.';
        return ctx.reply(`📜 <b>Rules</b>:\n\n${escapeHtml(txt)}`, { parse_mode: 'HTML' });
      } catch {}
    }
  }

  const startMsg =
    `┌────── ˹ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ˼─── ⏤
` +
    `┆🌺 ʜєʏ, <b>${escapeHtml(username)}</b>
` +
    `┆🌺 ɪ ᴀᴍ <b>${botName}</b> ✨
` +
    `└──────────────────────•

` +
    `Aɴ ᴀʟʟ-ɪɴ-ᴏɴᴇ ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ + ᴀɪ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ ʙᴏᴛ — ʀᴏsᴇ ʟᴇᴠᴇʟ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ.

` +
    `➥ <b>Uptime</b>: ${upt}
` +
    `➥ <b>Heap</b>: ${heapMB} MB
` +
    `➥ <b>Node</b>: ${process.version}
` +
    `➥ <b>Host</b>: ${os.hostname()}
` +
    `•──────────────────────•
` +
    `🌺 ᴘᴏᴡєʀєᴅ ʙʏ <b>|𝐌 ᴀ ᴅ ᴀ ʀ ᴀ •|</b>`;

  const kb = Markup.inlineKeyboard([
    [
      Markup.button.url('➕ Add me to your group', `https://t.me/${ctx.botInfo.username}?startgroup=true`),
    ],
    [
      Markup.button.callback('📜 Commands', 'help_main'),
      Markup.button.callback('ℹ️ About', 'about'),
    ],
    [
      Markup.button.url('👨‍💻 Developer', `tg://user?id=${config.ownerId}`),
      Markup.button.url('🌐 Channel', 'https://t.me/yourchannel'),
    ],
  ]);

  const photoUrl = process.env.START_IMAGE_URL || 'https://i.ibb.co/PsVzsK8x/image.jpg';
  try {
    await ctx.replyWithPhoto(photoUrl, {
      caption: startMsg,
      parse_mode: 'HTML',
      has_spoiler: true,
      ...kb,
    });
  } catch {
    await ctx.reply(startMsg, { parse_mode: 'HTML', ...kb });
  }
};

module.exports = startCommand;
