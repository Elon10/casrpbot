const { EmbedBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { getUser } = require("@schemas/User");
const { addModeration } = require("@schemas/Moderation");
const { addBanBolo } = require("@schemas/BanBolo");
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
                                name: "Ban Bolo",
                                value: "Ban Bolo",
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
                description: "see logs count of a staff",
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
                if (typeof response === "boolean") return interaction.followUp("Moderation successfully logged.");
            }

            if (type === "Ban") {
                response = await logban(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Moderation successfully logged.");
            }

            if (type === "Warn") {
                response = await logwarn(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Moderation successfully logged.");
            }

            if (type === "Ban Bolo") {
                response = await logBanBolo(interaction.member, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Moderation successfully logged.")
            }

            if (type === "Other") {
                response = await logother(interaction.member, title, user, reason, data.settings);
                if (typeof response === "boolean") return interaction.followUp("Moderation successfully logged.");
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

    const staffDb = await getUser(user);
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

    if (!id) return "n";

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Edit Case").setCustomId("MODERATE_EDIT").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("MODERATE_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
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

        staffDb.logs.total += 1;
        staffDb.logs.kicks += 1;
        await staffDb.save();

        const newEmbed = new EmbedBuilder()
            .setTitle(`Case - Kick`)
            .setDescription(`Moderation action taken by ${user}\n\n:warning: **THIS USER IS CURRENTLY ON A BAN BOLO** :warning:`)
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

        if (settings.banbolos.users.includes(info.username)) sentMsg.edit({ embeds: [newEmbed] });

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

    const staffDb = await getUser(user);
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
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("MODERATE_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
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

        staffDb.logs.total += 1;
        staffDb.logs.bans += 1;
        await staffDb.save();

        if (settings.banbolos.users.includes(info.username)) {
            settings.banbolos.users.splice(settings.banbolos.users.indexOf(info.username), 1);
        }

        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function logwarn(user, member, reason, settings) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const staffDb = await getUser(user);
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
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("MODERATE_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
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

        staffDb.logs.total += 1;
        staffDb.logs.warns += 1;
        await staffDb.save();

        const newEmbed = new EmbedBuilder()
            .setTitle(`Case - Warn`)
            .setDescription(`Moderation action taken by ${user}\n\n:warning: **THIS USER IS CURRENTLY ON A BAN BOLO** :warning:`)
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

        if (settings.banbolos.users.includes(info.username)) sentMsg.edit({ embeds: [newEmbed] });

        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function logBanBolo(user, member, reason, settings) {
    if (!user.roles.cache.find((r) => settings.moderations.role.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't use this command.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }


    const staffDb = await getUser(user);
    const id = await roblox.getIdFromUsername(member);
    if (!settings.banbolos.enabled) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Ban-Bolos system is not enabled.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    const channel = user.guild.channels.cache.get(settings.banbolos.channel_id);
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

    if (settings.banbolos.users.includes(info.username)) return "User its already on a ban-bolo.";

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("User Profile").setURL(`https://roblox.com/users/${id}/profile`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setCustomId("BOLO_DELETE").setLabel("Void").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
        .setTitle("Case - Ban Bolo")
        .setDescription(`Ban Bolo by ${user}\nThis ban bolo its currently on **PENDING** status, when you ban the user run the command \`/ban-bolo end [banBoloId]\``)
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
                    value: reason,
                    inline: false,
                },
            )
            .setThumbnail(avatarUrl[0].imageUrl)
            .setFooter({ text: `Ban BoloID: ${sentMsg.id}` })

        sentMsg.edit({ embeds: [newEmbed] });

        await addBanBolo(sentMsg, user.id, reason);
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

    const staffDb = await getUser(user);
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

        staffDb.logs.total += 1;
        staffDb.logs.other += 1;
        await staffDb.save();

        const newEmbed = new EmbedBuilder()
            .setTitle(`Case - ${title || "Other"}`)
            .setDescription(`Moderation action taken by ${user}\n\n:warning: **THIS USER IS CURRENTLY ON A BAN BOLO** :warning:`)
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

        if (settings.banbolos.users.includes(info.username)) sentMsg.edit({ embeds: [newEmbed] });

        await addModeration(sentMsg, user.id, reason);
        return true;
    } catch (ex) {
        return "Failed to send moderation log."
    }
}

async function viewLogs(user, target, settings) {
    const staffDb = await getUser(target);
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
                value: staffDb.logs.total?.toString(),
                inline: true
            },
            {
                name: "Total Kicks",
                value: staffDb.logs.kicks?.toString(),
                inline: true
            },
            {
                name: "Total Bans",
                value: staffDb.logs.bans?.toString(),
                inline: true,
            },
            {
                name: "Total Warns",
                value: staffDb.logs.warns?.toString(),
                inline: true
            },
            {
                name: "Total Ban-Bolos",
                value: staffDb.logs.banbolos?.toString(),
                inline: true,
            },
            {
                name: "Others",
                value: staffDb.logs.other?.toString(),
                inline: true,
            }
        )

    return { embeds: [embed] };
}