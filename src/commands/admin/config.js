const { ApplicationCommandOptionType, EmbedBuilder, ChannelType, Application } = require("discord.js");
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
                name: "moderations",
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
                        name: "delete-channel",
                        description: "The channel where the deleted moderations will be send",
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
                    },
                    {
                        name: "staff-add",
                        description: "Role that can delete moderation logs",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    },
                    {
                        name: "staff-remove",
                        description: "Remove a role from deleting moderation logs",
                        type: ApplicationCommandOptionType.Role,
                        required: false,
                    }
                ],
            },
            {
                name: "loas",
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
                name: "ban-bolos",
                description: "Configure the ban bolos system",
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
                        description: "The channel where the ban-bolos will be sent",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    },
                    {
                        name: "delete-channel",
                        description: "The channel where the deleted ban bolos will be sent",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    },
                    {
                        name: "ended-channel",
                        description: "The channel where the ended ban bolso will be sent",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    }
                ],
            },
            {
                name: "shifts",
                description: "Configure the shift system",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "channel",
                        description: "Channel where the shifts will be sent",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: false,
                    },
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

        if (sub === "moderations") {
            const status = interaction.options.getString("status");
            const channel = interaction.options.getChannel("channel");
            const roleadd = interaction.options.getRole("role-add");
            const roleremove = interaction.options.getRole("role-remove");
            const deleteChannel = interaction.options.getChannel("delete-channel");
            const staffadd = interaction.options.getRole("staff-add");
            const staffremove = interaction.options.getRole("staff-remove");

            if (status) response = await setModerationStatus(data.settings, status);
            if (channel) response = await setModerationChannel(data.settings, channel);
            if (roleadd) response = await setModerationRole(data.settings, roleadd);
            if (roleremove) response = await moderationRoleRemove(data.settings, roleremove);
            if (deleteChannel) response = await deleteChannelSet(data.settings, deleteChannel);
            if (staffadd) response = await setModerationStaff(data.settings, staffadd);
            if (staffremove) response = await removeModerationStaff(data.settings, staffremove);
        }

        else if (sub === "loas") {
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

        else if (sub == "ban-bolos") {
            const status = interaction.options.getString("status");
            const channel = interaction.options.getChannel("channel");
            const deletedChannel = interaction.options.getChannel("delete-channel");
            const endedChannel = interaction.options.getChannel("ended-channel");

            if (status) response = await setBanBoloStatus(data.settings, status);
            if (channel) response = await setBanBolosChannel(data.settings, channel);
            if (deletedChannel) response = await setBanBolosDeletedChannel(data.settings, deletedChannel);
            if (endedChannel) response = await setBanBolosEndedChannel(data.settings, endedChannel);
        }

        else if (sub === "shifts") {
            const channel = interaction.options.getChannel("channel");
            if (channel) response = await setShiftsChannel(data.settings, channel);
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

async function deleteChannelSet(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.delete_channel = channel.id;
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

async function setModerationStaff(settings, staffadd) {
    if (settings.moderations.role.includes(staffad.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${staffadd.name} is already a role that can delete moderation logs.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.staff_roles.push(staffadd.id);
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

async function removeModerationStaff(settings, staffremove) {
    if (!settings.moderations.role.includes(staffremove.id)) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`${staffremove.name} is not a role that can delete moderations.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.moderations.staff_roles.splice(settings.moderations.staff_roles.indexOf(staffremove.id), 1);
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

async function setBanBoloStatus(settings, status) {
    const enabled = status.toUpperCase() === "ON" ? true : false;
    settings.banbolos.enabled = enabled;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Ban Bolos System **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setBanBolosChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.banbolos.channel_id = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Ban Bolos system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setBanBolosDeletedChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.banbolos.delete_channel = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Ban Bolos system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setBanBolosEndedChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.banbolos.ended_channel = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Ban Bolos system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}

async function setShiftsChannel(settings, channel) {
    if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
        const embed = new EmbedBuilder()
            .setTitle("Missing Permissions")
            .setDescription(`I need the following permissions in ${channel}\n${parsePermissions(CHANNEL_PERMS)}.`)
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    settings.shifts.channel_id = channel.id;
    await settings.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Shift System system **updated**.`)
        .setColor(EMBED_COLORS.SUCCESS)

    return { embeds: [embed] };
}