const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getUser } = require("@schemas/User");
const ems = require("enhanced-ms");
const prettyMs = require("pretty-ms");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "time",
    description: "Add or remove shift time to a staff member",
    category: "ADMIN",
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: "add",
                description: "Add time to a staff member",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The staff to add time",
                        type: ApplicationCommandOptionType.User,
                        required: true,
                    },
                    {
                        name: "time",
                        description: "The amount of time to add",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                name: "remove",
                description: "Remove time to a staff member",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The staff to remove time",
                        type: ApplicationCommandOptionType.User,
                        required: true,
                    },
                    {
                        name: "time",
                        description: "The amount of time to remove",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
        ],
    },

    async interactionRun(interaction) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "add") {
            const user = interaction.options.getUser("user");
            const time = interaction.options.getString("time");
            response = await addTime(interaction, user, time);
        }

        else if (sub === "remove") {
            const user = interaction.options.getUser("user");
            const time = interaction.options.getString("time");
            response = await removeTime(interaction, user, time);
        }

        await interaction.followUp(response);
    }
}

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
async function addTime({ member }, user, time) {
    const staffDb = await getUser(user);
    const timeadd = ems(time);

    const roles = ["1058291691871813714", "1071480011749589156", "1058291689053241384", "1058291688113717359", "1058291687027388446", "1058291685752315984", "1058291683495780442", "1061647806680551444", "1058291679322460200", "1058291677648912405", "1058291676600352838", "1058291674633228328"];

    if (!member.roles.cache.find((r) => roles.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't manage the time.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    staffDb.shifts.timetotal += timeadd;
    await staffDb.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Successfully added **${prettyMs(timeadd)}** to ${user}.`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(EMBED_COLORS.SUCCESS)
        .setFooter({ text: `Added By ${member.tag}`, iconURL: member.displayAvatarURL() })

    return { embeds: [embed] };
}

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
async function removeTime({ member }, user, time) {
    const staffDb = await getUser(user);
    const timeremove = ems(time);

    const roles = ["1058291691871813714", "1071480011749589156", "1058291689053241384", "1058291688113717359", "1058291687027388446", "1058291685752315984", "1058291683495780442", "1061647806680551444", "1058291679322460200", "1058291677648912405", "1058291676600352838", "1058291674633228328"];

    if (!member.roles.cache.find((r) => roles.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't manage the time.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    staffDb.shifts.timetotal -= timeremove;
    await staffDb.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Successfully removed **${prettyMs(timeremove)}** to ${user}.`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(EMBED_COLORS.SUCCESS)
        .setFooter({ text: `Removed By ${member.tag}`, iconURL: member.displayAvatarURL() })

    return { embeds: [embed] };
}