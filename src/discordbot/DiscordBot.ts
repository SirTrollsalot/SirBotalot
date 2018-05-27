import { Client, ClientOptions, Message } from 'discord.js';
import { getDiscordBotLogger } from '../logging/logger';

type Handler = (command: Command, next: () => void) => void;

export interface Command {
    message: Message;
    name: string;
    args: string[];
}

export class DiscordBot {

    private client: Client;
    private handlers: Handler[] = [];
    private logger = getDiscordBotLogger();

    constructor(private config: { token: string, commandPrefix: string, clientOptions?: ClientOptions }) {
        this.client = new Client(config.clientOptions);
        this.client.on('message', this._handleMessage.bind(this));
    }

    login(): Promise<void> {
        return new Promise<void>((resolve, reject) => this.client.login(this.config.token).then(() => resolve, reject));
    }

    close(): Promise<void> {
        return this.client.destroy();
    }

    use(handler: Handler): void {
        this.handlers.push(handler);
    }

    private _handleMessage(message: Message): void {
        if (message.content.startsWith(this.config.commandPrefix)) {
            let tokens = message.cleanContent.substr(this.config.commandPrefix.length).split(' ').filter(v => v);  // Filter out empty strings
            if (tokens.length > 0) {
                let command = tokens[0];
                let handler = this.handlers.slice(0);
                // Trying to model something like the express middleware model
                let next = () => {
                    if (handler) {
                        let nextHandler = handler.shift();
                        if (nextHandler) {
                            try {
                                nextHandler({
                                    name: command,
                                    args: tokens.splice(1),
                                    message: message
                                }, next);
                            } catch (e) {
                                this.logger.warn(`Command handler for command '${command}' encountered an exception`, e);
                            }
                        }
                    }
                };
                next();
            } // Else empty command, e.g. '!'
        }
    }
}
