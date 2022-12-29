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
            startDate: String,
            shiftStartDate: Date,
            currentShift: Boolean,
        },
        logs: {
            total: { type: Number, default: 0 },
            kicks: { type: Number, default: 0 },
            warns: { type: Number, default: 0 },
            bans: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        daily: {
            streak: { type: Number, default: 0 },
            timestamp: Date,
        },
        shifts: {
            current: Boolean,
        }
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
        return Model.find({ "total": { $gt: 0 }})
            .limit(limit)
            .lean();
    },

    getKicksLb: async (limit = 10) => {
        return Model.find({ "kicks": { $gt: 0 }})
            .limit(limit)
            .lean();
    },  

    getWarnsLb: async (limit = 10) => {
        return Model.find({ "warns": { $gt : 0 }})
            .limit(limit)
            .lean();
    },

    getBansLb: async (limit = 10) => {
        return Model.find({ "bans": { $gt: 0 }})
            .limit(limit)
            .lean();
    },

    getOtherLb: async (limit = 10) => {
        return Model.find({ "other": { $gt: 0 }})
            .limit(10)
            .lean();
    }
};