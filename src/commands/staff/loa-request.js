const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ApplicationCommandOptionType,
    ButtonStyle,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { addLoa } = require("@schemas/Loas");
const moment = require("moment");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "loa-request",
    description: "Submit a LOA",
    category: "STAFF",
    command: {
        enabled: false,
    },
    ownerOnly: false,
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "reason",
                description: "Reason for the LOA",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "duration",
                description: "Duration of the LOA (1w/1d/1h/1m/1s)",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    },

    async interactionRun(interaction, data) {
        const reason = interaction.options.getString("reason");
        const loaduration = interaction.options.getString("duration");
        const duration = ems(loaduration);
        const response = await submitLoa(interaction.member, reason, duration, loaduration, data.settings);
        if (typeof response === "boolean") return interaction.followUp("Your LOA request has been submitted.");
        else await interaction.followUp(response);
    },
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} reason
 * @param {object} settings
 */
async function submitLoa(member, reason, duration, loaduration, settings) {
    if (!member.roles.cache.find((r) => settings.loas.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    if (isNaN(duration)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Please provide a valid duration. Example: 1d/1h/1m/1s.")
            .setColor(EMBED_COLORS)

        return { embeds: [embed] };
    }
    if (!settings.loas.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOAS System is disabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (!settings.loas.channel_id) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOAS Channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const channel = member.guild.channels.cache.get(settings.loas.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("LOAS Channel not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    let start = Date.now();
    let end = Date.now() + duration;

    let buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("LOA_ACCEPT").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("LOA_DENY").setLabel("Deny").setStyle(ButtonStyle.Danger),
    );

    const embed = new EmbedBuilder()
        .setTitle("LOA Request")
        .setThumbnail(member.displayAvatarURL())
        .addFields(
            {
                name: "Staff Member",
                value: `<@${member.id}>`,
                inline: false,
            },
            {
                name: "Start",
                value: moment(start).format('LLLL'),
                inline: false,
            },
            {
                name: "End",
                value: moment(end).format('LLLL'),
                inline: false,
            },
            {
                name: "Duration",
                value: loaduration,
                inline: false,
            },
            {
                name: "Reason",
                value: reason,
                inline: false,
            },
        )
        .setColor(EMBED_COLORS.BOT_EMBED)

        const dmEmbed = new EmbedBuilder()
            .setTitle("Loa Request")
            .setDescription(`Hey <@${member.id}>, your LOA request its on proccess to be **accepted** or **denied** I will DM you when your loa its **accepted** or **denied**. Please be patient.`)
            .setColor(EMBED_COLORS.WARNING)
            .setThumbnail(member.displayAvatarURL())
            .addFields(
                {
                    name: "Duration",
                    value: loaduration,
                    inline: false,
                },
                {
                    name: "Reason",
                    value: reason,
                    inline: false,
                },
            )

        member.send({ embeds: [dmEmbed] });

    try {
        const sentMsg = await channel.send({
            embeds: [embed],
            components: [buttonsRow],
        });

        await addLoa(sentMsg, member.id, reason, duration);
        return true;
    } catch (ex) {
        return "Failed to send LOA request."
    }
}