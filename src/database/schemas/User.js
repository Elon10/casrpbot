const mongoose = require("mongoose");
const { CACHE_SIZE } = require("@root/config.js");
const FixedSizeMap = require("fixedsize-map");

const cache = new FixedSizeMap(CACHE_SIZE.USERS);

const Schema = new mongoose.Schema(
    {
        _id: String,
        username: String,
        discriminator: String,
        logged: Boolean,
        staffpanel: Boolean,
        shifts: {
            total: { type: Number, default: 0 },
            current: Boolean,
            startDate: Date,
            endDate: String,
        },
        logs: {
            total: { type: Number, default: 0 },
            kicks: { type: Number, default: 0 },
            warns: { type: Number, default: 0 },
            bans: { type: Number, default: 0 },
            banbolos: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const Model = mongoose.model("user", Schema);

module.exports = {
    /**
     * @param {import('discord.js').User} user
     */
    getUser: async (user) => {
        if (!user) throw new Error("User is required.");
        if (!user.id) throw new Error("User Id is required.");

        const cached = cache.get(user.id);
        if (cached) return cached;

        let userDb = await Model.findById(user.id);
        if (!userDb) {
            userDb = new Model({
                _id: user.id,
                username: user.username,
                discriminator: user.discriminator,
            });
        }
        else if (!userDb.username || !userDb.discriminator) {
            userDb.username = user.username;
            userDb.discriminator = user.discriminator;
        }

        cache.add(user.id, userDb);
        return userDb;
    },

    getLogsLb: async (limit = 10) => {
        return Model.find({ "logs.total": { $gt: 1 }})
            .limit(limit)
            .lean();
    },  

    getKicksLb: async (limit = 10) => {
        return Model.find({ "logs.kicks": { $gt: 1 }})
            .limit(limit)
            .lean();
    },  

    getWarnsLb: async (limit = 10) => {
        return Model.find({ "logs.warns": { $gt : 1 }})
            .limit(limit)
            .lean();
    },

    getBansLb: async (limit = 10) => {
        return Model.find({ "logs.bans": { $gt: 1 }})
            .limit(limit)
            .lean();
    },

    getOtherLb: async (limit = 10) => {
        return Model.find({ "logs.other": { $gt: 1}})
            .limit(limit)
            .lean();
    },

    getBanBolosLb: async (limit = 10) => {
        return Model.find({ "logs.banbolos": { $gt: 1 }})
            .limit(limit)
            .lean();
    }
};