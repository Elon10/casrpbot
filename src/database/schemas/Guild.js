const mongoose = require("mongoose");
const { CACHE_SIZE, PREFIX_COMMANDS, STATS } = require("@root/config.js");
const FixedSizeMap = require("fixedsize-map");
const { getUser } = require("./User");

const cache = new FixedSizeMap(CACHE_SIZE.GUILDS);

const Schema = new mongoose.Schema({
    _id: String,
    data: {
        name: String,
        region: String,
        owner: { type: String, ref: "users" },
        joinedAt: Date,
        leftAt: Date,
        bots: { type: Number, default: 0 },
    },
    prefix: { type: String, default: PREFIX_COMMANDS.DEFAULT_PREFIX },
    stats: {
        enabled: Boolean,
        xp: {
            message: { type: String, default: STATS.DEFAULT_LVL_UP_MSG },
            channel: String,
        },
    },
    loas: {
        enabled: Boolean,
        role: [String],
        channel_id: String,
        approved_channel: String,
        rejected_channel: String,
        staff_roles: [String],
    },
    moderations: {
        channel_id: String,
        delete_channel: String,
        staff_roles: [String],
        role: [String],
        enabled: Boolean,
    },
    banbolos: {
        channel_id: String,
        users: [String],
        ended_channel: String,
        delete_channel: String,
        enabled: Boolean,
    },
    shifts: {
        channel_id: String,
        role_add: [String],
    }
});

const Model = mongoose.model("guild", Schema);

module.exports = {
    /**
     * @param {import('discord.js').Guild} guild
     */
    getSettings: async (guild) => {
        if (!guild) throw new Error("Guild is undefined");
        if (!guild.id) throw new Error("Guild Id is undefined");

        const cached = cache.get(guild.id);
        if (cached) return cached;

        let guildData = await Model.findById(guild.id);
        if (!guildData) {
            guild
                .fetchOwner()
                .then(async (owner) => {
                    const userDb = await getUser(owner);
                    await userDb.save();
                })
                .catch((ex) => { });

            guildData = new Model({
                _id: guild.id,
                data: {
                    name: guild.name,
                    region: guild.preferredLocale,
                    owner: guild.ownerId,
                    joinedAt: guild.joinedAt,
                },
            });

            await guildData.save();
        }
        cache.add(guild.id, guildData);
        return guildData;
    },
};