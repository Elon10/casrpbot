const { getUser } = require("@schemas/User");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { addModeration } = require("@schemas/Moderation");
const { endBolo } = require("@handlers/banbolos");
const { addLoa } = require("@schemas/Loas");
const roblox = require("noblox.js")
const { addBanBolo } = require("@schemas/BanBolo");
const moment = require("moment");
const ems = require("enhanced-ms");
const { getSettings } = require("@schemas/Guild");

const express = require("express"),
    CheckAuth = require("../auth/CheckAuth"),
    router = express.Router();

router.get("/", CheckAuth, async (req, res) => {
    res.redirect("/staff/homePage");
});



router.get("/staff/homePage", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);

    if (userDb.staffpanel) {
        res.render("homePage", {
            user: req.userInfos,
            staffDb: await getUser(req.userInfos),
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.get("/staff/announcements", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);

    if (userDb.staffpanel) {
        res.render("staff/announcements", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.get("/staff/banBolo", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);
    const casrp = req.client.guilds.cache.get("999354364193951815");

    if (userDb.staffpanel) {
        res.render("staff/banBolo", {
            user: req.userInfos,
            guild: req.client.guilds.cache.get("999354364193951815"),
            casrpDb: await getSettings(casrp),
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.get("/staff/moderateLog", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);

    if (userDb.staffpanel) {
        res.render("staff/moderateLog", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.get("/staff/loaRequest", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);

    if (userDb.staffpanel) {
        res.render("staff/loaRequest", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.get("/staff/shiftManagement", CheckAuth, async (req, res) => {
    const userDb = await getUser(req.userInfos);

    if (userDb.staffpanel) {
        res.render("staff/shiftManagement", {
            user: req.userInfos,
            staffDb: await getUser(req.userInfos),
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    } else {
        res.render("notAllowed", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        });
    }
})

router.post("/staff/loaRequest", CheckAuth, async (req, res) => {

    const guild = req.client.guilds.cache.get("999354364193951815");
    const data = req.body;

    const channel = guild.channels.cache.get("999354364193951818");

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
    } catch (ex) {
        console.log(ex);
    }

    res.redirect(303, `/staff/loaRequest`);
});

router.post("/staff/moderateLog", CheckAuth, async (req, res) => {
    const data = req.body;

    const guild = req.client.guilds.cache.get("999354364193951815");
    const settings = await getSettings(guild);
    const channel = guild.channels.cache.get(settings.moderations.channel_id);
    const userDb = await getUser(req.userInfos);

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
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("MODERATE_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
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

    if (data.punishment === "Kick") {
        embed.setColor("#FFAC1C");

        userDb.logs.total += 1;
        userDb.logs.kicks +=1;

        await userDb.save();
    }
    if (data.punishment === "Ban") {
        embed.setColor(EMBED_COLORS.ERROR);
        if (settings.banbolos.users.includes(info.username)) {
            settings.banbolos.users.splice(settings.banbolos.users.indexOf(info.username), 1);
        }

        userDb.logs.total += 1;
        userDb.logs.bans +=1;

        await userDb.save();
    }
    if (data.punishment === "Warn") {
        embed.setColor(EMBED_COLORS.WARNING);

        userDb.logs.total += 1;
        userDb.logs.warns +=1;

        await userDb.save();
    }

    if (data.punishment === "Other") {
        embed.setColor(EMBED_COLORS.WARNING);
        embed.setTitle(`Case - ${data.otherpunish}`)

        userDb.logs.total += 1;
        userDb.logs.other += 1;
    }

    try {
        const sentMsg = await channel.send({
            embeds: [embed],
            components: [buttonRow],
        });

        const newEmbed = new EmbedBuilder()
        .setTitle(`Case - ${data.punishment}`)
        .setDescription(`Moderation action taken by <@${req.user.id}>\n\n:warning: **THIS USER IS CURRENTLY ON A BAN BOLO** :warning:`)
        .setColor(EMBED_COLORS.WARNING)
        .addFields(
            {
                name: "User",
                value: info.username,
                inline: true
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
                inline: true,
            },
            {
                name: "Reason",
                value: data.reason,
                inline: false,
            },
        )
        .setThumbnail(avatarUrl[0].imageUrl)
        .setTimestamp()

        if (settings.banbolos.users.includes(info.username)) sentMsg.edit({ embeds: [newEmbed] });

        await addModeration(sentMsg, req.user.id, data.reason);
    } catch (ex) {
        console.log(ex);
    }

    res.redirect(303, "/staff/moderateLog");
})

router.post("/staff/banBolo", CheckAuth, async (req, res) => {
    const data = req.body;

    const guild = req.client.guilds.cache.get("999354364193951815");
    const user = guild.members.cache.get(req.user.id);

    const settings = await getSettings(guild);

    const channel = user.guild.channels.cache.get(settings.moderations.channel_id);

    const id = await roblox.getIdFromUsername(data.violator);
    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot',
    );

    if (settings.banbolos.users.includes(info.username)) return res.redirect(303, "/staff/banBolo");

    const userDb = await getUser(req.userInfos);

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("BOLO_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
        .setTitle("Case - Ban Bolo")
        .setDescription(`Ban Bolo by <@${req.user.id}>\nThis ban bolo its currently on **PENDING** status, when you ban the user run the command \`/ban-bolo end [banBoloId]\``)
        .setColor(EMBED_COLORS.ERROR)
        .addFields(
            {
                name: "User",
                value: info.username,
                inline: true
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
                inline: true,
            },
            {
                name: "Reason",
                value: data.reason,
                inline: false,
            },
        )
        .setThumbnail(avatarUrl[0].imageUrl)
        .setTimestamp()

    try {
        const sentMsg = await channel.send({
            embeds: [embed],
            components: [buttonRow],
        });

        userDb.logs.total += 1;
        userDb.logs.banbolos += 1;
        await userDb.save();

        settings.banbolos.users.push(info.username);
        await settings.save();

        const newEmbed = new EmbedBuilder()
            .setTitle("Case - Ban Bolo")
            .setDescription(`Ban Bolo by ${user}\n\nThis ban bolo its currently on **PENDING** status, when you ban the user run the command \`/ban-bolo end [banBoloId]\``)
            .setColor(EMBED_COLORS.ERROR)
            .addFields(
                {
                    name: "User",
                    value: info.username,
                    inline: true
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
                    inline: true,
                },
                {
                    name: "Reason",
                    value: data.reason,
                    inline: false,
                },
            )
            .setThumbnail(avatarUrl[0].imageUrl)
            .setFooter({ text: `Ban BoloID: ${sentMsg.id}` })

        sentMsg.edit({ embeds: [newEmbed] });

        await addBanBolo(sentMsg, user.id, data.reason);
    } catch (ex) {
        console.log(ex);
    }

    res.redirect(303, "/staff/banBolo");
})

module.exports = router;