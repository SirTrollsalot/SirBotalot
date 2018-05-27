import * as nconf from 'nconf';
import { DiscordBot } from './discordbot/DiscordBot';
import { getMainLogger } from './logging/logger';

nconf.argv().env("_").file({file: 'config.json'}).defaults({});
nconf.required(["discordBot:token", "discordBot:commandPrefix"]);

let logger = getMainLogger();
let discordBot = new DiscordBot(nconf.get("discordBot"));

discordBot.login().then(() => {
    logger.info("Logged in");
    if (nconf.get("test")) {
        // If it's just a test then shut down after successfull start
        discordBot.close().then(() => process.exit());
    }
});

// Shut down gracefully
process.on("SIGINT", () => discordBot.close().then(() => process.exit()));
