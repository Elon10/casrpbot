const { EmbedBuilder } = require("discord.js");
const { parsePermissions } = require("@helpers/Utils");
const { timeformat } = require("@helpers/Utils");

const cooldownCache = new Map();

module.exports = {
    /**
     * @param {import('discord.js').ContextMenuInteraction} interaction
     * @param {import("@structures/BaseContext")} context
     */
    handleContext: async function (interaction, context) {
        if (context.cooldown) {
            const remaining = getRemainingCooldown(interaction.user.id, context);
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Cooldown")
                    .setDescription(`You can use this command again in **${timeformat(remaining)}**.`)
                    .setColor(EMBED_COLORS.ERROR)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (!interaction.member && context.userPermissions && context.userPermissions?.length > 0) {
            if (!interaction.member.permissions.has(context.userPermissions)) {
                const embed = new EmbedBuilder()
                    .setTitle("Error")
                    .setDescription(`Uh oh, you need ${parsePermissions(cmd.userPermissions)} for this command.`)
                    .setColor(EMBED_COLORS.ERROR)

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        try {
            await interaction.deferReply({ ephemeral: context.ephemeral });
            await context.run(interaction);
        } catch (ex) {
            const embed = new EmbedBuilder()
                .setTitle("Unknown Error")
                .setDescription("Please contact <@737459216175857686>.")
                .setColor(EMBED_COLORS.ERROR)

            await interaction.followUp({ embeds: [embed], ephemeral: true });
            interaction.client.logger.error("contextRun", ex);
        } finally {
            applyCooldown(interaction.user.id, context);
        }
    },
};

/**
 * @param {string} memberId
 * @param {object} context
 */
function applyCooldown(memberId, context) {
    const key = context.name + "|" + memberId;
    cooldownCache.set(key, Date.now());
}

/**
 * @param {string} memberId
 * @param {object} context
 */
function getRemainingCooldown(memberId, context) {
    const key = context.name + "|" + memberId;
    if (cooldownCache.has(key)) {
        const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
        if (remaining > context.cooldown) {
            cooldownCache.delete(key);
            return 0;
        }
        return context.cooldown - remaining;
    }
    return 0;
}