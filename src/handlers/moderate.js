const { getSettings } = require("@schemas/Guild");
const { findModeration } = require("@schemas/Moderation");
const { EMBED_COLORS } = require("@root/config");
const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    TextInputStyle,
} = require("discord.js");

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function editModeration(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    const doc = await findModeration(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation log not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (doc.status === "APPROVED") {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation already edited.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message}
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        return "Moderation log not found.";
    }

    const editedEmbed = new EmbedBuilder()
        .setTitle(`Edited | ${message.embeds[0].data.title}`)
        .setDescription(message.embeds[0].data.description)
        .setThumbnail(message.embeds[0].data.thumbnail.url)
        .setColor(message.embeds[0].data.color)


    const fields = [];
    const userField = message.embeds[0].data.fields.find((field) => field.name === "User")
    const userIdField = message.embeds[0].data.fields.find((field) => field.name === "User ID");
    const displayNameField = message.embeds[0].data.fields.find((field) => field.name === "Display Name");
    const accountCreatedField = message.embeds[0].data.fields.find((field) => field.name === "Account Created");
    fields.push(userField, userIdField, displayNameField, accountCreatedField);
    if (reason) fields.push({ name: "Reason", value: reason, inline: false });

    editedEmbed.addFields(fields);

    try {
        doc.status = "APPROVED";
        doc.status_updates.push({ user_id: member.id, status: "APPROVED", reason, timestamp: new Date() });

        let approveChannel;
        if (settings.moderations.approved_channel) {
            approveChannel = guild.channels.cache.get(settings.moderations.approved_channel);
        }

        if (!approveChannel) {
            await message.edit({ embeds: [editedEmbed], components: [message.components[0]] });
            await message.reactions.removeAll();
        }

        else {
            const sent = await approveChannel.send({ embeds: [editedEmbed], components: [message.components[0]] });
            doc.channel_id = approveChannel.id;
            doc.message_id = sent.id;
            await message.delete();
        }

        await doc.save();
        return "Successfully edited moderation log.";
    } catch (ex) {
        guild.client.logger.error("approveSuggestion", ex);
        return "Failed to edit moderation log.";
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleEditBtn(interaction, user) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Edit Moderation",
            customId: "MODERATE_EDIT_MODAL",
            components: [
                new ActionRowBuilder().addComponents([
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("reason")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(4),
                ]),
            ],
        })
    );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleEditModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await editModeration(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp(response);
}

module.exports = {
    handleEditBtn,
    handleEditModal,
    editModeration,
};