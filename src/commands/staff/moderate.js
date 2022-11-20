const { EmbedBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { getUser } = require("@schemas/User");
const { addModeration, addSearchModeration } = require("@schemas/Moderation");
const moment = require("moment");
const roblox = require("noblox.js")

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "moderate",
    description: "Log a moderation",
    category: "STAFF",
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: "type",
                description: "Punishment",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "action",
                        description: "Choose a punishment",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            {
                                name: "Kick",
                                value: "Kick",
                            },
                            {
                                name: "Ban",
                                value: "Ban",
                            },
                            {
                                name: "Warn",
                                value: "Warn",
                            },
                            {
                                name: "Other",
                                value: "Other",
                            }
                        ],
                    },
                    {
                        name: "user",
                        description: "Roblox username",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: "reason",
                        description: "Reason for the punishment",
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "punishment",
                        description: "Other punishment",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: "count",
                description: "count",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "user to see the logs count",
                        type: ApplicationCommandOptionType.User,
                        required: false,
                    }
                ]
            },
        ],
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "type") {
            const type = interaction.options.getString("action");
            const user = interaction.options.getString("user");
            const title = interaction.options.getString("punishment");
            const reason = interaction.options.getString("reason");

            if (type === "Kick") {
                response = await logkick(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Logged");
            }

            if (type === "Ban") {
                response = await logban(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Logged");
            }

            if (type === "Warn") {
                response = await logwarn(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Logged");
            }

            if (type === "Other") {
                response = await logother(interaction.member, title, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Logged");
            }
        }

        else if (sub === "count") {
            const target = interaction.options.getUser("user") || interaction.user;
            response = await viewLogs(interaction.member, target, data.settings);
        }

        await interaction.followUp(response);
    }
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {object} settings
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} reason
 */

async function logkick(user, member, reason, settings) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const userDb = await getUser(user);
    if (!settings.moderations.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const id = await roblox.getIdFromUsername(member);
    const channel = user.guild.channels.cache.get(settings.moderations.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation logs channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot'
    )

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
    );

    const embed = new EmbedBuilder()
        .setTitle("Case - Kick")
        .setDescription(`Moderation action taken by ${user}`)
        .setColor("#FFAC1C")
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
                value: reason,
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

        userDb.total += 1;
        userDb.kicks += 1;
        await userDb.save();

        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function logban(user, member, reason, settings) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }


    const userDb = await getUser(user);
    const id = await roblox.getIdFromUsername(member);
    if (!settings.moderations.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const channel = user.guild.channels.cache.get(settings.moderations.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation logs channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot'
    )

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link)
    );

    const embed = new EmbedBuilder()
        .setTitle("Case - Ban")
        .setDescription(`Moderation action taken by ${user}`)
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
                value: reason,
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

        userDb.total += 1;
        userDb.bans += 1;
        await userDb.save();


        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function logwarn(user, member, reason) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const userDb = await getUser(user);
    const id = await roblox.getIdFromUsername(member);
    if (!settings.moderations.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const channel = user.guild.channels.cache.get(settings.moderations.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation logs channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot'
    )

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link)
    );

    const embed = new EmbedBuilder()
        .setTitle("Case - Warn")
        .setDescription(`Moderation action taken by ${user}`)
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
                value: reason,
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

        userDb.total += 1;
        userDb.warns += 1;
        await userDb.save();


        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function logother(user, title, member, reason, settings) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const userDb = await getUser(user);
    const id = await roblox.getIdFromUsername(member);
    if (!settings.moderations.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const channel = user.guild.channels.cache.get(settings.moderations.channel_id);
    if (!channel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation logs channel not configured.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const info = await roblox.getPlayerInfo(id);
    const avatarUrl = await roblox.getPlayerThumbnail(
        [id],
        '720x720',
        'png',
        false,
        'headshot'
    )

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link)
    );

    const embed = new EmbedBuilder()
        .setTitle(`Case - ${title || "Other"}`)
        .setDescription(`Moderation action taken by ${user}`)
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
                value: reason,
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

        userDb.total += 1;
        userDb.other += 1;
        await userDb.save();


        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function viewLogs(user, target, settings) {
    const userDb = await getUser(target);
    if (!settings.moderations.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Moderation system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Logs Count for ${target.username}`, iconURL: target.displayAvatarURL() })
        .setColor(EMBED_COLORS.BOT_EMBED)
        .addFields(
            {
                name: "Total Logs",
                value: userDb.total?.toString(),
                inline: true
            },
            {
                name: "Total Kicks",
                value: userDb.kicks?.toString(),
                inline: true
            },
            {
                name: "Total Bans",
                value: userDb.bans?.toString(),
                inline: true,
            },
            {
                name: "Total Warns",
                value: userDb.warns?.toString(),
                inline: true
            },
            {
                name: "Others",
                value: userDb.other?.toString(),
                inline: true,
            }
        )

    return { embeds: [embed] };
}