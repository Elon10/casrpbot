const { getSettings } = require("@schemas/Guild");
const { findModeration, deleteModerationDb } = require("@schemas/Moderation");
const { EMBED_COLORS, OWNER_IDS } = require("@root/config");
const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    TextInputStyle,
} = require("discord.js");
const { getUser } = require("../database/schemas/User");

const hasPerms = (member, settings) => {
    return (
        member.permissions.has("ManageGuild") ||
        member.roles.cache.find((r) => settings.moderations.staff_roles.includes(r.id))
    );
};

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

    if (doc.user_id !== member.id) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't edit another user log.")
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
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function deleteModeration(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    const userDb = await getUser(member);

    if (!OWNER_IDS.includes(member.id) || !hasPerms(member, settings)) return "You can't delete moderation logs."

    try {
        const message = await channel.messages.fetch({ message: messageId });

        const deletedEmbed = new EmbedBuilder()
            .setTitle(`Voided | ${message.embeds[0].data.title}`)
            .setDescription(message.embeds[0].data.description)
            .setThumbnail(message.embeds[0].data.thumbnail.url)
            .setColor(EMBED_COLORS.ERROR)
            .setFooter({ text: `Voided by ${member.user.tag}`, iconURL: member.displayAvatarURL() })
    
    
        const fields = [];
        const userField = message.embeds[0].data.fields.find((field) => field.name === "User")
        const userIdField = message.embeds[0].data.fields.find((field) => field.name === "User ID");
        const displayNameField = message.embeds[0].data.fields.find((field) => field.name === "Display Name");
        const accountCreatedField = message.embeds[0].data.fields.find((field) => field.name === "Account Created");
        fields.push(userField, userIdField, displayNameField, accountCreatedField);
        if (reason) fields.push({ name: "Reason", value: reason, inline: false });

        deletedEmbed.addFields(fields);

        let deleteChannel;
        if (settings.moderations.delete_channel) {
            deleteChannel = guild.channels.cache.get(settings.moderations.delete_channel);
        }

        if (message.embeds[0].data.title.includes("Kick")) {
            userDb.logs.total -= 1;
            userDb.logs.kicks -= 1;
            await userDb.save();
        }

        if (message.embeds[0].data.title.includes("Ban")) {
            userDb.logs.total -= 1;
            userDb.logs.bans -= 1;
            await userDb.save();
        }

        if (message.embeds[0].data.title.includes("Warn")) {
            userDb.logs.total -= 1;
            userDb.logs.warns -= 1;
            await userDb.save();
        }

        deleteChannel.send({ embeds: [deletedEmbed] });

        await channel.messages.delete(messageId);
        await deleteModerationDb(guild.id, messageId, member.id, reason);
        return "Success";
    } catch (ex) {
        guild.client.logger.error("deleteModeration", ex);
        return "Failed to delete moderation! Please delete manually.";
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
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDeleteBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Delete Moderation",
            customId: "MODERATE_DELETE_MODAL",
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
async function handleDeleteModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await deleteModeration(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp({ content: response, ephemeral: true });
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
    handleDeleteBtn,
    handleDeleteModal,
};