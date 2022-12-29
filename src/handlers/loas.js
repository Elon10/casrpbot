const { getSettings } = require("@schemas/Guild");
const { findLoa } = require("@schemas/Loas");
const { EMBED_COLORS } = require("@root/config");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    ButtonStyle,
    TextInputStyle,
} = require("discord.js");


const hasPerms = (member, settings) => {
    return (
        member.permissions.has("ManageGuild") || 
        member.roles.cache.find((r) => settings.loas.staff_roles.includes(r.id))
    )
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function acceptLoa(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    if (!hasPerms(member, settings)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You don't have permission to manage LOAS.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const doc = await findLoa(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOA not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (doc.status === "APPROVED") {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOA already accepted.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message} message
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        return "LOA not found.";
    }

    let buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("LOA_ACCEPT")
            .setLabel("Accept")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
        new ButtonBuilder().setCustomId("LOA_DENY").setLabel("Deny").setStyle(ButtonStyle.Danger)
    );

    const approvedEmbed = new EmbedBuilder()
        .setTitle("LOA Accepted")
        .setColor(EMBED_COLORS.SUCCESS)
        .setFooter({ text: `Approved By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

    const fields = [];
    const staffUserField = message.embeds[0].data.fields.find((field) => field.name === "Staff Member");
    const startField = message.embeds[0].data.fields.find((field) => field.name === "Start");
    const endField = message.embeds[0].data.fields.find((field) => field.name === "End");
    const durationField = message.embeds[0].data.fields.find((field) => field.name === "Duration");
    const reasonField = message.embeds[0].data.fields.find((field) => field.name === "Reason");

    fields.push(staffUserField, startField, endField, durationField, reasonField);

    if (reason) fields.push({ name: "Note", value: reason });
    approvedEmbed.addFields(fields);

    try {
        doc.status = "APPROVED";
        doc.status_updates.push({ user_id: member.id, status: "APPROVED", reason, timestamp: new Date() });

        let approvedChannel;
        if (settings.loas.approved_channel) {
            approvedChannel = guild.channels.cache.get(settings.loas.approved_channel);
        }

        if (!approvedChannel) {
            await message.edit({ embeds: [approvedEmbed], components: [buttonsRow] });
        }

        else {
            const sent = await approvedChannel.send({ embeds: [approvedEmbed], components: [buttonsRow] });
            doc.channel_id = approvedChannel.id;
            doc.message_id = sent.id;
            await message.delete();
        }

        await doc.save();
        return "LOA Request successfully accepted.";
    } catch (ex) {
        return "Failed to accept LOA."
    }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function denyLoa(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    if (!hasPerms(member, settings)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You don't have permission to manage LOAS.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const doc = await findLoa(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOA not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (doc.is_rejected) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOA already rejected.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message} message
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        return "LOA not found.";
    }

    let buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("LOA_ACCEPT").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("LOA_DENY").setLabel("Deny").setStyle(ButtonStyle.Danger).setDisabled(true),
    );

    const rejectedEmbed = new EmbedBuilder()
        .setTitle("LOA Rejected")
        .setColor(EMBED_COLORS.ERROR)
        .setThumbnail(message.embeds[0].data.thumbnail.url)
        .setFooter({ text: `Rejected By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

    const fields = [];
    const staffUserField = message.embeds[0].data.fields.find((field) => field.name === "Staff Member");
    const startField = message.embeds[0].data.fields.find((field) => field.name === "Start");
    const endField = message.embeds[0].data.fields.find((field) => field.name === "End");
    const durationField = message.embeds[0].data.fields.find((field) => field.name === "Duration");
    const reasonField = message.embeds[0].data.fields.find((field) => field.name === "Reason");

    fields.push(staffUserField, startField, endField, durationField, reasonField);

    if (reason) fields.push({ name: "Note", value: reason });
    rejectedEmbed.addFields(fields);

    try {
        doc.status = "REJECTED";
        doc.status_updates.push({ user_id: member.id, status: "REJECTED", reason, timestamp: new Date() });

        let rejectChannel;
        if (settings.loas.rejected_channel) {
            rejectChannel = guild.channels.cache.get(settings.loas.rejected_channel);
        }

        if (!rejectChannel) {
            await message.edit({ embeds: [rejectedEmbed], components: [buttonsRow] });
            await message.reactions.removeAll();
        }

        else {
            const sent = await rejectChannel.send({ embeds: [rejectedEmbed], components: [buttonsRow] });
            doc.channel_id = rejectChannel.id;
            doc.message_id = sent.id;
            await message.delete();
        }

        await doc.save();
        return "LOA Request successfully rejected.";
    } catch (ex) {
        return "Failed to deny LOA.";
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleAcceptBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Accept LOA",
            customId: "LOA_ACCEPT_MODAL",
            components: [
                new ActionRowBuilder().addComponents([
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Note")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(2),
                ]),
            ],
        })
    );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleAcceptModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await acceptLoa(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDenyBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Deny LOA",
            customId: "LOA_DENY_MODAL",
            components: [
                new ActionRowBuilder().addComponents([
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Note")
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
async function handleDenyModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await denyLoa(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp(response);
}

module.exports = {
    handleDenyModal,
    handleDenyBtn,
    handleAcceptBtn,
    handleAcceptModal,
    acceptLoa,
    denyLoa,
};