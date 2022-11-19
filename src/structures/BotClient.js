const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    ApplicationCommandType,
} = require("discord.js");
const path = require("path");
const { table } = require("table");
const Logger = require("../helpers/logger");
const { recursiveReadDirSync } = require("../helpers/Utils");
const { schemas } = require("@src/database/mongoose");
const CommandCategory = require("./CommandCategory");

module.exports = class BotClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildVoiceStates,
            ],
            partials: [Partials.User, Partials.Message, Partials.Reaction],
            allowedMentions: {
                parse: ["users", "roles"],
            },
            restRequestTimeout: 20000,
        });

        this.wait = require("util").promisify(setTimeout);
        this.config = require("@root/config");

        /**
         * @type {import('@structures/Command')[]}
         */
        this.commands = [];
        this.commandIndex = new Collection();

        /**
         * @type {Collection<string, import('@structures/Command')>}
         */
        this.slashCommands = new Collection();

        /**
         * @type {Collection<string, import('@structures/BaseContext')>}
         */
        this.contextMenus = new Collection();
        this.logger = Logger;
        this.database = schemas;
    }

    /**
     * @param {string} directory
     */
    loadEvents(directory) {
        this.logger.log("Loading Events...")
        let success = 0;
        let failed = 0;
        const clientEvents = [];

        recursiveReadDirSync(directory).forEach((filePath) => {
            const file = path.basename(filePath);
            try {
                const eventName = path.basename(file, ".js");
                const event = require(filePath);

                this.on(eventName, event.bind(null, this));
                clientEvents.push([file, "✓"]);

                delete require.cache[require.resolve(filePath)];
                success += 1;
            } catch (ex) {
                failed += 1;
                this.logger.error(`loadEvent - ${file}`, ex);
            }
        });

        console.log(
            table(clientEvents, {
                header: {
                    alignment: "center",
                    content: "Client Events",
                },
                singleLine: true,
                columns: [{ width: 25 }, { width: 5, alignment: "center" }],
            })
        );

        this.logger.log(`Loaded ${success + failed} events. Success (${success}) Failed (${failed})`);
    }

    /**
     * @param {string} invoke
     * @returns {import('@structures/Command')|undefined}
     */
    getCommand(invoke) {
        const index = this.commandIndex.get(invoke.toLowerCase());
        return index !== undefined ? this.commands[index] : undefined;
    }

    /**
     * @param {import("@structures/Command")} cmd
     */
    loadCommand(cmd) {
        if (cmd.category && CommandCategory[cmd.category]?.enabled === false) {
            this.logger.debug(`Skipping Command ${cmd.name} because category ${cmd.category} is disabled`);
            return;
        }

        if (cmd.command?.enabled) {
            const index = this.commands.length;
            if (this.commandIndex.has(cmd.name)) {
                throw new Error(`Command ${cmd.name} already registered`);
            }
            if (Array.isArray(cmd.command.aliases)) {
                cmd.command.aliases.forEach((alias) => {
                    if (this.commandIndex.has(alias)) throw new Error(`Alias ${alias} already registered`);
                    this.commandIndex.set(alias.toLowerCase(), index);
                });
            }
            this.commandIndex.set(cmd.name.toLowerCase(), index);
            this.commands.push(cmd);
        } else {
            this.logger.debug(`Skipping command ${cmd.name}. Disabled.`);
        }

        if (cmd.slashCommand?.enabled) {
            if (this.slashCommands.has(cmd.name)) throw new Error(`Slash Command ${cmd.name} already registered`)
            this.slashCommands.set(cmd.name, cmd);
        } else {
            this.logger.debug(`Skipping slash command ${cmd.name}. Disabled`);
        }
    }

    /**
     * @param {string} directory
     */
    loadCommands(directory) {
        this.logger.log("Loading Commands...");
        const files = recursiveReadDirSync(directory);
        for (const file of files) {
            try {
                const cmd = require(file);
                if (typeof cmd !== "object") continue;
                this.loadCommand(cmd);
            } catch (ex) {
                this.logger.error(`Failed to load ${file}, reason: ${ex.message}`);
            }
        }

        this.logger.success(`Loaded ${this.commands.length} commands`)
        this.logger.success(`Loaded ${this.slashCommands.size} slash commands`);
        if (this.slashCommands.size > 100) throw new Error("A maximum of 100 slash commands can be enabled");
    }

    /**
     * @param {string} directory
     */
    loadContexts(directory) {
        this.logger.log("Loading Contexts...");
        const files = recursiveReadDirSync(directory);
        for (const file of files) {
            try {
                const ctx = require(file);
                if (typeof ctx !== "object") continue;
                if (!ctx.enabled) return this.logger.debug(`Skipping Context ${ctx.name}. Disabled`);
                if (this.contextMenus.has(ctx.name)) throw new Error(`Context already exists with that name`);
                this.contextMenus.set(ctx.name, ctx);
            } catch (ex) {
                this.logger.error(`Failed to load ${file}, reason ${ex.message}`);
            }
        }

        const userContexts = this.contextMenus.filter((ctx) => ctx.type === "USER").size;
        const messageContexts = this.contextMenus.filter((ctx) => ctx.type === "MESSAGE").size;

        if (userContexts > 3) throw new Error("A maximum of 3 USER contexts can be enabled");
        if (messageContexts > 3) throw new Error("A maximum of 3 MESSAGE contexts can be enabled");

        this.logger.success(`Loaded ${userContexts} USER contexts`);
        this.logger.success(`Loaded ${messageContexts} MESSAGE contexts`);
    }

    /**
     * @param {string} [guildId]
     */
    async registerInteractions(guildId) {
        const toRegister = [];

        if (this.config.INTERACTIONS.SLASH) {
            this.slashCommands
                .map((cmd) => ({
                    name: cmd.name,
                    description: cmd.description,
                    type: ApplicationCommandType.ChatInput,
                    options: cmd.slashCommand.options,
                }))
                .forEach((s) => toRegister.push(s));
        }

        if (this.config.INTERACTIONS.CONTEXT) {
            this.contextMenus
                .map((ctx) => ({
                    name: ctx.name,
                    type: ctx.type,
                }))
                .forEach((c) => toRegister.push(c));
        }

        if (!guildId) {
            await this.application.commands.set(toRegister);
        }

        else if (guildId && typeof guildId === "string") {
            const guild = this.guilds.cache.get(guildId);
            if (!guild) {
                this.logger.error(`Failed to register interactions in guild ${guildId}`, new Error("No matching guild"));
                return;
            }
            await guild.commands.set(toRegister);
        }

        else {
            throw new Error("Did you provide a valid guildId to register interactions");
        }

        this.logger.success("Successfully registered interactions");
    }

    /**
     * @param {string} search
     * @param {Boolean} exact
     */
    async resolveUsers(search, exact = false) {
        if (!search || typeof search !== "string") return [];
        const users = [];

        const patternMatch = search.match(/(\d{17,20})/);
        if (patternMatch) {
            const id = patternMatch[1];
            const fetched = await this.users.fetch(id, { cache: true }).catch(() => { });
            if (fetched) {
                users.push(fetched);
                return users;
            }

        }

        const matchingTags = this.users.cache.filter((user) => user.tag === search);
        if (exact && matchingTags.size === 1) users.push(matchingTags.first());
        else matchingTags.forEach((match) => users.push(match));

        if (!exact) {
            this.users.cache
                .filter(
                    (x) =>
                        x.username === search ||
                        x.username.toLowerCase().includes(search.toLowerCase()) ||
                        x.tag.toLowerCase().includes(search.toLowerCase())
                )
                .forEach((user) => users.push(user));
        }
        return users;
    }
};