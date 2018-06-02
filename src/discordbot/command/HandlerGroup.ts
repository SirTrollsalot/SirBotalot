import { Handler } from "./Handler";

export class HandlerGroup implements Handler {
    private handlers: Handler[] = [];

    add(handler: Handler): void {
        this.handlers.push(handler);
    }

    handle(command, response) {
        this.handlers.forEach(handler => handler.handle(command, response));
    }
}