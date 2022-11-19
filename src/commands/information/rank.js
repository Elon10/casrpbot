const { AttachmentBuilder, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS, IMAGE } = require("@root/config");
const { getBuffer } = require("@helpers/HttpUtils");
const { getMemberStats, getXpLb } = require("@schemas/MemberStats");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "rank",
    description: "displays member rank card",
    cooldown: 5,
    category: "STATS",
    botPermissions: ["AttachFiles"],
    command: {
        enabled: true,
        usage: "[@member|id]",
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "user",
                description: "target user",
                type: ApplicationCommandOptionType.User,
                required: false,
            },
        ],
    },

    async messageRun(message, args, data) {
        const member = (await message.guild.resolveMember(args[0])) || message.member;
        const response = await getRank(message, member, data.settings);
        await message.safeReply(response);
    },

    async interactionRun(interaction, data) {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = await interaction.guild.members.fetch(user);
        const response = await getRank(interaction, member, data.settings);
        await interaction.followUp(response);
    },
};

async function getRank({ guild }, member, settings) {
    const { user } = member;
    if (!settings.stats.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setColor(EMBED_COLORS.ERROR)
            .setDescription("Stats Tracking is disabled on the server.")

        return { embeds: [embed] };
    }

    const memberStats = await getMemberStats(guild.id, user.id);
    if (!memberStats.xp) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`**${user.tag}** is not ranked yet.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const lb = await getXpLb(guild.id, 100);
    let pos = -1;
    lb.forEach((doc, i) => {
        if (doc.member_id == user.id) {
            pos = i + 1;
        }
    });

    const xpNeeded = memberStats.level * memberStats.level * 100;

    let color = member.displayHexColor;
    if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;

    const url = new URL(`${IMAGE.BASE_API}/utils/rank-card`);
    url.searchParams.append("name", user.username);
    url.searchParams.append("discriminator", user.discriminator);
    url.searchParams.append("avatar", user.displayAvatarURL({ extension: "png", size: 128 }));
    url.searchParams.append("currentxp", memberStats.xp);
    url.searchParams.append("reqxp", xpNeeded);
    url.searchParams.append("level", memberStats.level);
    url.searchParams.append("barcolor", color);
    url.searchParams.append("status", member?.presence?.status?.toString() || "idle");
    url.searchParams.append("bgImage", "https://media.discordapp.net/attachments/999354364193951818/1043589638712999956/rank.jpg")
    if (pos !== -1) url.searchParams.append("rank", pos);

    const response = await getBuffer(url.href, {
        headers: {
            Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
        },
    });
    if (!response.success) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Failed to generate rank-card.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const attachment = new AttachmentBuilder(response.buffer, { name: "rank.png" });
    return { files: [attachment] };
}