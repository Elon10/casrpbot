const { commandHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS, EMBED_COLORS, DASHBOARD } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
    if (!message.guild || message.author.bot) return;
    const settings = await getSettings(message.guild);

    let isCommand = false;
    if (PREFIX_COMMANDS.ENABLED) {
        if (message.content && message.content.startsWith(settings.prefix)) {

            if (message.content.includes("!dashboard")) {
                const embed = new EmbedBuilder()
                    .setTitle("Staff Panel")
                    .setDescription("Click the button below to go to the **Staff Panel**.")
                    .setColor(EMBED_COLORS.BOT_EMBED)

                const btnRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel("Link").setURL(DASHBOARD.baseURL).setStyle(ButtonStyle.Link),
                );

                return message.reply({ embeds: [embed], components: [btnRow] });
            }

            const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
            const cmd = client.getCommand(invoke);
            if (cmd) {
                isCommand = true;
                commandHandler.handlePrefixCommand(message, cmd, settings);
            }
        }
    }

    if (settings.stats.enabled) await statsHandler.trackMessageStats(message, isCommand, settings);
};