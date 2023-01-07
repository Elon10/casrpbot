const { EmbedBuilder, escapeInlineCode, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getLogsLb, getBanBolosLb, getBansLb, getKicksLb, getOtherLb, getWarnsLb } = require("@schemas/User");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "leaderboard",
    description: "Display various types of leaderboards",
    category: "INFORMATION",
    botPermissions: ["EmbedLinks"],
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "type",
                description: "The type of leaderboard to display",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "Total",
                        value: "Total",
                    },
                    {
                        name: "Bans",
                        value: "Bans",
                    },
                    {
                        name: "Ban-Bolos",
                        value: "Ban-Bolos",
                    },
                    {
                        name: "Kicks",
                        value: "Kicks",
                    },
                    {
                        name: "Warns",
                        value: "Warns",
                    },
                    {
                        name: "Others",
                        value: "Others"
                    },
                ],
            },
        ],
    },

    async interactionRun(interaction) {
        const type = interaction.options.getString("type");
        let response;

        const invalidLb = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Invalid leaderboard type.")
            .setColor(EMBED_COLORS.ERROR)

        if (type === "Total") response = await getTotalLeaderboard(interaction.member);
        else if (type === "Bans") response = await getBansLeaderboard(interaction.member);
        else if (type === "Ban-Bolos") response = await getBanBolosLeaderboard(interaction.member);
        else if (type === "Kicks") response = await getKicksLeaderboard(interaction.member);
        else if (type === "Warns") response = await getWarnsLeaderboard(interaction.member);
        else if (type === "Others") response = await getOthersLeaderboard(interaction.member);
        else response = { embeds: [invalidLb] };

        await interaction.followUp(response);
    }
}

/**
 * @param {import('@structures/BotClient')} client
 */

async function getTotalLeaderboard(member, client) {
    const lb = await getLogsLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)}  [\`${user.logs?.total}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Logs Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}

async function getBansLeaderboard(member) {
    const lb = await getBansLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)} [\`${user.logs?.bans}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Bans Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}

async function getBanBolosLeaderboard(member) {
    const lb = await getBanBolosLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)} [\`${user.logs?.banbolos}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Ban-Bolos Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}

async function getKicksLeaderboard(member) {
    const lb = await getKicksLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)} [\`${user.logs?.kicks}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Kicks Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}

async function getWarnsLeaderboard(member) {
    const lb = await getWarnsLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)} [\`${user.logs?.warns}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Warns Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}

async function getOthersLeaderboard(member) {
    const lb = await getOtherLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const guild = member.guild;

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${guild.members.cache.get(user._id)} [\`${user.logs?.other}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Other Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${member.user.tag}` });

    return { embeds: [embed] };
}