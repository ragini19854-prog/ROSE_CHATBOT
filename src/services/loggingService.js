const { getLoggerGroupId } = require('../utils/botSettings');
const logger = require('../utils/logger');

let _bot = null;
function init(bot) { _bot = bot; }

const ICONS = {
  ban: '🔨', unban: '♻️', kick: '👢', mute: '🔇', unmute: '🔊',
  warn: '⚠️', warn_limit: '🚨', nsfw: '🔞', flood: '🌊',
  blacklist: '🚫', join: '👋', leave: '🚶', promote: '⭐️', demote: '📉',
  note: '📝', filter: '🔍', pin: '📌', lock: '🔒', unlock: '🔓',
  captcha_fail: '🛡️', raid: '🛑', fed_ban: '🌐', bot_ban: '⛔️',
  kill: '🗡️', rob: '💰', protect: '🛡️', broadcast: '📣',
  sudo_add: '🔑', sudo_remove: '🔑', coins_give: '💵', coins_take: '💸',
  setlog: '📡', info: 'ℹ️', error: '❌',
};

function escHtml(t) {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function logEvent(type, data = {}) {
  const groupId = await getLoggerGroupId();
  if (!groupId || !_bot) return;

  const icon = ICONS[type] || 'ℹ️';
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const lines = [
    `${icon} <b>${type.toUpperCase().replace(/_/g, ' ')}</b>`,
    `🕐 <code>${time} IST</code>`,
    `─────────────────`,
  ];

  if (data.chat)   lines.push(`📍 Chat: <b>${escHtml(data.chat.title || data.chat.id)}</b> (<code>${data.chat.id}</code>)`);
  if (data.actor)  lines.push(`👤 By: <a href="tg://user?id=${data.actor.id}">${escHtml(data.actor.first_name || data.actor.id)}</a> (<code>${data.actor.id}</code>)`);
  if (data.target) lines.push(`🎯 On: <a href="tg://user?id=${data.target.id}">${escHtml(data.target.first_name || data.target.id)}</a> (<code>${data.target.id}</code>)`);
  if (data.reason) lines.push(`📝 Reason: ${escHtml(data.reason)}`);
  if (data.duration) lines.push(`⏳ Duration: <b>${data.duration}</b>`);
  if (data.amount != null) lines.push(`💰 Amount: <b>${data.amount}</b>`);
  if (data.extra)  lines.push(`📎 ${escHtml(String(data.extra))}`);

  try {
    await _bot.telegram.sendMessage(groupId, lines.join('\n'), {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  } catch (e) {
    logger.warn(`Logger group error: ${e.message}`);
  }
}

// backward-compat
function logModeration(chatId, userId, action, reason) {
  logger.info(`[MOD] Chat:${chatId} User:${userId} Action:${action} Reason:${reason}`);
}

module.exports = { init, logEvent, logModeration };
