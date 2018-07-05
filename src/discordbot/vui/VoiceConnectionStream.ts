import { VoiceConnection, VoiceReceiver, User } from "discord.js";
import { Mixer, Input, MixerArguments } from "audio-mixer";
import { getVoiceConnectionStreamLogger } from "../../logging/logger";
import { LoggerInstance } from "winston";
import { Readable } from "stream";

// Works with spoken input but sometimes doesn't
let inFormat = {
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000
};

export type VoiceConnectionStreamOptions = {
    outFormat?: MixerArguments
};

export class VoiceConnectionStream extends Mixer implements Readable {
    
    private logger: LoggerInstance;
    private _receiver: VoiceReceiver;

    private userInputs = new Map<User, Input>();

    constructor(private connection: VoiceConnection, private options: VoiceConnectionStreamOptions = {}) {
        super(options.outFormat || { channels: 2, sampleRate: 48000 });
        this.logger = getVoiceConnectionStreamLogger(this.connection.channel.guild);

        connection.on("speaking", (user, speaking) => {
            if (speaking) {
                this.logger.debug(`${user.username} started speaking`);

                this.logger.silly("Creating mixer input");
                let input = this.input(inFormat);

                this.logger.silly("Creating user stream");
                let stream = this.receiver.createPCMStream(user);

                this.logger.silly("Save input");
                this.userInputs.set(user, input);

                this.logger.silly("Pipe user stream into mixer input");
                stream.pipe(input);
            } else {
                this.logger.debug(`${user.username} stopped speaking`);

                this.logger.silly("Getting input and user");
                let input = this.userInputs.get(user);

                if (input) {
                    this.logger.silly("Remove input from mixer");
                    this.removeInput(input);
                } else {
                    this.logger.debug("Input wasn't found");
                }

                this.logger.silly("Deleting input");
                this.userInputs.delete(user);
            }
        });

        connection.on("disconnect", () => {
            this.userInputs.forEach(input => input.destroy());
            this.push(null);
            this.destroy();
        });
    }

    private get receiver() {
        if (!this._receiver)
            this._receiver = this.connection.createReceiver();
        return this._receiver;
    }
}
