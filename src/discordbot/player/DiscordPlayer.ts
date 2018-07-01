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
    ytdlOptions?: ytdl.downloadOptions,
    muteOnAfrica?: boolean
};

export type DiscordPlayerOptions = GuildPlayerOptions;

class GuildPlayer implements Handler {

    private playlist: PlaylistItem[] = [];
    private logger: LoggerInstance;

    constructor(private guild: Guild, private options: GuildPlayerOptions = {}) {
        this.logger = getDiscordGuildPlayerLogger(guild);

        // Default to only stream audio
        this.options = Object.assign({ ytdlOptions: { filter: "audioonly" } }, options);
        let router = new CommandRouter();

        router.use("play", (cmd, resp) => {
            if (cmd.args.length == 1 && (cmd.args[0].includes("youtube.com") || cmd.args[0].includes("youtu.be"))) {
                ytdl.getInfo(cmd.args[0]).then(info => {
                    let name = `${info.title} [${fromS(+info.length_seconds)}]`;
                    this.enqueue({
                        getStream: () => ytdl.downloadFromInfo(info, this.options.ytdlOptions),
                        name: name
                    }, (cmd.message.member && cmd.message.member.voiceChannel) ? cmd.message.member && cmd.message.member.voiceChannel : undefined);
                    resp.reply(`Added \`${name}\` to playlist`);
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

        router.use("pl", (cmd, resp) => this.printPlaylist(cmd.message.channel).catch(err => {
            this.logger.error("Error sending playlist", err);
            resp.reply(`\`Error: ${err.message}\``);
        }));

        this.handle = router.handle.bind(router);
    }

    leave(): void {
        if (this.guild.voiceConnection) {
            this.logger.verbose("Leaving voice channel");
            this.guild.voiceConnection.disconnect();
        }
    }

    join(channel: VoiceChannel): Promise<VoiceConnection> {
        if (channel.guild.id === this.guild.id && !this.connected) {
            this.logger.verbose(`Joining voice channel '${channel.id}'`);
            return channel.join().catch(err => {
                this.logger.error("Error joining voice channel", err);
                throw err;
            });
        }
        return Promise.reject(new Error("Channel not in this players guild or already connected"));
    }

    printPlaylist(channel: TextChannel | DMChannel | GroupDMChannel): Promise<Message | Message[]> {
        if (this.playlist && this.playlist.length) {
            this.logger.verbose(`Printing current playlist in channel ${channel.id}`);
            return channel.send(this.playlist.map(entry => entry.name).join("\n"), { split: true, code: true }).catch(err => {
                this.logger.error("Error printing playlist", err);
                throw err;
            });
        }
        return Promise.reject(new Error(this.playlist ? "Playlist empty" : "No playlist found"));
    }

    skip(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.logger.verbose("Skipping current song");
            this.guild.voiceConnection.dispatcher.end(SKIP);
        }
    }

    stop(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.logger.verbose("Clearing playlist and stopping playback");
            this.playlist = [];
            this.guild.voiceConnection.dispatcher.end(MANUAL_STOP);
        }
    }

    pause(): void {
        if (this.guild.voiceConnection && this.guild.voiceConnection.dispatcher) {
            this.logger.verbose("Pausing playback");
            this.guild.voiceConnection.dispatcher.pause();
        }
    }

    /**
     * Start playing in the connected channel
     */
    start(): void {
        if (this.connected) {
            // If there is a paused playback resume it
            if (this.guild.voiceConnection.dispatcher && this.guild.voiceConnection.dispatcher.paused) {
                this.logger.verbose("Resuming playback");
                this.guild.voiceConnection.dispatcher.resume();
            } else {
                let item = this.playlist.shift();
                if (item) {
                    this.logger.verbose(`Start playing '${item.name}'`);
                    let dispatcher = this.guild.voiceConnection.playStream(item.getStream(), this.options.discordPlaybackOptions).on("end", reason => {
                        this.logger.debug(`'${item}' finished playback`);
                        // If player hasn't been stopped manually continue playing
                        if (reason !== MANUAL_STOP)
                            this.start();
                    });
                    if (item.name.includes("Toto") && item.name.includes("Africa")) {
                        this.guild.voiceConnection.channel.members.filter(member => member != this.guild.me).forEach(member => member.setMute(true, "Toto - Africa"));
                        dispatcher.once("end", () => this.guild.voiceConnection.channel.members.forEach(member => member.setMute(false, "Toto - Africa ended")));
                    }
                } else {
                    this.logger.debug("Playlist empty, leaving channel");
                    // If no more songs in the queue leave
                    this.leave();
                }
            }
        }
    }

    /**
     * Add an item to the playlist
     * @param item The item to be added
     * @param autoJoinChannel If not null or undefined join the provided channel and start playback
     * @returns If autoJoinChannel is specified a Promise for when the client has established a connection with the channel
     */
    enqueue(item: PlaylistItem, autoJoinChannel?: VoiceChannel): Promise<VoiceConnection> | void {
        this.logger.verbose(`Enquing playlist item '${item.name}'`);
        this.playlist.push(item);
        if (autoJoinChannel && !this.connected)
            return this.join(autoJoinChannel).then(this.start.bind(this));
    }

    get connected(): boolean {
        return Boolean(this.guild.voiceConnection);
    }

    handle: HandleCallback;
}

export class DiscordPlayer implements Handler {

    constructor(private options?: DiscordPlayerOptions) {
        let guildContext = new GuildCommandContext(guild => new GuildPlayer(guild, options));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}
