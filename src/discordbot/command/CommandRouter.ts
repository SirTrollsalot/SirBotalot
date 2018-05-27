import { Handler, HandlerCallback } from "./Handler";

export class CommandRouter implements Handler {

    private handlers: Map<string, HandlerCallback> = new Map<string, HandlerCallback>();

    use(name: string, handler: HandlerCallback): void {
        this.handlers.set(name, handler);
    }

    handler: HandlerCallback = (command, response) => {
        let hander = this.handlers.get(command.name);
        if (hander) hander(command, response);
    }
}