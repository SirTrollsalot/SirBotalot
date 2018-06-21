import { VoiceConnection, User, VoiceReceiver } from "discord.js";
import { EventEmitter } from "events";
import { Readable, ReadableOptions, PassThrough } from "stream";

export type VoiceConnectionStreamManagerOptions = {};

export class VoiceConnectionStreamManager extends EventEmitter {

    private _receiver: VoiceReceiver;

    constructor(private connection: VoiceConnection, private options?: VoiceConnectionStreamManagerOptions) {
        super();
        connection.on("speaking", (user, speaking) => {
            if (speaking) {
                
            }
        });
    }

    private get receiver() {
        if (!this._receiver)
            this._receiver = this.connection.createReceiver();
        return this._receiver;
    }
}