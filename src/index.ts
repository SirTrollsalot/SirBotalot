import * as nconf from 'nconf';
import { DiscordBot } from './discordbot/DiscordBot';
import { getMainLogger, setOptions } from './logging/logger';
import { CommandRouter } from './discordbot/command/CommandRouter';
import { DiscordVUI } from './discordbot/vui/DiscordVUI';
import { DiscordPlayer } from './discordbot/player/DiscordPlayer';
import { generateHelpText } from './Util';
import { DiscordLobbyManager } from './discordbot/lobbymanager/DiscordLobbyManager';

const version = require("../package.json").version;

// '__' double underline seperator for hierarchical parsing of environment variables
nconf.argv().env("__").file({file: 'config.json'}).defaults({});
nconf.required(["discordBot:token", "discordBot:commandPrefix", "help:commands"]);

setOptions(nconf.get("logging"));

let logger = getMainLogger();
let discordBot = new DiscordBot(nconf.get("discordBot"));

{
    logger.info("Create basic commands");
    let router = new CommandRouter();
    router.use("version", (cmd, resp) => resp.reply(`Sir Botalot v${version}`));
    router.use("help", (cmd, resp) => resp.reply("```\n" + generateHelpText(nconf.get("help")) + "\n```"));

    logger.info("Register basic commands");
    discordBot.on("command", router.handle.bind(router));
}
{
    logger.info("Create DiscordVUI");
    let discordAui = new DiscordVUI(nconf.get("discordBot:vui"));

    logger.info("Register DiscordVUI");
    discordBot.on("command", discordAui.handle.bind(discordAui));
}
{
    logger.info("Create DiscordLobbyManager");
    let discordLobbyManager = new DiscordLobbyManager(nconf.get("discordBot:lobbyManager"));

    logger.info("Register DiscordLobbyManager");
    discordBot.on("command", discordLobbyManager.handle.bind(discordLobbyManager));
}
{
    logger.info("Create DiscordPlayer");
    let discordPlayer = new DiscordPlayer(nconf.get("discordBot:player"));

    logger.info("Register DiscordPlayer");
    discordBot.on("command", discordPlayer.handle.bind(discordPlayer));
}

discordBot.login();

// Shut down gracefully
process.on("SIGINT", () => {
    logger.info("Shutting down gracefully");
    discordBot.close().then(() => process.exit());
});
