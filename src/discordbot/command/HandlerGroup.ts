import { Handler, HandlerCallback } from "./Handler";

export class HandlerGroup implements Handler {
    private handlers: HandlerCallback[] = [];

    add(handler: HandlerCallback): void {
        this.handlers.push(handler);
    }

    handler: HandlerCallback = (command, response) => this.handlers.forEach(handler => handler(command, response));
}