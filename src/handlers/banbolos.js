const { getSettings } = require("@schemas/Guild");
const { findBanBolo, deleteBanBoloDb } = require("@schemas/BanBolo");
const { EMBED_COLORS, OWNER_IDS } = require("@root/config");
const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    TextInputStyle,
}  = require("discord.js");
const { getUser } = require("../database/schemas/User");

const hasPerms = (member, settings) => {
    return (    
        member.permissions.has("ManageGuild") ||
        member.roles.cache.find((r) => r.id === "1058291703167066162")
    );
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 * @param {import('discord.js').BaseGuildTextChannel} channel
 */
async function endBolo(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    if (!hasPerms(member, settings)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You don't have permission to manage ban-bolos.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const doc = await findBanBolo(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Ban-Bolo not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    if (doc.status === "ENDED") {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Ban-Bolo already ended.")
            .setColor(EMBED_COLORS)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message} message
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Ban-Bolo not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed ] };
    }

    const endedEmbed = new EmbedBuilder()
        .setTitle("Ban Bolo Ended")
        .setDescription(`Ban Bolo by <@${doc.user_id}>\n\nThis ban bolo its now on **ENDED** status.`)
        .setColor(EMBED_COLORS.SUCCESS)
        .setFooter({ text: `Approved By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

    const fields = [];
    const userField = message.embeds[0].data.fields.find((field) => field.name === "User");
    const userIdField = message.embeds[0].data.fields.find((field) => field.name === "User ID");
    const displayNameField = message.embeds[0].data.fields.find((field) => field.name === "Display Name");
    const accountCreatedField = message.embeds[0].data.fields.find((field) => field.name === "Account Created");
    const reasonField = message.embeds[0].data.fields.find((field) => field.name === "Reason");

    if (reason) fields.push({ name: "Void Reason", value: reason, inline: false });

    fields.push(userField, userIdField, displayNameField, accountCreatedField, reasonField);

    endedEmbed.addFields(fields);

    try {
        doc.status === "ENDED";
        doc.status_updates.push({ user_id: member.id, status: "ENDED", reason, timestamp: new Date() });

        let endedChannel;
        if (settings.banbolos.ended_channel) {
            endedChannel = guild.channels.cache.get(settings.banbolos.ended_channel);
        }

        if (!endedChannel) {
            await message.edit({ embeds: [endedEmbed] });
        }

        
        else {
            const sent = await endedChannel.send({ embeds: [endedEmbed] });
            doc.channel_id = endedChannel.id;
            doc.message_id = sent.id;
            await message.delete();
        }

        settings.banbolos.users.splice(settings.banbolos.users.indexOf(userField.value), 1);

        await settings.save();
        await doc.save();
    } catch (ex) {
        guild.client.logger.error("endBanBolo", ex);
        return "Failed to end ban-bolo.";
    }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function deleteBanBolo(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    const userDb = await getUser(member);

    const doc = await findBanBolo(guild.id, messageId);

    if (!OWNER_IDS.includes(member.id) || !hasPerms(member, settings)) return "You can't delete ban-bolos.";

    try {
        const message = await channel.messages.fetch({ message: messageId });   

        const deletedEmbed = new EmbedBuilder()
            .setTitle(`Voided | ${message.embeds[0].data.title}`)
            .setDescription(`Ban Bolo by <@${doc.user_id}>\n\nThis ban bolo has been deleted.`)
            .setThumbnail(message.embeds[0].data.thumbnail.url)
            .setColor(EMBED_COLORS.ERROR)
            .setFooter({ text: `Voided by ${member.user.tag}`, iconURL: member.displayAvatarURL() })

        const fields = [];
        const userField = message.embeds[0].data.fields.find((field) => field.name === "User")
        const userIdField = message.embeds[0].data.fields.find((field) => field.name === "User ID");
        const displayNameField = message.embeds[0].data.fields.find((field) => field.name === "Display Name");
        const accountCreatedField = message.embeds[0].data.fields.find((field) => field.name === "Account Created");
        const banboloReasonField = message.embeds[0].data.fields.find((field) => field.name === "Reason");

        fields.push(userField, userIdField, displayNameField, accountCreatedField, banboloReasonField);
        if (reason) fields.push({ name: "Void Reason", value: reason, inline: false });

        deletedEmbed.addFields(fields);

        let deleteChannel;
        if (settings.banbolos.delete_channel) {
            deleteChannel = guild.channels.cache.get(settings.banbolos.delete_channel);
        }

        deleteChannel.send({ embeds: [deletedEmbed] });

        settings.banbolos.users.splice(settings.banbolos.users.indexOf(userField.value), 1);
        userDb.logs.total -= 1;
        userDb.logs.banbolos -= 1;

        await channel.messages.delete(messageId);
        await settings.save();
        await userDb.save();
        await deleteBanBoloDb(guild.id, messageId, member.id, reason);
        return "Success";
    } catch (ex) {
        guild.client.logger.error("deleteModeration", ex);
        return "Failed to delete ban-bolo! Please delete manually.";
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDeleteBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Delete Ban Bolo",
            customId: "BANBOLO_DELETE_MODAL",
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
    const response = await deleteBanBolo(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp({ content: response, ephemeral: true });
}

module.exports = {
    handleDeleteBtn,
    handleDeleteModal,
    endBolo,
};