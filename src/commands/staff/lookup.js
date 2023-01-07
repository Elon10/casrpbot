const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const roblox = require("noblox.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "lookup",
    description: "Lookup for a user in roblox",
    category: "STAFF",
    botPermissions: ["EmbedLinks"],
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "user",
                description: "The user to lookup",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },

    async interactionRun(interaction) {
        const robloxUser = interaction.options.getString("user");
        let response;

        response = await lookupUser(interaction.member, robloxUser);

        await interaction.followUp(response);
    }
}

async function lookupUser(user, robloxUser) {
    try {
        const id = await roblox.getIdFromUsername(robloxUser);
        const info = await roblox.getPlayerInfo(id);
        const avatarUrl = await roblox.getPlayerThumbnail(
            [id],
            '720x720',
            'png',
            false,
            'headshot'
        )
    
        const embed = new EmbedBuilder()
            .setTitle(info.username)
            .setURL(`https://roblox.com/users/${id}/profile`)
            .setDescription(`**ID**: ${id}\n**Display Name**: ${info.displayName}\n**Created**: <t:${Math.round(info.joinDate / 1000)}:d>\n**Friends**: ${info.friendCount}\n**Followers**: ${info.followerCount}\n**Following**: ${info.followingCount}`)
            .setThumbnail(avatarUrl[0].imageUrl)
            .setColor(EMBED_COLORS.BOT_EMBED)
    
        return { embeds: [embed] };
    } catch (e) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("User does not exist.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
}