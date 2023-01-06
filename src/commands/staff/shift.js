const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getUser } = require("@schemas/User");
const datetimeDifference = require("datetime-difference");
const moment = require("moment");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "shift",
    description: "Shift system",
    category: "STAFF",
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: "start",
                description: "Start a new shift",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "end",
                description: "End the current shift",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "start") {
            response = await startShift(interaction.member, data.settings);
            if (typeof response === "boolean") return interaction.followUp("Shift successfully started.");
        }

        else if (sub === "end") {
            response = await endShift(interaction.member, data.settings);
            if (typeof response === "boolean") return interaction.followUp("Shift successfully ended.");
        }

        await interaction.followUp(response);
    }
}

async function startShift(member, settings) {
    if (!member.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    if (settings.shifts.role_add) member.roles.add(settings.shifts.role_add);

    const staffDb = await getUser(member);

    const channel = member.guild.channels.cache.get(settings.shifts.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Shifts channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const start = new Date();

    if (staffDb.shifts.current) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You're already on a shift.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const embed = new EmbedBuilder()
        .setTitle(member.user.username)
        .setDescription(`**${member}** has started a new shift.`)
        .addFields(
            {
                name: "Type",
                value: "Clocking In",
                inline: false,
            },
            {
                name: "Start Date",
                value: moment(start).format('LLLL'),
                inline: false,
            },
        )
        .setThumbnail(member.displayAvatarURL())
        .setColor(EMBED_COLORS.SUCCESS)

    staffDb.shifts.current = true;
    staffDb.shifts.startDate = start;

    await staffDb.save();
    await channel.send({ embeds: [embed] });
    return true;
}

async function endShift(member, settings) {
    if (!member.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const staffDb = await getUser(member);

    member.roles.remove(settings.shifts.role_add);

    const channel = member.guild.channels.cache.get(settings.shifts.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Shifts channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    if (!staffDb.shifts.current) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You're not on a shift.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const startDate = staffDb.shifts.startDate;
    const endDate = new Date();

    const difference = datetimeDifference(startDate, endDate);
    const elapsedTime = Object.keys(difference)
        .filter(k => !!difference[k])
        .map(k => `${ difference[k] } ${ k }`)
        .join(", ");

    const embed = new EmbedBuilder()
        .setTitle(member.user.username)
        .setDescription(`**${member}** has ended his shift.`)
        .setThumbnail(member.displayAvatarURL())
        .addFields(
            {
                name: "Type",
                value: "Clocking Out",
                inline: false,
            },
            {
                name: "Started",
                value: moment(startDate).format('LLLL'),
                inline: false,
            },
            {
                name: "Ended",
                value: moment(endDate).format('LLLL'),
                inline: false,
            },
            {
                name: "Elapsed Time",
                value: elapsedTime,
                inline: false,
            }
        )
        .setColor(EMBED_COLORS.ERROR)

    staffDb.shifts.current = false;
    staffDb.shifts.endDate = endDate;
    staffDb.shifts.total += 1;

    await staffDb.save();
    await channel.send({ embeds: [embed] });
    return true;
}