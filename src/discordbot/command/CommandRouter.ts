import { Handler, HandleCallback } from "./Handler";

export class CommandRouter implements Handler {

    private handlers: Map<string, Handler> = new Map<string, Handler>();

    useHandler(name: string, handler: Handler): void {
        this.handlers.set(name, handler);
    }

    use(name: string, callback: HandleCallback): void { 
        this.useHandler(name, new Handler(callback));
    }

    handle(command, response) {
        let hander = this.handlers.get(command.name);
        if (hander) hander.handle(command, response);
    }
}