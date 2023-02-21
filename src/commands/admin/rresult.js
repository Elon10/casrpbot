const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import('@structures/Command')}
 */
module.exports = {
    name: "rresult",
    description: "Send the ride along result",
    category: "ADMIN",
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
            {
                name: "user",
                description: "The staff user",
                type: ApplicationCommandOptionType.User,
                required: true,
            }
        ]
    },

    async interactionRun(interaction, data) {
        const user = interaction.options.getUser("user");
        const response = await rideAlongResult(interaction, user, data.settings);
        await interaction.followUp(response);
    }
}

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
async function rideAlongResult({ channel, member, guild }, user, settings) {
    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rr_btnSetup").setLabel("Start Result").setStyle(ButtonStyle.Primary)
    );

    const roles = ["1058291691871813714", "1071480011749589156", "1058291689053241384", "1058291688113717359", "1058291687027388446", "1058291685752315984", "1058291683495780442", "1061647806680551444", "1058291679322460200", "1058291677648912405", "1058291676600352838", "1058291674633228328"];

    if (!member.roles.cache.find((r) => roles.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't manage the applications.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const startEmbed = new EmbedBuilder()
        .setTitle("Setup")
        .setDescription("Please click the button below to start with the ride along result.")
        .setColor(EMBED_COLORS.BOT_EMBED)

    const sentMsg = await channel.safeSend({
        embeds: [startEmbed],
        components: [buttonRow],
        ephemeral: true,
    });

    if (!sentMsg) return;

    const btnInteraction = await channel
        .awaitMessageComponent({
            componentType: ComponentType.Button,
            filter: (i) => i.customId === "rr_btnSetup" && i.member.id === member.id && i.message.id === sentMsg.id,
        })
        .catch((ex) => { });

    const cancelled = new EmbedBuilder()
        .setTitle("Cancelled")
        .setDescription("No response received, setup cancelled.")
        .setColor(EMBED_COLORS.ERROR)

    if (!btnInteraction) return sentMsg.edit({ embeds: [cancelled], components: [] });

    await btnInteraction.showModal(
        new ModalBuilder({
            customId: "rr_modalSetup",
            title: "Ride Along Setup",
            components: [
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("rating")
                        .setLabel("Staff Rating")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Ex: 10/10")
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("result")
                        .setLabel("Result")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Ex: Passed/Failed")
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("notes")
                        .setLabel("Notes")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Ex: You did it good but...")
                        .setRequired(true)
                ),
            ],
        })
    );

    const modal = await btnInteraction
        .awaitModalSubmit({
            time: 1 * 60 * 1000,
            filter: (m) => m.customId === "rr_modalSetup" && m.member.id === member.id && m.message.id === sentMsg.id,
        })
        .catch((ex) => { });

    if (!modal) return sentMsg.edit({ embeds: [cancelled], components: [] });

    const settingUp = new EmbedBuilder()
        .setTitle("Loading")
        .setDescription("Setting up result...")
        .setColor(EMBED_COLORS.BOT_EMBED)

    await modal.reply({ embeds: [settingUp] });
    const rating = modal.fields.getTextInputValue("rating");
    const result = modal.fields.getTextInputValue("result");
    const notes = modal.fields.getTextInputValue("notes");

    const rrChannel = guild.channels.cache.get("1071447768054386791");

    const embed = new EmbedBuilder()
        .setTitle("Staff Ridealong Results")
        .setDescription(`Ride along result for ${user}`)
        .addFields(
            {
                name: "Rating",
                value: rating,
                inline: false,
            },
            {
                name: "Result",
                value: result,
                inline: false,
            },
            {
                name: "Notes",
                value: notes,
                inline: false
            }
        )
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setFooter({ text: `Signed By ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })

    const finished = new EmbedBuilder()
        .setTitle("Success")
        .setDescription("Done! Result sent.")
        .setColor(EMBED_COLORS.SUCCESS)

    await modal.deleteReply();
    await sentMsg.delete();
    await rrChannel.send({ content: `${user}`, embeds: [embed] });
    return { embeds: [finished] };
}