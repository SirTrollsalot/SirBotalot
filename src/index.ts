import * as nconf from 'nconf';
import { DiscordBot } from './discordbot/DiscordBot';
import { getMainLogger } from './logging/logger';
import { CommandRouter } from './discordbot/command/CommandRouter';
import { DiscordAUI } from './discordbot/aui/DiscordAUI';
import { DiscordPlayer } from './discordbot/player/DiscordPlayer';
import * as AsciiTable from "ascii-table";

const version = require("../package.json").version;

nconf.argv().env("_").file({file: 'config.json'}).defaults({});
nconf.required(["discordBot:token", "discordBot:commandPrefix"]);

let logger = getMainLogger();
let discordBot = new DiscordBot(nconf.get("discordBot"));

let router = new CommandRouter();
router.use("version", { handle: (cmd, resp) => {
    resp.reply(`Sir Botalot v${version}`);
}});
router.use("help", { handle: (cmd, resp) => {
    let table = new AsciiTable("Help").setHeading("Command", "Description").removeBorder();
    table.addRow("help", "Print this help text");
    table.addRow("yt", "Queue a youtube video and start playback");
    resp.reply("```\n" + table.toString() + "\n```");
}});
discordBot.on("command", router.handle.bind(router));

let discordAui = new DiscordAUI({});
discordBot.on("command", discordAui.handle.bind(discordAui));

let discordPlayer = new DiscordPlayer();
discordBot.on("command", discordPlayer.handle.bind(discordPlayer));

discordBot.login().then(() => {
    logger.info(`Logged in as ${discordBot.username}`);
    if (nconf.get("test")) {
        // If it's just a test then shut down after successfull start
        discordBot.close().then(() => process.exit());
    }
});

// Shut down gracefully
process.on("SIGINT", () => discordBot.close().then(() => process.exit()));
