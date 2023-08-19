const { getUser } = require("@schemas/User");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { addModeration } = require("@schemas/Moderation");
const { addLoa } = require("@schemas/Loas");
const { addApplication } = require("@root/src/database/schemas/Apps")
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

router.get("/selector", CheckAuth, async (req, res) => {
    res.render("selector", {
        user: req.userInfos,
        currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
    });
})

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

router.get("/submit", CheckAuth, async (req, res) => {
    res.render("submit", {
        user: req.userInfos,
        userDb: await getUser(req.userInfos),
        currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
    })
})

router.get("/staff/apply", CheckAuth, async (req, res) => {
    const guild = req.client.guilds.cache.get("1115729790650036374");
    const userDb = await getUser(req.userInfos);
    const settings = await getSettings(guild);

    if (!settings.applications.enabled) {
        res.render("disabled", {
            user: req.userInfos,
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        })
    } else if (userDb.applied) {
        res.render("applyalready", {
            user: req.userInfos,
            userDb: await getUser(req.userInfos),
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        })
    } else {
        res.render("apply", {
            user: req.userInfos,
            userDb: await getUser(req.userInfos),
            currentURL: `${req.client.config.DASHBOARD.baseURL}/${req.originalUrl}`,
        })
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
    const casrp = req.client.guilds.cache.get("1115729790650036374");

    if (staffDb.staffpanel) {
        res.render("staff/banBolo", {
            user: req.userInfos,
            guild: req.client.guilds.cache.get("1115729790650036374"),
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

    const guild = req.client.guilds.cache.get("1115729790650036374");
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

    const guild = req.client.guilds.cache.get("1115729790650036374");
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

    const guild = req.client.guilds.cache.get("1115729790650036374");
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
    const guild = req.client.guilds.cache.get("1115729790650036374");
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

router.post("/staff/apply", CheckAuth, async (req, res) => {
    const data = req.body;
    const guild = req.client.guilds.cache.get("1115729790650036374");
    const settings = await getSettings(guild);
    const userDb = await getUser(req.userInfos);

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Accept").setCustomId("APPLY_ACCEPT").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setLabel("Deny").setCustomId("APPLY_DENY").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setLabel("Delete").setCustomId("APPLY_DELETE").setStyle(ButtonStyle.Danger)
    );

    const member = guild.members.cache.get(req.user.id);

    const id = await roblox.getIdFromUsername(data.roblox);
    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot',
    );

    const embed1 = new EmbedBuilder()
        .setTitle("Discord Information")
        .setColor(EMBED_COLORS.BOT_EMBED)
        .addFields(
            {
                name: "User Tag",
                value: member.user.tag,
                inline: true,
            },
            {
                name: "ID",
                value: member.id,
                inline: true,
            },
            {
                name: "Guild Joined",
                value: `<t:${Math.round(member.joinedTimestamp / 1000)}:F>`,
            },
            {
                name: "Discord Registered",
                value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:F>`,
            },
        )
        .setThumbnail(member.user.displayAvatarURL())

    const embed2 = new EmbedBuilder()
        .setTitle("Roblox Information")
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
                value: `<t:${Math.round(info.joinDate / 1000)}:F>`,
                inline: true,
            },
        )
        .setThumbnail(avatarUrl[0].imageUrl)
        .setColor(EMBED_COLORS.BOT_EMBED)

    const embed3 = new EmbedBuilder()
        .setTitle("Staff Application")
        .setDescription(`A new application by <@${req.user.id}>`)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .addFields(
            {
                name: "How old are you?",
                value: data.age,
                inline: false
            },
            {
                name: "What is your timezone?",
                value: data.timezone,
                inline: false,
            },
            {
                name: "Tell us about yourself. (EX. Hobbies, Sports, School, Clubs, etc.)",
                value: data.hobbies,
                inline: false,
            },
            {
                name: "What programming languages are you familiar?",
                value: data.codelanguages,
                inline: false,
            },
            {
                name: "Have any past experience being a moderator?",
                value: data.pastexperience,
                inline: false,
            },
            {
                name: "If you selected yes above, list the server(s) you've worked in the past. (EX. Server Name, rank, activity status, etc.)",
                value: data.serverexperience || "Empty",
                inline: false,
            },
            {
                name: "Why do you want to be a moderator at California State Roleplay?",
                value: data.whywantto,
                inline: false,
            },
            {
                name: "Tell us why you should be selected over other applicants. What skills do you have that can benefit the staff team?",
                value: data.skills,
                inline: false,
            },
            {
                name: "You hear multiple weapons being shot at the same time near gun store. As you approach the situation you see a user with an unrealistic avatar killing all users at the scene. You arrive and he begins to flee, what would you do?",
                value: data.modq1,
                inline: false,
            },
            {
                name: "You're patrolling as a red impala passes you crashing into vehicles, swerving, and unrealistically driving. You attempt to pull over the red impala but it flees, what would you do?",
                value: data.modq2,
                inline: false,
            },
            {
                name: "You moderate a user for fail roleplaying. They become upset and want to report you for admin abuse, what would you do?",
                value: data.modq3,
                inline: false,
            },
            {
                name: "You moderate a user for fail roleplaying. They become upset and starts to disrespect the server, what would you do?",
                value: data.modq4,
                inline: false,
            },
            {
                name: "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he has done nothing & has a weapon for self defense. He gives you the offenders username, what would you do?",
                value: data.modq5,
                inline: false,
            },
            {
                name: "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he was roleplaying and was shot randomly. The offender runs & leaves the game, what would you do?",
                value: data.modq6,
                inline: false,
            },
            {
                name: "As you respond to a !mod call a user comes up to you with a weapon and attempts to kill you in which he succeeds. He returns to his vehicle and flees, what would you do?",
                value: data.modq7,
                inline: false,
            },
            {
                name: "To begin, as you patrol the server as a Moderator, you notice a user using a banned weapon. You see them actively using the weapon, what would you do?",
                value: data.modq8,
                inline: false,
            },
            {
                name: "While chatting in main chat you decide to check on off topic chat and find a few users arguing, what would you do?",
                value: data.modq9,
                inline: false,
            },
            {
                name: "You are chatting with members when someone randomly insults someone that's chatting. What would you do?",
                value: data.modq10,
                inline: false,
            },
            {
                name: "You just get online and you go to check main chat and its filled with welcome messages that seem like bots, what would you do?",
                value: data.modq11,
                inline: false,
            },
            {
                name: "You are checking chats to make sure nobody is breaking the rules and while in off topic chat you see a few users ghost pinging people, what would you do?",
                value: data.modq12,
                inline: false,
            },
            {
                name: "You are in the server and you come across people using excessive profanity, what would you do?",
                value: data.modq13,
                inline: false,
            },
            {
                name: "Any questions, statements, or concerns for the reviewer?",
                value: data.modq14,
                inline: false,
            },
            {
                name: "Do you agree to not ask any staff to review your application?",
                value: data.modq15,
                inline: false,
            }
        )

    const channel = member.guild.channels.cache.get(settings.applications.channel_id);
    const reason = "New app";

    try {
        const sentMsg = await channel.send({
            embeds: [embed1, embed2, embed3],
            components: [btnRow],
        });

        await addApplication(sentMsg, req.user.id, reason);
    } catch (ex) {
        console.log(ex);
    }

    userDb.applied = true;
    await userDb.save();

    res.redirect(303, "/submit")
})

module.exports = router;
