const { ApplicationCommandOptionType, EmbedBuilder, ChannelType } = require("discord.js");
const { parsePermissions } = require("@helpers/Utils");
const { EMBED_COLORS } = require("@root/config");

const CHANNEL_PERMS = ["ViewChannel", "SendMessages", "EmbedLinks", "ManageMessages", "ReadMessageHistory"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "config",
    description: "Configure the bot",
    category: "ADMIN",
    command: {
        enabled: false,
    },
    ownerOnly: true,
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: "moderation",
                description: "Configure the moderation logs system",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "status",
                        description: "Enabled or disabled",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [
                            {
                                name: "ON",
                                value: "ON",
                            },
                            {
                                name: "OFF",
                                value: "OFF",
                            }
                        ]
                    },
                    {
                        name: "channel",
                        description: "The channel where the logs will be send",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    },
                    {
                        name: "role-add",
                        description: "Role that can use moderation logs commands",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    },
                    {
                        name: "role-remove",
                        description: "Remove a role from using moderation logs commands",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    }
                ],
            },
            {
                name: "loa",
                description: "Configure the loa system",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "status",
                        description: "Enabled or disabled",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [
                            {
                                name: "ON",
                                value: "ON",
                            },
                            {
                                name: "OFF",
                                value: "OFF",
                            },
                        ],
                    },
                    {
                        name: "channel",
                        description: "The channel where the loas will be sent",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    },
                    {
                        name: "staffadd",
                        description: "Staff role that can manage LOAS",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    },
                    {
                        name: "staffremove",
                        description: "Remove staff roles",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    },
                    {
                        name: "role-add",
                        description: "Role that can use loas commmands",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    },
                    {
                        name: "role-remove",
                        description: "Remove a role from using loas commands",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    }
                ],
            },
            {
                name: "rank",
                description: "Rank configuration",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "status",
                        description: "Enabled or disabled",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            {
                                name: "ON",
                                value: "ON",
                            },
                            {
                                name: "OFF",
                                value: "OFF",
                            }
                        ]
                    }
                ]
            }
        ],
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "moderation") {
            const status = interaction.options.getString("status");
            const channel = interaction.options.getChannel("channel");
            const roleadd = interaction.options.getRole("role-add");
            const roleremove = interaction.options.getRole("role-remove");
            if (status) response = await setModerationStatus(data.settings, status);
            if (channel) response = await setModerationChannel(data.settings, channel);
            if (roleadd) response = await setModerationRole(data.settings, roleadd);
            if (roleremove) response = await moderationRoleRemove(data.settings, roleremove);
        }

        else if (sub === "loa") {
            const status = interaction.options.getString("status");
            const channel = interaction.options.getChannel("channel");
            const staffroleadd = interaction.options.getRole("staffadd");
            const staffroleremove = interaction.options.getRole("staffremove");
            const role = interaction.options.getRole("role-add");
            const roleremove = interaction.options.getRole("role-remove");
            if (status) response = await setLoaStatus(data.settings, status);
            if (channel) response = await setLoaChannel(data.settings, channel);
            if (staffroleadd) response = await loaStaffAdd(data.settings, staffroleadd);
            if (staffroleremove) response = await loaStaffRemove(data.settings, staffroleremove);
            if (role) response = await loasRole(data.settings, role);
            if (roleremove) response = await loasRoleRemove(data.settings, roleremove);
        }

        else if (sub === "rank") {
            const status = interaction.options.getString("status");
            if (status) response = await setRankStatus(data.settings, status);
        }

        await interaction.followUp(response);
    },
};

async function setLoaStatus(settings, status) {
    const enabled = status.toUpperCase() === "ON" ? true : false;
    settings.loas.enabled = enabled;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setRankStatus(settings, status) {
    const enabled = status.toUpperCase() == "ON" ? true : false;
    settings.stats.enabled = enabled;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Sucess")
        .setDescription(`Rank system is now **${enabled ? "enabled" : "disabled"}**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setLoaChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.loas.channel_id = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function loaStaffAdd(settings, staffroleadd) {
    if (settings.loas.staff_roles.includes(staffroleadd.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${staffroleadd.name} is already a staff role.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.loas.staff_roles.push(staffroleadd.id);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function loaStaffRemove(settings, staffroleremove) {
    if (!settings.loas.staff_roles.includes(staffroleremove.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${staffroleremove.name} is not a staff role.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.loas.staff_roles.splice(settings.loas.staff_roles.indexOf(staffroleremove.id), 1);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**..`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setModerationStatus(settings, status) {
    const enabled = status.toUpperCase() === "ON" ? true : false;
    settings.moderations.enabled = enabled;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Moderation System **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setModerationChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.channel_id = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Moderation System **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setModerationRole(settings, roleadd) {
    if (settings.moderations.role.includes(roleadd.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${roleadd.name} is already a role that can use moderation commands.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.role.push(roleadd.id);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Moderation System **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function moderationRoleRemove(settings, roleremove) {
    if (!settings.moderations.role.includes(roleremove.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${roleremove.name} is not a role that can use moderation commands.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.role.splice(settings.moderations.role.indexOf(roleremove.id), 1);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Moderation System **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function loasRole(settings, role) {
    if (settings.loas.role.includes(role.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${staffroleadd.name} is already a staff role.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.loas.role.push(role.id);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function loasRoleRemove(settings, roleremove) {
    if (!settings.loas.role.includes(roleremove.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${role.name} is not a role that can use moderation commands.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.loas.role.splice(settings.loas.role.indexOf(roleremove.id), 1);
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`LOAS system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}