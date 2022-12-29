const { ApplicationCommandOptionType, EmbedBuilder  } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getUser } = require("@schemas/User");
const datetimeDifference = require("datetime-difference");
const moment = require("moment");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "shift",
    description: "shift system",
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
                description: "start a shift",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "end",
                description: "start a shift",
                type: ApplicationCommandOptionType.Subcommand
            },
        ],
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "start") {
            response = await startShift(interaction.member, data.settings);
        }

        else if (sub === "end") {
            response = await endShift(interaction.member, data.settings);
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

    const userDb = await getUser(member);

    if (userDb.currentShift) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You are already on a shift.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const start = new Date();
    const startDate = moment(start).format('LLLL');

    const embed = new EmbedBuilder()
        .setTitle(member.user.username)
        .setDescription(`**${member}** has started a shift.`)
        .setThumbnail(member.displayAvatarURL())
        .addFields(
            {
                name: "Type",
                value: "Clocking in",
                inline: false,
            },
            {
                name: "Started At",
                value: startDate,
                inline: false,
            }
        )
        .setColor(EMBED_COLORS.SUCCESS)

    userDb.shifts.shiftStartDate = start;
    userDb.shifts.startDate = startDate;
    userDb.shifts.currentShift = true;
    await userDb.save();

    return { embeds: [embed] };
}

async function endShift(member, settings) {
    if (!member.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const userDb = await getUser(member);

    if (!userDb.shifts.currentShift) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You are not on any shift.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const startDate = userDb.shifts.shiftStartDate;
    const startd = moment(startDate).format('LLLL');

    const end = new Date();
    const endDate = moment(end).format('LLLL');

    const result = datetimeDifference(startDate, end);

    const elapsedTime = Object.keys(result)
        .filter(k => !!result[k])
        .map(k => `${ result[k] } ${ k }`)
        .join(", ");

    const embed = new EmbedBuilder()
        .setTitle(member.user.username)
        .setDescription(`**${member}** has ended a shift.`)
        .setThumbnail(member.displayAvatarURL())
        .addFields(
            {
                name: "Type",
                value: "Clocking out",
                inline: false,
            },
            {
                name: "Started At",
                value: startd,
                inline: false,
            },
            {
                name: "Ended At",
                value: endDate,
                inline: false,
            },
            {
                name: "Elapsed Time",
                value: `${elapsedTime}`,
                inline: false,
            }
        )
        .setColor(EMBED_COLORS.ERROR)

    userDb.shifts.currentShift = false;
    await userDb.save();

    return { embeds: [embed] };
}