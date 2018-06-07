import { Message } from "discord.js";

export interface Command {
    message: Message;
    name: string;
    args: string[];
}

export interface Response {
    reply(message: string): void;
}

export type HandleCallback = (command: Command, response: Response) => void;

export interface Handler {
    handle: HandleCallback;
}

export class Handler implements Handler {
    constructor(public handle: HandleCallback) {}
}
