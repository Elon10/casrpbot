const { getSettings } = require("@schemas/Guild");
const { findBanBolo, deleteBanBoloDb } = require("@schemas/BanBolo");
const { EMBED_COLORS, OWNER_IDS } = require("@root/config");
const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    EmbedBuilder,
    TextInputStyle,
}  = require("discord.js");