import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { getDiscordVUILogger, getDiscordGuildVUILogger } from "../../logging/logger";
import { GuildCommandContext } from "../command/GuildCommandContext";
import { Guild } from "discord.js";
import { LoggerInstance } from "winston";
import { VoiceConnectionStream } from "./VoiceConnectionStream";

export type DiscordVUIOptions = {
    guildAUIOptions?: GuilddVUIOptions
};

export type GuilddVUIOptions = {
};

class GuildVUI implements Handler {

    private logger: LoggerInstance;
    private stream?: VoiceConnectionStream;

    constructor(private guild: Guild, private options: GuilddVUIOptions = {}) {
        this.logger = getDiscordGuildVUILogger(guild);
        let router = new CommandRouter();

        router.use("join", cmd => {
            if (cmd.message.member && cmd.message.member.voiceChannel && cmd.message.member.voiceChannel.guild.id === this.guild.id && !this.guild.voiceConnection)
                cmd.message.member.voiceChannel.join().then(conn => {
                    this.stream = new VoiceConnectionStream(conn);
                    conn.on("debug", this.logger.debug.bind(this.logger));
                    conn.on("warn", this.logger.warn.bind(this.logger));
                    conn.on("error", this.logger.error.bind(this.logger));
                    conn.once("disconnect", () => this.stream = undefined);
                }, err => this.logger.warn(`Error connection to voice channel ${cmd.message.member.voiceChannel.id}: ${err}`));
        });
        router.use("leave", cmd => {
            if (cmd.message.guild && cmd.message.guild.voiceConnection) {
                cmd.message.guild.voiceConnection.disconnect();
            }
        });
        this.handle = router.handle.bind(router);
    }

    handle: HandleCallback;
}

export class DiscordVUI implements Handler {

    private logger = getDiscordVUILogger();

    constructor(config?: DiscordVUIOptions) {
        let guildContext = new GuildCommandContext(guild => new GuildVUI(guild));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}