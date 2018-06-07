import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { GuildCommandContext } from "../command/GuildCommandContext";
import { fromS } from "hh-mm-ss";
import { Guild, VoiceChannel, VoiceConnection, StreamOptions, TextChannel, Message, DMChannel, GroupDMChannel } from "discord.js";
import { LoggerInstance } from "winston";
import { getDiscordGuildPlayerLogger } from "../../logging/logger";
import { Readable } from "stream";
import * as ytdl from "ytdl-core";

const MANUAL_STOP: string = "manual_stop";
const SKIP: string = "skip";

type StreamProvider = () => Readable;

interface PlaylistItem {
    getStream: StreamProvider;
    name: string;
}

type GuildPlayerOptions = {
    discordPlaybackOptions?: StreamOptions,
    ytdlOptions?: ytdl.downloadOptions
};

class GuildPlayer implements Handler {

    private playlist: PlaylistItem[] = [];
    private logger: LoggerInstance;

    constructor(private guild: Guild, private options: GuildPlayerOptions = {}) {
        this.logger = getDiscordGuildPlayerLogger(guild);

        // Default to only stream audio
        if (!options.ytdlOptions)
            options.ytdlOptions = { filter: "audioonly" };
        else if (!options.ytdlOptions.filter)
            options.ytdlOptions.filter = "audioonly";
        let router = new CommandRouter();

        router.use("play", (cmd, resp) => {
            if (cmd.args.length == 1 && (cmd.args[0].includes("youtube.com") || cmd.args[0].includes("youtu.be"))) {
                ytdl.getInfo(cmd.args[0]).then(info => {
                    this.enqueue({
                        getStream: () => ytdl.downloadFromInfo(info, this.options.ytdlOptions),
                        name: `${info.title} [${fromS(+info.length_seconds)}]`
                    }, (cmd.message.member && cmd.message.member.voiceChannel) ? cmd.message.member && cmd.message.member.voiceChannel : undefined);
                });
            } else
                resp.reply("Invalid `<song>` argument!");
        });

        router.use("stop", () => {
            this.stop();
            this.leave();
        });
        router.use("skip", this.skip.bind(this));
        router.use("pause", this.pause.bind(this));
        router.use("resume", this.start.bind(this));
        router.use("pl", cmd => this.printPlaylist(cmd.message.channel));

        this.handle = router.handle.bind(router);
    }

    leave(): void {
        if (this.guild.voiceConnection)
            this.guild.voiceConnection.disconnect();
    }

    join(channel: VoiceChannel): Promise<VoiceConnection> {
        if (channel.guild.id === this.guild.id && !this.connected)
            return channel.join();
        return Promise.reject("Channel not in this players guild or already connected");
    }

    printPlaylist(channel: TextChannel | DMChannel | GroupDMChannel): Promise<Message | Message[]> {
        return channel.send(this.playlist.map(entry => entry.name).join("\n"), { split: true, code: true });
    }

    skip(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher)
            this.guild.voiceConnection.dispatcher.end(SKIP);
    }

    stop(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.playlist = [];
            this.guild.voiceConnection.dispatcher.end(MANUAL_STOP);
        }
    }

    pause(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher)
            this.guild.voiceConnection.dispatcher.pause();
    }

    /**
     * Start playing in the connected channel
     */
    start(): void {
        if (this.connected) {
            // If there is a paused playback resume it
            if (this.guild.voiceConnection.dispatcher && this.guild.voiceConnection.dispatcher.paused) {
                this.guild.voiceConnection.dispatcher.resume();
            } else {
                let item = this.playlist.shift();
                if (item) {
                    this.guild.voiceConnection.playStream(item.getStream(), this.options.discordPlaybackOptions).on("end", reason => {
                        // If player hasn't been stopped manually continue playing
                        if (reason !== MANUAL_STOP)
                            this.start();
                    });
                } else {
                    // If no more songs in the queue leave
                    this.leave();
                }
            }
        }
    }

    /**
     * Add an item to the playlist
     * @param item The item to be added
     * @param autoJoin If not null or undefined join the provided channel and start playback
     */
    enqueue(item: PlaylistItem, autoJoinChannel?: VoiceChannel): void {
        this.playlist.push(item);
        if (autoJoinChannel && !this.connected)
            this.join(autoJoinChannel).then(this.start.bind(this));
    }

    get connected(): boolean {
        return Boolean(this.guild.voiceConnection);
    }

    handle: HandleCallback;
}

export type DiscordPlayerOptions = GuildPlayerOptions;

export class DiscordPlayer implements Handler {

    constructor(private options?: DiscordPlayerOptions) {
        let guildContext = new GuildCommandContext(guild => new GuildPlayer(guild, options));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}
