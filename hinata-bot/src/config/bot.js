require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config/index');
const logger = require('./utils/logger');

// Bot instance
const bot = new Telegraf(config.botToken);

bot.start((ctx) => ctx.reply('🌸 Hi! I am Hinata. Ready to protect your group!'));

bot.launch()
  .then(() => logger.info('🚀 Hinata Bot started successfully'))
  .catch(err => logger.error('Bot launch failed', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;

