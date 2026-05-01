const config = require('../config/index');

const adminCache = new Map();
const TTL = 60_000;

async function isAdmin(ctx, next) {
  if (!ctx.from) return next ? next() : null;

  const sudo = ctx.from.id === config.ownerId || config.sudoUsers.includes(ctx.from.id);
  ctx.isOwner = sudo;

  if (!ctx.chat || ctx.chat.type === 'private') {
    ctx.isAdmin = sudo;
    return next ? next() : null;
  }

  const key = `${ctx.chat.id}:${ctx.from.id}`;
  const cached = adminCache.get(key);
  if (cached && cached.at > Date.now() - TTL) {
    ctx.isAdmin = cached.value || sudo;
    return next ? next() : null;
  }

  try {
    const member = await ctx.getChatMember(ctx.from.id);
    const isAdminStatus = ['administrator', 'creator'].includes(member.status);
    ctx.isAdmin = isAdminStatus || sudo;
    ctx.chatMember = member;
    adminCache.set(key, { value: isAdminStatus, at: Date.now() });
  } catch {
    ctx.isAdmin = sudo;
  }

  return next ? next() : null;
}

function requireAdmin(handler) {
  return async (ctx) => {
    await isAdmin(ctx);
    if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
    return handler(ctx);
  };
}

function requireOwner(handler) {
  return async (ctx) => {
    await isAdmin(ctx);
    if (!ctx.isOwner) return ctx.reply('❌ Owner only.');
    return handler(ctx);
  };
}

module.exports = isAdmin;
module.exports.isAdmin = isAdmin;
module.exports.requireAdmin = requireAdmin;
module.exports.requireOwner = requireOwner;
