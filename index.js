require("dotenv").config();
require("module-alias/register");

require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");

const client = new BotClient();
client.loadCommands("src/commands");
client.loadEvents("src/events");

process.on("unhandledRejection", (err) => client.logger.error("Unhandled Exception", err));

(async () => {
    await initializeMongoose();
    if (client.config.DASHBOARD.enabled) {
        client.logger.log("Launching Panel...")
        try {
            const { launch } = require("@root/dashboard/app");
            await launch(client);
        } catch (ex) {
            client.logger.error("Failed to launch panel", ex);
        }
    }

    await client.login(process.env.BOT_TOKEN);
})();