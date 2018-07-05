import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { getDiscordVUILogger, getDiscordGuildVUILogger } from "../../logging/logger";
import { GuildCommandContext } from "../command/GuildCommandContext";
import { Guild } from "discord.js";
import { LoggerInstance } from "winston";
import { VoiceConnectionStream } from "./VoiceConnectionStream";
import { Detector, Models } from "snowboy";
import { PCMResampler } from "./PCMResampler";
import { FileWriter } from "wav"

export type DiscordVUIOptions = {
    guildVUIOptions: GuilddVUIOptions
};

export type GuilddVUIOptions = {
    detection: {
        modelOptions: {
            file: string;
            hotwords: string | Array<string>;
            sensitivity?: string;
        },
        detectorOptions?: {
            resource?: string;
            audioGain?: number;
            applyFrontend?: boolean;
            highSensitivity?: string;
            models?: Models
        }
    };
};

class GuildVUI implements Handler {

    private logger: LoggerInstance;
    private detector: Detector;

    constructor(private guild: Guild, private options: GuilddVUIOptions) {
        this.logger = getDiscordGuildVUILogger(guild);

        let models = new Models();
        models.add(options.detection.modelOptions);

        this.detector = new Detector(Object.assign({ resource: "node_modules/snowboy/resources/common.res", models: models }, options.detection.detectorOptions || {}));

        this.logger.verbose(`Created detector with sample rate: ${this.detector.sampleRate()}, bit rate: ${this.detector.bitsPerSample()}, channels: ${this.detector.numChannels()}`);

        this.detector.on("hotword", (i, hotword) => this.logger.verbose(`Hotword ${i} '${hotword}' triggered`));
        this.detector.on("error", err => this.logger.error("Hotword detection error", err));

        let router = new CommandRouter();

        router.use("join", cmd => {
            if (cmd.message.member && cmd.message.member.voiceChannel && cmd.message.member.voiceChannel.guild.id === this.guild.id && !this.guild.voiceConnection) {
                this.logger.verbose("Joining voice channel");
                cmd.message.member.voiceChannel.join().then(conn => {
                    let voice = new VoiceConnectionStream(conn)
                    .on("error", err => this.logger.error("Voice Connection Stream error", err));
                    PCMResampler({
                        channels: 2,
                        bitDepth: 16,
                        encoding: "signed-integer",
                        sampleRate: 48000
                    }, {
                        channels: this.detector.numChannels(),
                        bitDepth: this.detector.bitsPerSample(),
                        encoding: "signed-integer",
                        sampleRate: this.detector.sampleRate()
                    }, voice).pipe(process.stdout);
                    // .pipe(new FileWriter("test.wav", {
                    //     channels: this.detector.numChannels(),
                    //     bitDepth: this.detector.bitsPerSample(),
                    //     sampleRate: this.detector.sampleRate()
                    // }));
                }, err => this.logger.error(`Error connecting to voice channel ${cmd.message.member.voiceChannel.id}: ${err}`));
            }
                
        });
        router.use("leave", cmd => {
            if (this.guild.voiceConnection) {
                this.logger.verbose("Leaving voice channel");
                this.guild.voiceConnection.disconnect();
            }
        });

        this.handle = router.handle.bind(router);
    }

    handle: HandleCallback;
}

export class DiscordVUI implements Handler {

    private logger = getDiscordVUILogger();

    constructor(options: DiscordVUIOptions) {
        let guildContext = new GuildCommandContext(guild => new GuildVUI(guild, options.guildVUIOptions));
        this.handle = guildContext.handle.bind(guildContext);
    }

    handle: HandleCallback;
}