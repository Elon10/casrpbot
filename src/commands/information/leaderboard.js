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

        if (type === "Total") response = await getTotalLeaderboard(interaction.user);
        else if (type === "Bans") response = await getBansLeaderboard(interaction.user);
        else if (type === "Ban-Bolos") response = await getBanBolosLeaderboard(interaction.user);
        else if (type === "Kicks") response = await getKicksLeaderboard(interaction.user);
        else if (type === "Warns") response = await getWarnsLeaderboard(interaction.user);
        else if (type === "Others") response = await getOthersLeaderboard(interaction.user);
        else response = { embeds: [invalidLb] };

        await interaction.followUp(response);
    }
}

async function getTotalLeaderboard(author) {
    const lb = await getLogsLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.total.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Logs Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}

async function getBansLeaderboard(author) {
    const lb = await getBansLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.bans.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Bans Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}

async function getBanBolosLeaderboard(author) {
    const lb = await getBanBolosLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.banbolos.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Ban-Bolos Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}

async function getKicksLeaderboard(author) {
    const lb = await getKicksLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.kicks.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Kicks Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}

async function getWarnsLeaderboard(author) {
    const lb = await getWarnsLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.warns.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Warns Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}

async function getOthersLeaderboard(author) {
    const lb = await getOtherLb(10);

    if (lb.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("No users in the leaderboard.")
            .setColor(EMBED_COLORS.ERROR)
  
        return { embeds: [embed] };
    }

    const collector = lb
        .map((user, i) => `**#${(i + 1).toString()}** - ${escapeInlineCode(user.username)} [\`${user.logs?.other.toString()}\`]`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Total Other Leaderboard")
        .setDescription(collector)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Requested by ${author.tag}` });

    return { embeds: [embed] };
}