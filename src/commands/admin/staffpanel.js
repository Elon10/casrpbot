const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getUser } = require("@schemas/User");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "staffpanel",
    description: "Add a user to be available to use staff panel",
    category: "ADMIN",
    ownerOnly: true,
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "add",
                description: "Add a user to the staff panel",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user to add to the staff panel.",
                        type: ApplicationCommandOptionType.User,
                        required: true,
                    },
                ]
            },
            {
                name: "remove",
                description: "Remove a user from the staff panel",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "user",
                        description: "The user to remove from the staff panel",
                        type: ApplicationCommandOptionType.User,
                        required: true,
                    }
                ]
            }
        ],
    },

    async interactionRun(interaction) {
        const sub = interaction.options.getSubcommand();
        let response;
        
        if (sub === "add") {
            const member = interaction.options.getUser("user");
            response = await addStaff(member);
        }

        else if (sub === "remove") {
            const member = interaction.options.getUser("user");
            response = await removeStaff(member);
        }

        await interaction.followUp(response);
    }
}

async function addStaff(member) {
    const userDb = await getUser(member);

    if (userDb.staffpanel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("User already can access to the staff panel.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    userDb.staffpanel = true;
    userDb.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`**${member.tag}** has been added to the staff panel.`)
        .setColor(EMBED_COLORS.SUCCESS)
        
    return { embeds: [embed] };
}

async function removeStaff(member) {
    const userDb = await getUser(member);

    if (!userDb.staffpanel) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("User its not been added to the staff panel.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    userDb.staffpanel = false;
    userDb.save();

    const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`**${member.tag}** has been removed from staff panel.`)
        .setColor(EMBED_COLORS.SUCCESS)
        
    return { embeds: [embed] };
}