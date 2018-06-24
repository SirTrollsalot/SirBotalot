import { Client, ClientOptions, Message } from 'discord.js';
import { getDiscordBotLogger } from '../logging/logger';
import { EventEmitter } from 'events';
import { Command, Response } from './command/Handler';

export type DiscordBotOptions = {
    token: string,
    commandPrefix: string,
    autoLeaveInterval?: number,
    clientOptions?: ClientOptions,
    status?: string
};

export class DiscordBot extends EventEmitter {

    private client: Client;
    private logger = getDiscordBotLogger();

    constructor(private options: DiscordBotOptions) {
        super();
        this.client = new Client(options.clientOptions);
        this.client.on('message', this._handleMessage.bind(this));
        this.client.on("error", err => this.logger.error("Discord connection error", err));
    }

    login(): Promise<void> {
        return this.client.login(this.options.token).then(() => {
            this.logger.info(`Connected as ${this.client.user.username}`);
            
            if (this.options.status) {
                this.logger.verbose(`Setting presence to '${this.options.status}'`);
                this.client.user.setPresence({
                    game: {
                        name: this.options.status
                    }
                }).catch(err => this.logger.error("Error setting presence", err));
            }

            if (this.options.autoLeaveInterval) {
                this.logger.info(`Enable auto-leave with ${this.options.autoLeaveInterval}ms`);
                // Check every voice connection if channel is empty, can't be streamed to or everybody is muted and leave the channel if so
                this.client.setInterval(() => {
                    this.logger.debug("Checking for leavable channels");
                    let leftChannels = 0;
                    this.client.voiceConnections.forEach(conn => {
                        if (!(conn.channel.speakable && conn.channel.members.find(member => !member.deaf))) {
                            conn.disconnect();
                            leftChannels++;
                        }
                    });
                    this.logger.verbose(`(auto-leave) Left ${leftChannels} channels`);
                }, this.options.autoLeaveInterval);
            }
        }, err => {
            this.logger.error("Error logging in", err);
            throw err;
        });
    }

    close(): Promise<void> {
        this.logger.info("Shutting down");
        return this.client.destroy().catch(err => { 
            this.logger.error("Error shutting down", err);
            throw err;
        });
    }

    get username(): string {
        return this.client.user.username;
    }

    private _handleMessage(message: Message): void {
        if (message.content.startsWith(this.options.commandPrefix)) {
            this.logger.verbose("Received command");
            let tokens = message.cleanContent.substr(this.options.commandPrefix.length).split(' ').filter(v => v);  // Filter out empty strings
            if (tokens.length > 0) {
                this.logger.verbose(`Parsed command ${tokens[0]} with ${tokens.length - 1} arguments`);
                let command: Command = {
                    name: tokens[0],
                    args: tokens.slice(1),
                    message: message
                };
                let response: Response = {
                    reply: msg => message.channel.send(msg)
                };
                this.emit("command", command, response);
            } else {
                this.logger.debug("Parsed empty command - ignoring");
            }
        }
    }
}
