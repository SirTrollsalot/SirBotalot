import { Handler } from "./Handler";
import { Guild } from "discord.js";

export type THandlerFactory = (guild: Guild) => Handler;

export class GuildCommandContext implements Handler {

    private handlers: Map<Guild, Handler> = new Map<Guild, Handler>();

    constructor(private handlerFactory: THandlerFactory) {
    }

    handle(cmd, resp) {
        if (cmd.message.guild) {
            let handler = this.handlers.get(cmd.message.guild);
            if (!handler)
                this.handlers.set(cmd.message.guild, handler = this.handlerFactory(cmd.message.guild));  // !! Assignment in argument !!
            handler.handle(cmd, resp);
        }
    }
}
