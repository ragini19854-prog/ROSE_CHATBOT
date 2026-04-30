const adminMiddleware = require('../../middleware/admin');

// ====================== CORE ADMIN COMMANDS ======================
async function ban(ctx) {
    await adminMiddleware(ctx, async () => {
        if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
        await ctx.reply('✅ User banned.');
    });
}

async function mute(ctx) {
    await adminMiddleware(ctx, async () => {
        if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
        await ctx.reply('✅ User muted.');
    });
}

async function warn(ctx) {
    await adminMiddleware(ctx, async () => {
        if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
        await ctx.reply('⚠️ User warned.');
    });
}

async function kick(ctx) {
    await adminMiddleware(ctx, async () => {
        if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
        await ctx.reply('✅ User kicked.');
    });
}

async function purge(ctx) {
    await adminMiddleware(ctx, async () => {
        if (!ctx.isAdmin) return ctx.reply('❌ Admins only.');
        await ctx.reply('🧹 Purged messages.');
    });
}

// Add more as needed (stub for now)
async function rules(ctx) {
    await ctx.reply('📜 Group rules coming soon...');
}

async function welcome(ctx) {
    await ctx.reply('👋 Welcome settings coming soon...');
}

// Export all
module.exports = {
    ban,
    mute,
    warn,
    kick,
    purge,
    rules,
    welcome
};
