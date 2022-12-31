const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
    {
        guild_id: String,
        channel_id: String,
        message_id: String,
        user_id: String,
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "DELETED"],
            default: "PENDING",
        },
        stats: {
            upvotes: { type: Number, default: 0 },
            downvotes: { type: Number, default: 0 },
        },
        status_updates: [
            {
                _id: false,
                user_id: String,
                status: {
                    type: String,
                    enum: ["APPROVED", "REJECTED", "DELETED"],
                },
                reason: String,
                timestamp: { type: Date, default: new Date() },
            },
        ],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const Model = mongoose.model("banbolo", Schema);

module.exports = {
    model: Model,

    addBanBolo: async (message, userId, reason) => {
        return new Model({
            guild_id: message.guildId,
            channel_id: message.channelId,
            message_id: message.id,
            user_id: userId,
            reason: reason,
        }).save();
    },

    findBanBolo: async (guildId, messageId, userId) => {
        return Model.findOne({ guild_id: guildId, message_id: messageId });
    },

    deleteBanBoloDb: async (guildId, messageId, memberId, reason) => {
        return Model.updateOne(
            { guild_id: guildId, message_id: messageId },
            {
                status: "DELETED",
                $push: {
                    status_updates: { user_id: memberId, status: "DELETED", reason },
                },
            }
        );
    },
};