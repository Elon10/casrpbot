const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { EMBED_COLORS } = require("@root/config");
const { addModeration } = require("@schemas/Moderation");
const { addLoa } = require("@schemas/Loas");
const roblox = require("noblox.js")
const moment = require("moment");
const ems = require("enhanced-ms");

const express = require("express"),
    utils = require("../utils"),
    CheckAuth = require("../auth/CheckAuth"),
    router = express.Router();


router.get("/staff/moderateLog", CheckAuth, async (req, res) => {
    res.render("staff/moderateLog", {
        user: req.userInfos,
        bot: req.client,
        currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
    });
});

router.get("/staff/loaRequest", CheckAuth, async (req, res) => {
    res.render("staff/loaRequest", {
        user: req.userInfos,
        bot: req.client,
        currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
    });
});

router.post("/staff/loaRequest", CheckAuth, async (req, res) => {
    const casrp = "999354364193951815";

    const settings = await getSettings(casrp);
    const data = req.body;

    const channel = guild.channels.cache.get(settings.loas.channel_id);

    let buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("LOA_ACCEPT").setLabel("Accept").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("LOA_DENY").setLabel("Deny").setStyle(ButtonStyle.Danger),
    );

    const loaduration = data.duration;
    const duration = ems(loaduration);
    const reason = data.reason;

    let start = Date.now();
    let end = Date.now() + duration;

    const embed = new EmbedBuilder()
        .setTitle("LOA Request")
        .addFields(
            {
                name: "Staff Member",
                value: `<@${req.user.id}>`,
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

    try {
        const sentMsg = await channel.send({
            embeds: [embed],
            components: [buttonsRow],
        });

        await addLoa(sentMsg, req.user.id, reason, duration);
        return true;
    } catch (ex) {
        console.log(ex);
    }

    res.redirect(303, `/staff/loaRequest`);
});

router.post("/staff/moderateLog", CheckAuth, async (req, res) => {
    const casrp = "999354364193951815";

    const settings = await getSettings(casrp);
    const data = req.body;

    const channel = guild.channels.cache.get(settings.moderations.channel_id);

    const id = await roblox.getIdFromUsername(data.violator);
    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot',
    );

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link)
    );

    const embed = new EmbedBuilder()
        .setTitle(`Case - ${data.punishment}`)
        .setDescription(`Moderation action taken by <@${req.user.id}>`)
        .addFields(
            { 
                name: "User",
                value: info.username,
                inline: true,
            },
            {
                name: "User ID",
                value: id.toString(),
                inline: true,
            },
            {
                name: "Display Name",
                value: info.displayName,
                inline: true,
            },
            {
                name: "Account Created",
                value: moment(info.joinDate).format('LLLL'),
                inline: false,
            },
            {
                name: "Reason",
                value: data.reason,
                inline: false,
            }
        )
        .setThumbnail(avatarUrl[0].imageUrl)
        .setTimestamp()

    if (data.punishment === "Kick") embed.setColor("#FFAC1C");
    if (data.punishment === "Ban") embed.setColor(EMBED_COLORS.ERROR);
    if (data.punishment === "Warn") embed.setColor(EMBED_COLORS.WARNING);

    try {
        const sentMsg = await channel.send({
            embeds: [embed],
            components: [buttonRow],
        });

        await addModeration(sentMsg, req.user.id, data.reason);
    } catch (ex) {
        console.log(ex);
    }
})

module.exports = router;