import { Message } from "discord.js";

export interface Command {
    message: Message;
    name: string;
    args: string[];
}

export interface Response {
    reply(message: string): void;
}

export type HandlerCallback = (command: Command, response: Response) => void;

export interface Handler {
    handler: HandlerCallback;
}
