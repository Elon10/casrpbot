const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (guild) => {
    if (!guild.available) return;
    if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true }).catch(() => {});
    await registerGuild(guild);
}