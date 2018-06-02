import { Client, ClientOptions, Message } from 'discord.js';
import { getDiscordBotLogger } from '../logging/logger';
import { EventEmitter } from 'events';
import { Command, Response } from './command/Handler';

export class DiscordBot extends EventEmitter {

    private client: Client;
    private logger = getDiscordBotLogger();

    constructor(private config: { token: string, commandPrefix: string, autoLeaveInterval?: number, clientOptions?: ClientOptions }) {
        super();
        this.client = new Client(config.clientOptions);
        this.client.on('message', this._handleMessage.bind(this));
        this.client.on("error", err => this.logger.error("Discord connection error", err));
    }

    login(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.client.login(this.config.token).then(() => {

                if (this.config.autoLeaveInterval) {
                    // Check every voice connection if channel is empty, can't be streamed to or everybody is muted and leave the channel if so
                    this.client.setInterval(() => {
                        this.logger.info("Checking for leavable channels");
                        let leftChannels = 0;
                        this.client.voiceConnections.forEach(conn => {
                            if (!(conn.channel.speakable && conn.channel.members.find(member => !member.deaf))) {
                                conn.disconnect();
                                leftChannels++;
                            }
                        });
                        this.logger.info(`Left ${leftChannels} channels`);
                    }, this.config.autoLeaveInterval);
                }

                resolve();
            }, reject);
        });
    }

    close(): Promise<void> {
        return this.client.destroy();
    }

    get username(): string {
        return this.client.user.username;
    }

    private _handleMessage(message: Message): void {
        if (message.content.startsWith(this.config.commandPrefix)) {
            let tokens = message.cleanContent.substr(this.config.commandPrefix.length).split(' ').filter(v => v);  // Filter out empty strings
            if (tokens.length > 0) {
                let command: Command = {
                    name: tokens[0],
                    args: tokens.slice(1),
                    message: message
                };
                let response: Response = {
                    reply: msg => message.channel.send(msg)
                };
                this.emit("command", command, response);
            } // Else empty command, e.g.: '!'
        }
    }
}
