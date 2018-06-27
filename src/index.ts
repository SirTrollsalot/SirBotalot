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

let router = new CommandRouter();
router.use("version", (cmd, resp) => resp.reply(`Sir Botalot v${version}`));
router.use("help", (cmd, resp) => resp.reply("```\n" + generateHelpText(nconf.get("help")) + "\n```"));
discordBot.on("command", router.handle.bind(router));

// let discordAui = new DiscordVUI(nconf.get("discordBot:vui"));
// discordBot.on("command", discordAui.handle.bind(discordAui));

let discordLobbyManager = new DiscordLobbyManager(nconf.get("discordBot:lobbyManager"));
discordBot.on("command", discordLobbyManager.handle.bind(discordLobbyManager));

let discordPlayer = new DiscordPlayer(nconf.get("discordBot:player"));
discordBot.on("command", discordPlayer.handle.bind(discordPlayer));

discordBot.login();

// Shut down gracefully
process.on("SIGINT", () => {
    logger.info("Shutting down gracefully");
    discordBot.close().then(() => process.exit());
});
