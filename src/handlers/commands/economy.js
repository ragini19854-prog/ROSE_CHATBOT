const { Wallet } = require('../../models');
const { safeReply, mention } = require('../../utils/helpers');

async function getOrCreate(userId) {
  let w = await Wallet.findOne({ userId });
  if (!w) w = await Wallet.create({ userId });
  return w;
}

const balance = async (ctx) => {
  const u = ctx.message.reply_to_message?.from || ctx.from;
  const w = await getOrCreate(u.id);
  await safeReply(ctx, `💰 ${mention(u)}\nWallet: <b>${w.coins}</b>\nBank: <b>${w.bank}</b>\nStreak: <b>${w.streak}</b>`);
};

const daily = async (ctx) => {
  const w = await getOrCreate(ctx.from.id);
  const now = new Date();
  if (w.lastDaily && now - w.lastDaily < 24 * 3600 * 1000) {
    const left = Math.ceil((24 * 3600 * 1000 - (now - w.lastDaily)) / 3600000);
    return safeReply(ctx, `⏳ Already claimed. Try again in <b>${left}h</b>.`);
  }
  const wasYesterday = w.lastDaily && now - w.lastDaily < 48 * 3600 * 1000;
  w.streak = wasYesterday ? w.streak + 1 : 1;
  const reward = 100 + Math.min(w.streak, 30) * 10;
  w.coins += reward;
  w.lastDaily = now;
  await w.save();
  await safeReply(ctx, `🎁 +<b>${reward}</b> coins (streak: <b>${w.streak}</b>) → balance <b>${w.coins}</b>`);
};

const weekly = async (ctx) => {
  const w = await getOrCreate(ctx.from.id);
  const now = new Date();
  if (w.lastWeekly && now - w.lastWeekly < 7 * 24 * 3600 * 1000) {
    const left = Math.ceil((7 * 24 * 3600 * 1000 - (now - w.lastWeekly)) / (24 * 3600000));
    return safeReply(ctx, `⏳ Try again in <b>${left}d</b>.`);
  }
  const reward = 1000;
  w.coins += reward;
  w.lastWeekly = now;
  await w.save();
  await safeReply(ctx, `🎁 +<b>${reward}</b> coins → balance <b>${w.coins}</b>`);
};

const leaderboard = async (ctx) => {
  const top = await Wallet.find().sort({ coins: -1 }).limit(10).lean();
  if (top.length === 0) return safeReply(ctx, 'No wallets yet.');
  let txt = '🏆 <b>Top 10 Richest</b>\n';
  for (let i = 0; i < top.length; i++) {
    try {
      const m = await ctx.telegram.getChat(top[i].userId);
      txt += `${i + 1}. ${mention(m)} — <b>${top[i].coins}</b>\n`;
    } catch {
      txt += `${i + 1}. <code>${top[i].userId}</code> — <b>${top[i].coins}</b>\n`;
    }
  }
  await safeReply(ctx, txt);
};

const give = async (ctx) => {
  const parts = (ctx.message.text || '').split(/\s+/).slice(1);
  const target = ctx.message.reply_to_message?.from;
  const amount = parseInt(target ? parts[0] : parts[1], 10);
  if (!target || !amount || amount < 1) return safeReply(ctx, '❌ Usage: reply to a user → <code>/give &lt;amount&gt;</code>');
  const w = await getOrCreate(ctx.from.id);
  if (w.coins < amount) return safeReply(ctx, '❌ Not enough coins.');
  const w2 = await getOrCreate(target.id);
  w.coins -= amount; w2.coins += amount;
  await w.save(); await w2.save();
  await safeReply(ctx, `💸 ${mention(ctx.from)} → ${mention(target)} : <b>${amount}</b>`);
};

module.exports = { balance, daily, weekly, leaderboard, give };
