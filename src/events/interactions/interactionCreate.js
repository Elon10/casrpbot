const { getSettings } = require("@schemas/Guild");
const { commandHandler, contextHandler, statsHandler, loasHandler, moderateHandler, boloHandler } = require("@src/handlers");
const { InteractionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').BaseInteraction} interaction
 */
module.exports = async (client, interaction) => {
    if (!interaction.guild) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Command can only be executed in the Discord Server.")
            .setColor(EMBED_COLORS.ERROR)

        return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => { });
    }

    if (interaction.isChatInputCommand()) {
        await commandHandler.handleSlashCommand(interaction);
    }

    else if (interaction.isContextMenuCommand()) {
        const embed = new EmbedBuilder()
            .setTitle("Unknown Error")
            .setDescription("Please contact <@737459216175857686>")
            .setColor(EMBED_COLORS.ERROR)

        const context = client.contextMenus.get(interaction.commandName);
        if (context) await contextHandler.handleContext(interaction, context);
        else return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
    }

    else if (interaction.isButton()) {
        switch (interaction.customId) {
            case "LOA_ACCEPT":
                return loasHandler.handleAcceptBtn(interaction);

            case "LOA_DENY":
                return loasHandler.handleDenyBtn(interaction);

            case "LOA_DELETE":
                return loasHandler.handlDeleteBtn(interaction);

            case "MODERATE_EDIT":
                return moderateHandler.handleEditBtn(interaction);

            case "MODERATE_DELETE":
                return moderateHandler.handleDeleteBtn(interaction);

            case "BOLO_DELETE":
                return boloHandler.handleDeleteBtn(interaction);
        }
    }

    else if (interaction.type === InteractionType.ModalSubmit) {
        switch (interaction.customId) {
            case "LOA_ACCEPT_MODAL":
                return loasHandler.handleAcceptModal(interaction);

            case "LOA_DENY_MODAL":
                return loasHandler.handleDenyModal(interaction);

            case "MODERATE_EDIT_MODAL":
                return moderateHandler.handleEditModal(interaction);

            case "MODERATE_DELETE_MODAL":
                return moderateHandler.handleDeleteModal(interaction);

            case "BANBOLO_DELETE_MODAL":
                return boloHandler.handleDeleteModal(interaction);
        }
    }

    const settings = await getSettings(interaction.guild);

    if (settings.stats.enabled) statsHandler.trackInteractionStats(interaction).catch(() => {});
}