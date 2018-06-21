import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { getDiscordAUILogger, getDiscordGuildAUILogger } from "../../logging/logger";
import { GuildCommandContext } from "../command/GuildCommandContext";
import { Guild } from "discord.js";
import { LoggerInstance } from "winston";
import { VoiceConnectionStreamManager, VoiceConnectionStreamManagerOptions } from "./VoiceConnectionStreamManager";

export type DiscordVUIOptions = {
    guildAUIOptions?: GuilddVUIOptions
};
export type GuilddVUIOptions = {
    voiceConnectionStreamManagerOptions?: VoiceConnectionStreamManagerOptions
};

class GuildVUI implements Handler {

    private logger: LoggerInstance;
    private manager?: VoiceConnectionStreamManager;

    constructor(private guild: Guild, private options: GuilddVUIOptions = {}) {
        this.logger = getDiscordGuildAUILogger(guild);
        let router = new CommandRouter();

        router.use("join", cmd => {
            if (cmd.message.member && cmd.message.member.voiceChannel && cmd.message.member.voiceChannel.guild.id === this.guild.id && !this.guild.voiceConnection)
                cmd.message.member.voiceChannel.join().then(conn => {
                    this.manager = new VoiceConnectionStreamManager(conn, options.voiceConnectionStreamManagerOptions);
                    conn.once("disconnect", () => this.manager = undefined);
                }, err => this.logger.warn(`Error connection to voice channel ${cmd.message.member.voiceChannel.id}: ${err}`));
        });
        router.use("leave", cmd => {
            
        });
        this.handle = router.handle.bind(router);
    }

    handle: HandleCallback;
}

export class DiscordVUI implements Handler {

    private logger = getDiscordAUILogger();

    constructor(config?: DiscordVUIOptions) {
        let guildContext = new GuildCommandContext(guild => new GuildVUI(guild));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}