require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config/index');
const logger = require('./utils/logger');

// Load DB
require('./models/index');

// Import handlers
const startCommand = require('./handlers/commands/start');
const handleCallbacks = require('./handlers/callbacks');

const bot = new Telegraf(config.botToken);

// Commands
bot.start(startCommand);
bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));

// Callbacks
bot.on('callback_query', handleCallbacks);

// TODO: Add AI Moderation + Group Commands later

bot.launch()
  .then(() => logger.info('🚀 Hinata Bot is running...'))
  .catch(err => logger.error('Launch Error', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
