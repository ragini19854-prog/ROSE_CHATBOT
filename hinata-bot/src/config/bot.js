require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config/index');
const logger = require('./utils/logger');
const startCommand = require('./handlers/commands/start');
const handleCallbacks = require('./handlers/callbacks');

const bot = new Telegraf(config.botToken);

// Start Command
bot.start(startCommand);

// Callbacks
bot.on('callback_query', handleCallbacks);

// Basic ping
bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));

bot.launch()
  .then(() => logger.info('🚀 Hinata Bot started successfully'))
  .catch(err => logger.error('Bot launch failed', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
