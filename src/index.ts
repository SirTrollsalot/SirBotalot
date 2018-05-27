import * as nconf from 'nconf';
import { DiscordBot } from './discordbot/DiscordBot';

nconf.argv().env("_").file({file: 'config.json'}).defaults({});
nconf.required(["discordBot:token", "discordBot:commandPrefix"]);

let discordBot = new DiscordBot(nconf.get("discordBot"));

discordBot.login();

// Shut down gracefully
process.on("SIGINT", () => discordBot.close().then(() => process.exit()));
