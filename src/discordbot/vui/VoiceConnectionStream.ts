import { VoiceConnection, VoiceReceiver, User } from "discord.js";
import { Readable, PassThrough } from "stream";
// import * as Speaker from "speaker";
import { Mixer, Input } from "audio-mixer";
import { getVoiceConnectionStreamLogger } from "../../logging/logger";
import { LoggerInstance } from "winston";

/*
 * This should probably (definitely) be implemented in C/C++
 */
export class VoiceConnectionStream {
    
    private logger: LoggerInstance;
    private _receiver: VoiceReceiver;

    private mixer = new Mixer({
        channels: 2,
        bitDepth: 16,
        sampleRate: 44100
    });

    private inputs = new Map<User, Input>();
    private streams = new Map<User, Readable>();

    // private test_speaker = new Speaker({
    //     channels: 2,
    //     bitDepth: 16,
    //     sampleRate: 44100,
    //     signed: true
    // });

    private test_speaker = new PassThrough();

    constructor(private connection: VoiceConnection) {
        this.logger = getVoiceConnectionStreamLogger(this.connection.channel.guild);
        this.mixer.pipe(this.test_speaker);
        connection.on("speaking", (user, speaking) => {
            if (speaking) {
                this.logger.info(`${user.username} started speaking`);

                this.logger.silly("Creating mixer input");
                let input = this.mixer.input({
                    channels: 2,
                    bitDepth: 32,
                    sampleRate: 48000
                });

                this.logger.silly("Creating user sream");
                let stream = this.receiver.createPCMStream(user);

                this.logger.silly("Save stream and input");
                this.inputs.set(user, input);
                this.streams.set(user, stream);

                this.logger.silly("Pipe user stream into mixer input");
                stream.pipe(input);
            } else {
                this.logger.info(`${user.username} stopped speaking`);

                this.logger.silly("Getting input and user");
                let input = this.inputs.get(user);
                let stream = this.streams.get(user);

                if (input) {
                    this.logger.silly("Remove input from mixer");
                    this.mixer.removeInput(input);
                } else {
                    this.logger.warn("Input wasn't found");
                }

                if (stream) {
                    this.logger.silly("Destroying stream");
                    stream.destroy();
                } else {
                    this.logger.warn("Stream wasn't found");
                }

                this.logger.silly("Deleting input and stream");
                this.inputs.delete(user);
                this.streams.delete(user);
            }
        });
    }

    private get receiver() {
        if (!this._receiver)
            this._receiver = this.connection.createReceiver();
        return this._receiver;
    }
}
