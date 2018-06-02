import { Handler } from "./Handler";

export class CommandRouter implements Handler {

    private handlers: Map<string, Handler> = new Map<string, Handler>();

    use(name: string, handler: Handler): void {
        this.handlers.set(name, handler);
    }

    handle(command, response) {
        let hander = this.handlers.get(command.name);
        if (hander) hander.handle(command, response);
    }
}