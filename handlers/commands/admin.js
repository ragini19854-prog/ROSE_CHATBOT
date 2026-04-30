const config = require('../config/index');

const isAdmin = async (ctx, next) => {
    if (!ctx.chat || ctx.chat.type === 'private') return next();

    try {
        const member = await ctx.getChatMember(ctx.from.id);
        const isAdmin = ['administrator', 'creator'].includes(member.status);
        const isOwner = config.sudoUsers.includes(ctx.from.id) || ctx.from.id === config.ownerId;

        ctx.isAdmin = isAdmin || isOwner;
        ctx.isOwner = isOwner;
    } catch (e) {
        ctx.isAdmin = false;
        ctx.isOwner = false;
    }

    return next();
};

module.exports = isAdmin;

