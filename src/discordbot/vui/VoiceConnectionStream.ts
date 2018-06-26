import { VoiceConnection, VoiceReceiver, User } from "discord.js";
import { Readable } from "stream";
import * as Speaker from "speaker";
import { Mixer, Input } from "audio-mixer";
import { getVoiceConnectionStreamLogger } from "../../logging/logger";
import { LoggerInstance } from "winston";
import { FileWriter } from "wav";

// ----- TEST -----

let outFormat = {
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000
};

// Works with spoken input
// let inFormat = {
//     channels: 2,
//     bitDepth: 16,
//     sampleRate: 48000
// };

let inFormat = {
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000
};

// ----- END -----

export class VoiceConnectionStream {
    
    private logger: LoggerInstance;
    private _receiver: VoiceReceiver;

    private mixer = new Mixer(outFormat);

    private inputs = new Map<User, Input>();

    constructor(private connection: VoiceConnection) {
        this.logger = getVoiceConnectionStreamLogger(this.connection.channel.guild);
        this.logger.debug(`Out format: sample rate: ${outFormat.sampleRate}, bit depth: ${outFormat.bitDepth}, channels: ${outFormat.channels}`);
        this.logger.debug(`In format: sample rate: ${inFormat.sampleRate}, bit depth: ${inFormat.bitDepth}, channels: ${inFormat.channels}`);

        let file = new FileWriter("test.wav", outFormat);

        // this.mixer.pipe(this.test_speaker);
        connection.on("speaking", (user, speaking) => {
            if (speaking) {
                this.logger.debug(`${user.username} started speaking`);

                this.logger.silly("Creating mixer input");
                let input = this.mixer.input(inFormat);

                this.logger.silly("Creating user stream");
                let stream = this.receiver.createPCMStream(user);

                this.logger.silly("Save input");
                this.inputs.set(user, input);

                this.logger.silly("Pipe user stream into mixer input");
                stream.pipe(file, { end: false });
            } else {
                this.logger.debug(`${user.username} stopped speaking`);

                this.logger.silly("Getting input and user");
                let input = this.inputs.get(user);

                if (input) {
                    this.logger.silly("Remove input from mixer");
                    this.mixer.removeInput(input);
                } else {
                    this.logger.debug("Input wasn't found");
                }

                this.logger.silly("Deleting input");
                this.inputs.delete(user);
            }
        });
    }

    private get receiver() {
        if (!this._receiver)
            this._receiver = this.connection.createReceiver();
        return this._receiver;
    }
}
