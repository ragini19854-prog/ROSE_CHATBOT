const { Markup } = require('telegraf');
const { captchaCallback } = require('./commands/captcha');

const HELP_MENU = {
  help_main: {
    title: '📜 <b>Hinata Commands</b>\n\nPick a category:',
    rows: [
      [['Admin', 'help_admin'], ['Bans', 'help_bans'], ['Mutes', 'help_mutes']],
      [['Warnings', 'help_warns'], ['Notes', 'help_notes'], ['Filters', 'help_filters']],
      [['Greetings', 'help_greet'], ['Rules', 'help_rules'], ['Locks', 'help_locks']],
      [['Antiflood', 'help_flood'], ['Blocklists', 'help_black'], ['Approval', 'help_appr']],
      [['Pins', 'help_pins'], ['Purges', 'help_purges'], ['Reports', 'help_reports']],
      [['Connections', 'help_conn'], ['Disabling', 'help_dis'], ['Log Channel', 'help_log']],
      [['CAPTCHA', 'help_captcha'], ['AntiRaid', 'help_raid'], ['Cleaning', 'help_clean']],
      [['Topics', 'help_topics'], ['Federations', 'help_fed'], ['Misc', 'help_misc']],
      [['Economy', 'help_eco'], ['Games', 'help_games'], ['AI Chatbot', 'help_ai']],
      [['Formatting', 'help_fmt'], ['Languages', 'help_lang'], ['Privacy', 'help_priv']],
      [['Import/Export', 'help_io']],
    ],
  },
  help_admin: { title: '<b>👮 Admin</b>\n\n/promote /demote /fullpromote\n/title /adminlist\n/invitelink /settitle /setdescription /setchatphoto', back: 'help_main' },
  help_bans: { title: '<b>🔨 Bans</b>\n\n/ban /sban /dban /tban /unban\n/kick /skick /kickme /banme', back: 'help_main' },
  help_mutes: { title: '<b>🔇 Mutes</b>\n\n/mute /smute /dmute /tmute /unmute', back: 'help_main' },
  help_warns: { title: '<b>⚠️ Warnings</b>\n\n/warn /swarn /dwarn /warns\n/resetwarns /rmwarn\n/setwarnlimit /warnmode mute|kick|ban', back: 'help_main' },
  help_notes: { title: '<b>📝 Notes</b>\n\n/save name [content]\n/get name (or #name)\n/clear name /clearall\n/notes', back: 'help_main' },
  help_filters: { title: '<b>🔍 Filters</b>\n\n/filter trigger reply\n/stop trigger /stopall\n/filters', back: 'help_main' },
  help_greet: { title: '<b>👋 Greetings</b>\n\n/setwelcome /resetwelcome /welcome on|off\n/setgoodbye /resetgoodbye /goodbye on|off\n/cleanwelcome /cleanservice on|off\n\nPlaceholders: {first} {last} {fullname} {username} {mention} {id} {chatname} {count}', back: 'help_main' },
  help_rules: { title: '<b>📜 Rules</b>\n\n/setrules /clearrules /rules\n/privaterules on|off', back: 'help_main' },
  help_locks: { title: '<b>🔒 Locks</b>\n\n/lock type [type ...]\n/unlock type\n/locks /locktypes', back: 'help_main' },
  help_flood: { title: '<b>🌊 Antiflood</b>\n\n/setflood &lt;n&gt; or off\n/flood\n/floodmode mute|kick|ban|tmute &lt;dur&gt;', back: 'help_main' },
  help_black: { title: '<b>🚫 Blocklists</b>\n\n/addblacklist word [word...]\n/rmblacklist word\n/blacklist\n/blacklistmode delete|warn|mute|kick|ban', back: 'help_main' },
  help_appr: { title: '<b>✅ Approval</b>\n\n/approve /unapprove\n/approval /approved\n/unapproveall', back: 'help_main' },
  help_pins: { title: '<b>📌 Pins</b>\n\n/pin [silent] /unpin /unpinall\n/antichannelpin on|off', back: 'help_main' },
  help_purges: { title: '<b>🧹 Purges</b>\n\n/purge (reply) /del (reply)\n/purgefrom + /purgeto', back: 'help_main' },
  help_reports: { title: '<b>🚨 Reports</b>\n\n/report (reply) — pings admins\n/reports on|off', back: 'help_main' },
  help_conn: { title: '<b>🔗 Connections</b>\n\n/connect [chatId]\n/disconnect /connection', back: 'help_main' },
  help_dis: { title: '<b>⚙️ Disabling</b>\n\n/disable cmd /enable cmd\n/disabled /disableable', back: 'help_main' },
  help_log: { title: '<b>📡 Log Channel</b>\n\n/setlog (forward msg from log channel) | /setlog &lt;channelId&gt;\n/logchannel /unsetlog', back: 'help_main' },
  help_captcha: { title: '<b>🛡️ CAPTCHA</b>\n\n/captcha on|off\n/captchamode button|math|text', back: 'help_main' },
  help_raid: { title: '<b>🛡️ AntiRaid</b>\n\n/antiraid on [duration] | off', back: 'help_main' },
  help_clean: { title: '<b>🧽 Cleaning</b>\n\n/cleanservice on|off\n/cleancommand on|off', back: 'help_main' },
  help_topics: { title: '<b>🗂️ Topics</b>\n\n/topic name (create)\n/closetopic /opentopic /renametopic /deletetopic', back: 'help_main' },
  help_fed: { title: '<b>🌐 Federations</b>\n\n/newfed name (PM)\n/joinfed id /leavefed\n/fedinfo /fban /unfban', back: 'help_main' },
  help_misc: { title: '<b>🧰 Misc</b>\n\n/id /info /ping /runs /stats /echo', back: 'help_main' },
  help_eco: { title: '<b>💰 Economy</b>\n\n/balance /daily /weekly\n/leaderboard /give &lt;amt&gt; (reply)', back: 'help_main' },
  help_games: { title: '<b>🎮 Games</b>\n\n/wordguess + /gamew &lt;5-letter&gt;\n/trivia\n/guess (soon)', back: 'help_main' },
  help_ai: { title: '<b>🤖 AI Chatbot</b>\n\nMention <b>Hinata</b> or reply to me — I respond using Groq Llama with chat memory.\nGroq AI also moderates chat for NSFW/gore/scam content.', back: 'help_main' },
  help_fmt: { title: '<b>📐 Formatting</b>\n\nNotes/welcome/filters use HTML.\n<code>&lt;b&gt; &lt;i&gt; &lt;u&gt; &lt;s&gt; &lt;code&gt; &lt;pre&gt; &lt;a href=""&gt;</code>\n\nPlaceholders: {first} {last} {fullname} {username} {mention} {id} {chatname} {count}', back: 'help_main' },
  help_lang: { title: '<b>🗣️ Languages</b>\n\nDefault: English. (Multi-language switching coming soon.)', back: 'help_main' },
  help_priv: { title: '<b>🔐 Privacy</b>\n\nAI moderation only inspects message text via Groq. No content is stored beyond a short in-memory cache (5 min).\nChat memory for the AI chatbot stores up to 10 recent messages per user/chat in MongoDB.', back: 'help_main' },
  help_io: { title: '<b>📦 Import / Export</b>\n\nComing soon — full chat-config export/import.', back: 'help_main' },
  about: { title: '<b>About Hinata</b>\n\nA Rose-grade Telegram group manager with built-in Groq AI moderation, games, economy, and an AI chatbot persona.\n\n• Telegraf 4 + MongoDB\n• Groq Llama-3 for AI', back: 'help_main' },
};

function buildKeyboard(node) {
  const rows = (node.rows || []).map((r) => r.map(([label, data]) => Markup.button.callback(label, data)));
  if (node.back) rows.push([Markup.button.callback('🔙 Back', node.back)]);
  return Markup.inlineKeyboard(rows);
}

async function handleCallbacks(ctx) {
  const data = ctx.callbackQuery?.data || '';
  if (data.startsWith('captcha:')) {
    const handled = await captchaCallback(ctx);
    if (handled) return;
  }

  if (HELP_MENU[data]) {
    const node = HELP_MENU[data];
    const kb = buildKeyboard(node);
    try {
      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption(node.title, { parse_mode: 'HTML', ...kb });
      } else {
        await ctx.editMessageText(node.title, { parse_mode: 'HTML', ...kb });
      }
    } catch {
      await ctx.reply(node.title, { parse_mode: 'HTML', ...kb });
    }
    return ctx.answerCbQuery();
  }

  return ctx.answerCbQuery();
}

module.exports = handleCallbacks;
