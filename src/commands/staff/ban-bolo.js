const { endBolo } = require("@handlers/banbolos");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "ban-bolo",
    description: "End a ban bolo",
    category: "STAFF",
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: "end",
                description: "End a ban bolo",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "channel_name",
                        description: "the channel where the ban-bolo exists",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: true,
                    },
                    {
                        name: "banbolo_id",
                        description: "The ID of the ban-bolo",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: "reason",
                        description: "The reason to end the ban-bolo",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
        ],
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();
        let response;

        if (sub === "end") {
            const channel = interaction.options.getChannel("channel_name");
            const banbolodId = interaction.options.getString("banbolo_id");
            const reason = interaction.options.getString("reason");

            response = await endBolo(interaction.member, channel, banbolodId, reason);
        }

        await interaction.followUp(response);
    }
}