const { getUser } = require("@schemas/User");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { addModeration } = require("@schemas/Moderation");
const { addLoa } = require("@schemas/Loas");
const roblox = require("noblox.js")
const { addBanBolo } = require("@schemas/BanBolo");
const moment = require("moment");
const ems = require("enhanced-ms");
const { getSettings } = require("@schemas/Guild");
const datetimeDifference = require("datetime-difference");

const express = require("express"),
    CheckAuth = require("../auth/CheckAuth"),
    router = express.Router();

router.get("/", CheckAuth, async (req, res) => {
    res.redirect("/staff/homePage");
});


router.get("/staff/homePage", CheckAuth, async (req, res) => {
    const staffDb = await getUser(req.userInfos);

    if (staffDb.staffpanel) {
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
    const staffDb = await getUser(req.userInfos);

    if (staffDb.staffpanel) {
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
    const staffDb = await getUser(req.userInfos);
    const casrp = req.client.guilds.cache.get("924038453568602162");

    if (staffDb.staffpanel) {
        res.render("staff/banBolo", {
            user: req.userInfos,
            guild: req.client.guilds.cache.get("924038453568602162"),
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
    const staffDb = await getUser(req.userInfos);

    if (staffDb.staffpanel) {
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
    const staffDb = await getUser(req.userInfos);

    if (staffDb.staffpanel) {
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
    const staffDb = await getUser(req.userInfos);

    if (staffDb.staffpanel) {
        res.render("staff/shiftManagement", {
            user: req.userInfos,
            staffDb: await getUser(req.userInfos),
            moment: require("moment"),
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

    const guild = req.client.guilds.cache.get("924038453568602162");
    const data = req.body;

    const settings = await getSettings(guild);

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
    } catch (ex) {
        console.log(ex);
    }

    res.redirect(303, `/staff/loaRequest`);
});

router.post("/staff/moderateLog", CheckAuth, async (req, res) => {
    const data = req.body;

    const guild = req.client.guilds.cache.get("924038453568602162");
    const settings = await getSettings(guild);
    const channel = guild.channels.cache.get(settings.moderations.channel_id);
    const staffDb = await getUser(req.userInfos);

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

        staffDb.logs.total += 1;
        staffDb.logs.kicks += 1;

        await staffDb.save();
    }
    if (data.punishment === "Ban") {
        embed.setColor(EMBED_COLORS.ERROR);
        if (settings.banbolos.users.includes(info.username)) {
            settings.banbolos.users.splice(settings.banbolos.users.indexOf(info.username), 1);
        }

        staffDb.logs.total += 1;
        staffDb.logs.bans += 1;

        await staffDb.save();
    }
    if (data.punishment === "Warn") {
        embed.setColor(EMBED_COLORS.WARNING);

        staffDb.logs.total += 1;
        staffDb.logs.warns += 1;

        await staffDb.save();
    }

    if (data.punishment === "Other") {
        embed.setColor(EMBED_COLORS.WARNING);
        embed.setTitle(`Case - ${data.otherpunish}`)

        staffDb.logs.total += 1;
        staffDb.logs.other += 1;
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

    const guild = req.client.guilds.cache.get("924038453568602162");
    const user = guild.members.cache.get(req.user.id);

    const settings = await getSettings(guild);

    const channel = user.guild.channels.cache.get(settings.banbolos.channel_id);

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

    const staffDb = await getUser(req.userInfos);

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

        staffDb.logs.total += 1;
        staffDb.logs.banbolos += 1;
        await staffDb.save();

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

router.post("/staff/shiftManagement", CheckAuth, async (req, res) => {
    const data = req.body;
    const staffDb = await getUser(req.userInfos);
    const guild = req.client.guilds.cache.get("924038453568602162");
    const user = guild.members.cache.get(req.user.id);

    const settings = await getSettings(guild);
    const channel = user.guild.channels.cache.get(settings.shifts.channel_id);

    if (Object.prototype.hasOwnProperty.call(data, "shiftStart")) {
        const start = new Date();

        if (settings.shifts.role_add) user.roles.add(settings.shifts.role_add);

        const embed = new EmbedBuilder()
            .setTitle(req.user.username)
            .setDescription(`**${user}** has started a new shift.`)
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
            .setThumbnail(user.displayAvatarURL())
            .setColor(EMBED_COLORS.SUCCESS)

        staffDb.shifts.current = true;
        staffDb.shifts.startDate = start;

        await staffDb.save();

        channel.send({ embeds: [embed] });
    }

    if (Object.prototype.hasOwnProperty.call(data, "shiftEnd")) {
        const startDate = staffDb.shifts.startDate;
        const endDate = new Date();

        const difference = datetimeDifference(startDate, endDate);
        const elapsedTime = Object.keys(difference)
            .filter(k => !!difference[k])
            .map(k => `${difference[k]} ${k}`)
            .join(", ");

        if (user.roles.cache.find((r) => settings.shifts.role_add.includes(r.id))) {
            user.roles.remove(settings.shifts.role_add);
        }

        const embed = new EmbedBuilder()
            .setTitle(req.user.username)
            .setDescription(`**${user}** has ended his shift.`)
            .setThumbnail(user.displayAvatarURL())
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

        const start = Date.parse(startDate);
        const end = Date.parse(endDate);

        const totalTime = (end - start);

        staffDb.shifts.current = false;
        staffDb.shifts.timetotal += totalTime;
        staffDb.shifts.endDate = endDate;
        staffDb.shifts.total += 1;

        await staffDb.save();

        channel.send({ embeds: [embed] });
    }

    res.redirect(303, "/staff/shiftManagement");
})

module.exports = router;