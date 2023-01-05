const mongoose = require("mongoose");
const { CACHE_SIZE } = require("@root/config.js");
const FixedSizeMap = require("fixedsize-map");

const cache = new FixedSizeMap(CACHE_SIZE.MEMBERS);

const ReqString = {
    type: String,
    required: true,
};

const Schema = new mongoose.Schema(
    {
        guild_id: ReqString,
        member_id: ReqString,
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const Model = mongoose.model("members", Schema);

module.exports = {
    getMember: async (guildId, memberId) => {
        const key = `${guildId}|${memberId}`;
        if (cache.contains(key)) return cache.get(key);

        let member = await Model.findOne({ guild_id: guildId, member_id: memberId });
        if (!member) {
            member = new Model({
                guild_id: guildId,
                member_id: memberId,
            });
        }

        cache.add(key, member);
        return member;
    },
};