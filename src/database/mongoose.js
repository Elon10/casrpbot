const mongoose = require("mongoose");
const { log, success, error } = require("../helpers/Logger");

module.exports = {
    async initializeMongoose() {
        log("Connecting to MongoDB...");

        try {
            await mongoose.connect(process.env.MONGO_CONNECTION, {
                keepAlive: true,
            });

            success("Mongoose: Database connection established");

            return mongoose.connection;
        } catch (err) {
            error("Mongoose: Failed to connect to database", err);
            process.exit(1);
        }
    },

    schemas: {
        Guild: require("./schemas/Guild"),
        Member: require("./schemas/Member"),
        User: require("./schemas/User"),
        Loas: require("./schemas/Loas").model,
        Moderation: require("./schemas/Moderation").model,
        BanBolo: require("./schemas/BanBolo").model,
        Applications: require("./schemas/Apps").model,
    },
};