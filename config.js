
module.exports = {
    OWNER_IDS: ["710271395438788660", "737459216175857686"],
    DEV_IDS: ["737459216175857686", "927200461377929246"],
    PREFIX_COMMANDS: {
        ENABLED: true,
        DEFAULT_PREFIX: "!",
    },
    
    INTERACTIONS: {
        SLASH: true,
        CONTEXT: true,
        GLOBAL: true,
        TEST_GUILD_ID: "xxxxxxxxxxx",
    },

    EMBED_COLORS: {
        BOT_EMBED: "#5865F2",
        TRANSPARENT: "#36393F",
        SUCCESS: "#57F287",
        ERROR: "#ED4245",
        WARNING: "#FEE75C",
    },
    
    DASHBOARD: {
        enabled: true, 
        baseURL: "https://californiarp.xyz", 
        failureURL: "https://californiarp.xyz", 
        port: "25998", 
    },

    CACHE_SIZE: {
        GUILDS: 100,
        USERS: 10000,
        MEMBERS: 10000,
    },

    MESSAGES: {
        API_ERROR: "Unexpected Backend Error! Try again later or contact support server",
    },

    STATS: {
        ENABLED: false,
        XP_COOLDOWN: 5, 
        DEFAULT_LVL_UP_MSG: "{member:tag}, You just advanced to **Level {level}**",
    },

    IMAGE: {
        BASE_API: "https://strangeapi.fun/api",
    },

    PRESENCE: {
        ENABLED: false,
        STATUS: "online",
        TYPE: "WATCHING",
        MESSAGE: "{members} members in {servers} servers",
    },
};
