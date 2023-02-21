const { getSettings } = require("@schemas/Guild");
const { findApplication } = require("@schemas/Apps");
const { EMBED_COLORS } = require("@root/config");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    ButtonStyle,
    TextInputStyle,
} = require("discord.js");
const { getUser } = require("@schemas/User");


const hasPerms = (member, settings) => {
    return (
        member.permissions.has("ManageGuild") ||
        member.roles.cache.find((r) => settings.loas.staff_roles.includes(r.id))
    )
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 * @param {import('discord.js').BaseGuildTextChannel} channel
 */
async function acceptApplication(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    const roles = ["1058291691871813714", "1071480011749589156", "1058291689053241384", "1058291688113717359", "1058291687027388446", "1058291685752315984", "1058291683495780442", "1061647806680551444", "1058291679322460200", "1058291677648912405", "1058291676600352838", "1058291674633228328"];

    if (!member.roles.cache.find((r) => roles.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't manage the applications.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const doc = await findApplication(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Application not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (doc.status === "APPROVED") {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Application already accepted.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message} message
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        return "Application not found.";
    }

    const approvedEmbed = new EmbedBuilder()
        .setTitle("Application Accepted")
        .setDescription(message.embeds[2].data.description)
        .setColor(EMBED_COLORS.SUCCESS)
        .setFooter({ text: `Accepted By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

    const fields = [];
    const age = message.embeds[2].data.fields.find((field) => field.name === "How old are you?");
    const timezone = message.embeds[2].data.fields.find((field) => field.name === "What is your timezone?");
    const hobbies = message.embeds[2].data.fields.find((field) => field.name === "Tell us about yourself. (EX. Hobbies, Sports, School, Clubs, etc.)");
    const languages = message.embeds[2].data.fields.find((field) => field.name === "What programming languages are you familiar?");
    const pastexperience = message.embeds[2].data.fields.find((field) => field.name === "Have any past experience being a moderator?");
    const serverexperience = message.embeds[2].data.fields.find((field) => field.name === "If you selected yes above, list the server(s) you've worked in the past. (EX. Server Name, rank, activity status, etc.)");
    const whymod = message.embeds[2].data.fields.find((field) => field.name === "Why do you want to be a moderator at California State Roleplay?");
    const skills = message.embeds[2].data.fields.find((field) => field.name === "Tell us why you should be selected over other applicants. What skills do you have that can benefit the staff team?");
    const q1 = message.embeds[2].data.fields.find((field) => field.name === "You hear multiple weapons being shot at the same time near gun store. As you approach the situation you see a user with an unrealistic avatar killing all users at the scene. You arrive and he begins to flee, what would you do?");
    const q2 = message.embeds[2].data.fields.find((field) => field.name === "You're patrolling as a red impala passes you crashing into vehicles, swerving, and unrealistically driving. You attempt to pull over the red impala but it flees, what would you do?");
    const q3 = message.embeds[2].data.fields.find((field) => field.name === "You moderate a user for fail roleplaying. They become upset and want to report you for admin abuse, what would you do?");
    const q4 = message.embeds[2].data.fields.find((field) => field.name === "You moderate a user for fail roleplaying. They become upset and starts to disrespect the server, what would you do?");
    const q5 = message.embeds[2].data.fields.find((field) => field.name === "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he has done nothing & has a weapon for self defense. He gives you the offenders username, what would you do?");
    const q6 = message.embeds[2].data.fields.find((field) => field.name === "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he was roleplaying and was shot randomly. The offender runs & leaves the game, what would you do?");
    const q7 = message.embeds[2].data.fields.find((field) => field.name === "As you respond to a !mod call a user comes up to you with a weapon and attempts to kill you in which he succeeds. He returns to his vehicle and flees, what would you do?");
    const q8 = message.embeds[2].data.fields.find((field) => field.name === "To begin, as you patrol the server as a Moderator, you notice a user using a banned weapon. You see them actively using the weapon, what would you do?");
    const q9 = message.embeds[2].data.fields.find((field) => field.name === "While chatting in main chat you decide to check on off topic chat and find a few users arguing, what would you do?");
    const q10 = message.embeds[2].data.fields.find((field) => field.name === "You are chatting with members when someone randomly insults someone that's chatting. What would you do?");
    const q11 = message.embeds[2].data.fields.find((field) => field.name === "You just get online and you go to check main chat and its filled with welcome messages that seem like bots, what would you do?");
    const q12 = message.embeds[2].data.fields.find((field) => field.name === "You are checking chats to make sure nobody is breaking the rules and while in off topic chat you see a few users ghost pinging people, what would you do?");
    const q13 = message.embeds[2].data.fields.find((field) => field.name === "You are in the server and you come across people using excessive profanity, what would you do?");
    const q14 = message.embeds[2].data.fields.find((field) => field.name === "Any questions, statements, or concerns for the reviewer?");
    const q15 = message.embeds[2].data.fields.find((field) => field.name === "Do you agree to not ask any staff to review your application?");

    fields.push(age, timezone, hobbies, languages, pastexperience, serverexperience, whymod, skills, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15);
    approvedEmbed.addFields(fields);

    const user = await channel.client.users.fetch(doc.user_id, { cache: false }).catch(() => { });

    try {
        doc.status = "APPROVED";
        doc.status_updates.push({ user_id: member.id, status: "APPROVED", reason, timestamp: new Date() });

        const dmEmbed = new EmbedBuilder()
            .setTitle("Application Accepted")
            .setDescription(`Hey **${user.username}**, We're happy to say that your staff application has been **accepted**! Congratulations on passing! What now? You are now welcomed to the entry process which you will have to take an entry test to ensure that you have read our documents about moderation. You'll have 2 weeks to fill that out and attend training or you will be removed from the team. Once again, congratulations!`)
            .setColor(EMBED_COLORS.SUCCESS)
            .setFooter({ text: `Approved By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

        user.send({ embeds: [dmEmbed] });

        let approvedChannel;
        if (settings.applications.approved_channel) {
            approvedChannel = guild.channels.cache.get(settings.applications.approved_channel);
        }

        if (!approvedChannel) {
            await message.edit({ embeds: [approvedEmbed] });
        }

        else {
            const sent = await approvedChannel.send({ embeds: [approvedEmbed] });
            doc.channel_id = approvedChannel.id;
            doc.message_id = sent.id;
            await message.delete();
        }

        await doc.save();
        return "Application successfully approved.";
    } catch (ex) {
        return "Failed to approve application.";
    }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 * @param {import('@src/structures').BotClient} client
 */
async function denyApplication(member, channel, messageId, reason) {
    const { guild } = member;
    const settings = await getSettings(guild);

    const roles = ["1058291691871813714", "1071480011749589156", "1058291689053241384", "1058291688113717359", "1058291687027388446", "1058291685752315984", "1058291683495780442", "1061647806680551444", "1058291679322460200", "1058291677648912405", "1058291676600352838", "1058291674633228328"];

    if (!member.roles.cache.find((r) => roles.includes(r.id))) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("You can't manage the applications.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    const doc = await findApplication(guild.id, messageId);
    if (!doc) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Application not found.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }
    if (doc.is_rejected) {
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Application already rejected.")
            .setColor(EMBED_COLORS.ERROR)

        return { embeds: [embed] };
    }

    /**
     * @type {import('discord.js').Message} message
     */
    let message;
    try {
        message = await channel.messages.fetch({ message: messageId, force: true });
    } catch (err) {
        return "Application not found.";
    }

    const rejectedEmbed = new EmbedBuilder()
        .setTitle("Application Rejected")
        .setDescription(message.embeds[2].data.description)
        .setColor(EMBED_COLORS.ERROR)
        .setFooter({ text: `Rejected By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

    const fields = [];
    const age = message.embeds[2].data.fields.find((field) => field.name === "How old are you?");
    const timezone = message.embeds[2].data.fields.find((field) => field.name === "What is your timezone?");
    const hobbies = message.embeds[2].data.fields.find((field) => field.name === "Tell us about yourself. (EX. Hobbies, Sports, School, Clubs, etc.)");
    const languages = message.embeds[2].data.fields.find((field) => field.name === "What programming languages are you familiar?");
    const pastexperience = message.embeds[2].data.fields.find((field) => field.name === "Have any past experience being a moderator?");
    const serverexperience = message.embeds[2].data.fields.find((field) => field.name === "If you selected yes above, list the server(s) you've worked in the past. (EX. Server Name, rank, activity status, etc.)");
    const whymod = message.embeds[2].data.fields.find((field) => field.name === "Why do you want to be a moderator at California State Roleplay?");
    const skills = message.embeds[2].data.fields.find((field) => field.name === "Tell us why you should be selected over other applicants. What skills do you have that can benefit the staff team?");
    const q1 = message.embeds[2].data.fields.find((field) => field.name === "You hear multiple weapons being shot at the same time near gun store. As you approach the situation you see a user with an unrealistic avatar killing all users at the scene. You arrive and he begins to flee, what would you do?");
    const q2 = message.embeds[2].data.fields.find((field) => field.name === "You're patrolling as a red impala passes you crashing into vehicles, swerving, and unrealistically driving. You attempt to pull over the red impala but it flees, what would you do?");
    const q3 = message.embeds[2].data.fields.find((field) => field.name === "You moderate a user for fail roleplaying. They become upset and want to report you for admin abuse, what would you do?");
    const q4 = message.embeds[2].data.fields.find((field) => field.name === "You moderate a user for fail roleplaying. They become upset and starts to disrespect the server, what would you do?");
    const q5 = message.embeds[2].data.fields.find((field) => field.name === "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he has done nothing & has a weapon for self defense. He gives you the offenders username, what would you do?");
    const q6 = message.embeds[2].data.fields.find((field) => field.name === "You respond to a !mod call and the member describes a user going around shooting his tires and making his vehicle catch fire, he says he was roleplaying and was shot randomly. The offender runs & leaves the game, what would you do?");
    const q7 = message.embeds[2].data.fields.find((field) => field.name === "As you respond to a !mod call a user comes up to you with a weapon and attempts to kill you in which he succeeds. He returns to his vehicle and flees, what would you do?");
    const q8 = message.embeds[2].data.fields.find((field) => field.name === "To begin, as you patrol the server as a Moderator, you notice a user using a banned weapon. You see them actively using the weapon, what would you do?");
    const q9 = message.embeds[2].data.fields.find((field) => field.name === "While chatting in main chat you decide to check on off topic chat and find a few users arguing, what would you do?");
    const q10 = message.embeds[2].data.fields.find((field) => field.name === "You are chatting with members when someone randomly insults someone that's chatting. What would you do?");
    const q11 = message.embeds[2].data.fields.find((field) => field.name === "You just get online and you go to check main chat and its filled with welcome messages that seem like bots, what would you do?");
    const q12 = message.embeds[2].data.fields.find((field) => field.name === "You are checking chats to make sure nobody is breaking the rules and while in off topic chat you see a few users ghost pinging people, what would you do?");
    const q13 = message.embeds[2].data.fields.find((field) => field.name === "You are in the server and you come across people using excessive profanity, what would you do?");
    const q14 = message.embeds[2].data.fields.find((field) => field.name === "Any questions, statements, or concerns for the reviewer?");
    const q15 = message.embeds[2].data.fields.find((field) => field.name === "Do you agree to not ask any staff to review your application?");

    fields.push(age, timezone, hobbies, languages, pastexperience, serverexperience, whymod, skills, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15);
    rejectedEmbed.addFields(fields);

    const user = await channel.client.users.fetch(doc.user_id, { cache: false }).catch(() => { });
    const userDb = await getUser(user);

    try {
        doc.status = "REJECTED";
        doc.status_updates.push({ user_id: member.id, status: "REJECTED", reason, timestamp: new Date() });

        let rejectChannel;
        if (settings.applications.rejected_channel) {
            rejectChannel = guild.channels.cache.get(settings.applications.rejected_channel);
        }

        if (!rejectChannel) {
            await message.edit({ embeds: [rejectedEmbed] });
        }

        else {
            const sent = await rejectChannel.send({ embeds: [rejectedEmbed] });
            doc.channel_id = rejectChannel.id;
            doc.message_id = sent.id;
            await message.delete();

            const dmEmbed = new EmbedBuilder()
                .setTitle("Application Rejected")
                .setDescription(`Hey **${user.username}**, Your [Staff Application](${sent.url}) has been unfortunately **denied**. Why? Well, try to put in more effort by adding more sentences, using Spelling, Punctuation, and Grammar. Or your application didn't fit standards. You're always open to re-apply.`)
                .setColor(EMBED_COLORS.ERROR)
                .setFooter({ text: `Denied By ${member.user.tag}`, iconURL: member.displayAvatarURL() })

            if (reason) dmEmbed.addFields({ name: "Reason", value: reason, inline: false });

            user.send({ embeds: [dmEmbed] });
        }

        userDb.applied = false;
        await userDb.save();

        await doc.save();
        return "Application successfully rejected.";
    } catch (ex) {
        return "Failed to deny application.";
    }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleAcceptBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Accept Application",
            customId: "APPLY_ACCEPT_MODAL",
            components: [
                new ActionRowBuilder().addComponents([
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Note")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(2),
                ]),
            ],
        })
    );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleAcceptModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await acceptApplication(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDenyBtn(interaction) {
    await interaction.showModal(
        new ModalBuilder({
            title: "Deny Application",
            customId: "APPLY_DENY_MODAL",
            components: [
                new ActionRowBuilder().addComponents([
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Note")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(4),
                ]),
            ],
        })
    );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleDenyModal(modal) {
    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");
    const response = await denyApplication(modal.member, modal.channel, modal.message.id, reason);
    await modal.followUp(response);
}

module.exports = {
    handleDenyModal,
    handleDenyBtn,
    handleAcceptBtn,
    handleAcceptModal,
    acceptApplication,
    denyApplication,
};