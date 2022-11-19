const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (guild) => {
    if (!guild.available) return;

    const settings = await getSettings(guild);
    settings.data.leftAt = new Date();
    await settings.save();
}