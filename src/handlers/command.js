const { EmbedBuilder, Embed } = require("discord.js");
const { OWNER_IDS, PREFIX_COMMANDS, EMBED_COLORS } = require("@root/config");
const { parsePermissions } = require("@helpers/Utils");
const { timeformat } = require("@helpers/Utils");
const { getSettings } = require("@schemas/Guild");

const cooldownCache = new Map();

module.exports = {
    /**
     * @param {string('discord.js').Message} message
     * @param {import('@structures/Command')} cmd
     * @param {object} settings
     */
    handlePrefixCommand: async function (message, cmd, settings) {
        const prefix = settings.prefix;
        const args = message.content.replace(prefix, "").split(/\s+/);
        const invoke = args.shift().toLowerCase();

        const data = {};
        data.settings = settings;
        data.prefix = prefix;
        data.invoke = invoke;

        if (!message.channel.permissionsFor(message.guild.members.me).has("SendMessages")) return;

        if (cmd.validations) {
            for (const validation of cmd.validations) {
                if (!validation.callback(message)) {
                    return message.safeReply(validation.message);
                }
            }
        }

        if (cmd.ownerOnly && !OWNER_IDS.includes(message.author.id)) return;

        if (cmd.userPermissions && cmd.userPermissions?.length > 0) {
            if (!message.channel.permissionsFor(message.member).has(cmd.userPermissions)) {
                const embed = new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription(`Uh oh, you need ${parsePermissions(cmd.userPermissions)} for this command.`)
                    .setColor(EMBED_COLORS.ERROR)

                return message.safeReply({ embeds: [embed] });
            }
        }

        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            if (!message.channel.permissionsFor(message.guild.members.me).has(cmd.botPermissions)) {
                const embed = new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription(`Uh oh, I need ${parsePermissions(cmd.botPermissions)} for this command.`)
                    .setColor(EMBED_COLORS.ERROR)

                return message.safeReply({ embeds: [embed] });
            }
        }

        if (cmd.command.minArgsCount > args.length) {
            const usageEmbed = this.getCommandUsage(cmd, prefix, invoke);
            return message.safeReply({ embeds: [usageEmbed] });
        }

        if (cmd.cooldown > 0) {
            const remaining = getRemainingCooldown(message.author.id, cmd);
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Cooldown")
                    .setDescription(`You can use this command again in **${timeformat(remaining)}**.`)
                    .setColor(EMBED_COLORS.ERROR)

                return message.safeReply({ embeds: [embed] });
            }
        }

        try {
            await cmd.messageRun(message, args, data);
        } catch (ex) {
            message.client.logger.error("messageRun", ex);
            const embed = new EmbedBuilder()
                .setTitle("Unknown Error")
                .setDescription("Please contact <@737459216175857686>.")
                .setColor(EMBED_COLORS.ERROR)

            return message.safeReply({ embeds: [embed] });
        } finally {
            if (cmd.cooldown > 0) applyCooldown(message.author.id, cmd);
        }
    },

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    handleSlashCommand: async function (interaction) {
        const cmd = interaction.client.slashCommands.get(interaction.commandName);
        if (!cmd) {
            const embed = new EmbedBuilder()
                .setTitle("Unknown Error")
                .setDescription("Please contact <@737459216175857686>.")
                .setColor(EMBED_COLORS.ERROR)

            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => { });
        }

        if (cmd.validations) {
            for (const validation of cmd.validations) {
                if (!validation.callback(interaction)) {
                    return interaction.reply({
                        content: validation.message,
                        ephemeral: true,
                    });
                }
            }
        }

        if (cmd.ownerOnly === true && !OWNER_IDS.includes(interaction.user.id)) return;

        if (interaction.member && cmd.userPermissions?.length > 0) {
            if (!interaction.member.permissions.has(cmd.userPermissions)) {
                const embed = new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription(`Uh oh, you need ${parsePermissions(cmd.userPermissions)} for this command.`)
                    .setColor(EMBED_COLORS.ERROR)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            if (!interaction.guild.members.me.permissions.has(cmd.botPermissions)) {
                const embed = new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription(`Uh oh, I need ${parsePermissions(cmd.botPermissions)} for this command.`)
                    .setColor(EMBED_COLORS.ERROR)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (cmd.cooldown > 0) {
            const remaining = getRemainingCooldown(interaction.user.id, cmd);
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Cooldown")
                    .setDescription(`You can use this command again in **${timeformat(remaining)}**.`)
                    .setColor(EMBED_COLORS.ERROR)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        try {
            await interaction.deferReply({ ephemeral: cmd.slashCommand.ephemeral });
            const settings = await getSettings(interaction.guild);
            await cmd.interactionRun(interaction, { settings });
        } catch (ex) {
            const embed = new EmbedBuilder()
                .setTitle("Unknown Error")
                .setDescription("Please contact <@737459216175857686>.")
                .setColor(EMBED_COLORS.ERROR)

            await interaction.followUp({ embeds: [embed], ephemeral: true });
            interaction.client.logger.error("interactionRun", ex);
        } finally {
            if (cmd.cooldown > 0) applyCooldown(interaction.user.id, cmd);
        }
    },

    /**
     * @param {import('@structures/Command')} cmd 
     * @param {string} prefix 
     * @param {string} invoke
     * @param {string} [title]
     */
    getCommandUsage(cmd, prefix = PREFIX_COMMANDS.DEFAULT_PREFIX, invoke, title = "Command Usage") {
        let desc = "";
        if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
            cmd.command.subcommands.forEach((sub) => {
                desc += `\`${prefix}${invoke || cmd.name} ${sub.trigger}\`\n- ${sub.description}\n\n`;
            });
            if (cmd.cooldown) {
                desc += `**Cooldown:** ${timeformat(cmd.cooldown)}`;
            }
        } else {
            desc += `\`\`\`css\n${prefix}${invoke || cmd.name} ${cmd.command.usage}\`\`\``;
            if (cmd.description !== "") desc += `\n**Help:** ${cmd.description}`;
            if (cmd.cooldown) desc += `\n**Cooldown:** ${timeformat(cmd.cooldown)}`;
        }

        const embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED).setDescription(desc);
        if (title) embed.setAuthor({ name: title });
        return embed;
    },

    /**
     * @param {import('@structures/Command')} cmd 
     */
    getSlashUsage(cmd) {
        let desc = "";
        if (cmd.slashCommand.options.find((o) => o.type === "SUB_COMMAND")) {
          const subCmds = cmd.slashCommand.options.filter((opt) => opt.type === "SUB_COMMAND");
          subCmds.forEach((sub) => {
            desc += `\`/${cmd.name} ${sub.name}\`\n- ${sub.description}\n\n`;
          });
        } else {
          desc += `\`/${cmd.name}\`\n\n**Help:** ${cmd.description}`;
        }
    
        if (cmd.cooldown) {
          desc += `\n**Cooldown:** ${timeformat(cmd.cooldown)}`;
        }
    
        return new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED).setDescription(desc);
    },
};

/**
 * @param {string} memberId
 * @param {object} cmd
 */
function applyCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    cooldownCache.set(key, Date.now());
}

/**
 * @param {string} memberId
 * @param {object} cmd
 */
function getRemainingCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    if (cooldownCache.has(key)) {
        const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
        if (remaining > cmd.cooldown) {
            cooldownCache.delete(key);
            return 0;
        }
        return cmd.cooldown - remaining;
    }
    return 0;
};