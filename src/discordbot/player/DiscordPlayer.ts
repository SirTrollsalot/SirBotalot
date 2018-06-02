import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { GuildCommandContext } from "../command/GuildCommandContext";
import { EventEmitter } from "events";
import { Guild, VoiceChannel, VoiceConnection } from "discord.js";
import { LoggerInstance } from "winston";
import { getDiscordGuildPlayerLogger } from "../../logging/logger";
import { Readable } from "stream";
import * as ytdl from "ytdl-core";

enum PlayerStatus {
    STOPPED, PAUSED, PLAYING
}

type StreamProvider = () => Readable;

interface PlaylistItem {
    stream: StreamProvider;
}

class GuildPlayer extends EventEmitter implements Handler {

    private playlist: PlaylistItem[] = [];
    private playerStatus: PlayerStatus = PlayerStatus.STOPPED;
    private logger: LoggerInstance;

    constructor(private guild: Guild) {
        super();
        this.logger = getDiscordGuildPlayerLogger(guild);
        let router = new CommandRouter();

        router.use("yt", { handle: (cmd, resp) => {
            if (cmd.args.length == 1) {
                this.enqueue({ stream: () => {
                    return ytdl(cmd.args[0], { filter: "audioonly" });
                }});
                if (!this.guild.voiceConnection && cmd.message.member && cmd.message.member.voiceChannel) {
                    this.join(cmd.message.member.voiceChannel).then(this.start.bind(this));
                }
            }
        }});

        this.handle = router.handle.bind(router);
    }

    leave(): void {
        if (this.guild.voiceConnection) {
            this.stop();
            this.guild.voiceConnection.disconnect();
        }
    }

    join(channel: VoiceChannel): Promise<VoiceConnection> {
        return channel.join();
    }

    stop(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.playerStatus = PlayerStatus.STOPPED;
            this.guild.voiceConnection.dispatcher.end();
            this.emit("stopped");
        }
    }

    pause(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.playerStatus = PlayerStatus.PAUSED;
            this.guild.voiceConnection.dispatcher.pause();
            this.emit("paused");
        }
    }

    start(): void {
        // Start playing in connected channel
        if (this.guild.voiceConnection) {
            // If there is a paused playback resume it
            if (this.guild.voiceConnection.dispatcher) {
                if (this.guild.voiceConnection.dispatcher.paused) {
                    this.playerStatus = PlayerStatus.PLAYING;
                    this.guild.voiceConnection.dispatcher.resume();
                    this.emit("started");
                }
                console.log("tax fraud");
            } else {
                let item = this.playlist.shift();
                if (item) {
                    this.playerStatus = PlayerStatus.PLAYING;
                    this.guild.voiceConnection.playStream(item.stream()).on("end", () => {
                        // If player hasn't been stopped manually continue playing
                        if (this.playerStatus == PlayerStatus.PLAYING)
                            this.start();
                    });
                } else {
                    this.leave();
                }
            }
        }
    }

    enqueue(item: PlaylistItem) {
        this.playlist.push(item);
        this.emit("songEnqued", item);
    }

    handle: HandleCallback;
}

export class DiscordPlayer implements Handler {

    constructor() {
        let guildContext = new GuildCommandContext(guild => new GuildPlayer(guild));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}
