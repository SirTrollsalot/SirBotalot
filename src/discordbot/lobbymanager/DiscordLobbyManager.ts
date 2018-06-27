import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { getDiscordLobbyManagerLogger } from "../../logging/logger";
import { VoiceChannel } from "discord.js";

export type DiscordLobbyManagerOptions = {
    channelEmptyCheckInterval?: number
};

export class DiscordLobbyManager implements Handler {

    private logger = getDiscordLobbyManagerLogger();

    constructor(private options: DiscordLobbyManagerOptions = {}) {
        options = Object.assign({
            channelEmptyCheckInterval: 1000 * 10
        }, options);

        let router = new CommandRouter();

        router.use("lobby", (cmd, resp) => {
            if (cmd.message.guild) {
                let name = cmd.args.join(" ") || `${cmd.message.author.username}'s Lobby`;
                cmd.message.guild.createChannel(name, "voice", undefined, "Temporary Lobby").then(channel => {
                    
                    cmd.message.member.setVoiceChannel(channel).catch(err => this.logger.error("Error moving member", err));
                    let interval = setInterval(() => {
                        if ((<VoiceChannel>channel).members.array().length == 0) {
                            clearInterval(interval);
                            channel.delete().catch(err => this.logger.error("Error deleting channel", err));
                        }
                    }, options.channelEmptyCheckInterval);
                }, err => {
                    this.logger.error("Error creating channel", err);
                    resp.reply("Error creating channel");
                });
            }
        });

        router.use("setParent", (cmd, resp) => {
            if (cmd.message.guild && cmd.args.length > 0) {
                
            }
        });

        this.handle = router.handle.bind(router);
    }

    handle: HandleCallback;
}