import { Handler, HandleCallback } from "../command/Handler";
import { CommandRouter } from "../command/CommandRouter";
import { getDiscordAUILogger } from "../../logging/logger";

export class DiscordAUI implements Handler {

    private logger = getDiscordAUILogger();

    constructor(config: {}) {
        let router = new CommandRouter();

        // router.use("join", cmd => {
        //     // Basically does this: cmd.message.member?.voiceChannel?.join() but less cool
        //     if (cmd.message.member && cmd.message.member.voiceChannel) {
        //         cmd.message.member.voiceChannel.join().then(conn => {
        //             this.logger.info(`Joined voice channel ${conn.channel.id}`);
        //             let recv = conn.createReceiver();
        //             recv.on("warn", (reason, msg) => this.logger.warn(`${reason} failed: ${msg}`));
        //         }).catch(reason => this.logger.warn(`Could not join voice channel ${cmd.message.member.voiceChannel.id}: ${reason}`));
        //     }
        // });
        // router.use("leave", cmd => {
        //     // Basically does this: cmd.message.member?.voiceChannel?.leave() but less cool
        //     if (cmd.message.member && cmd.message.member.voiceChannel)
        //         cmd.message.member.voiceChannel.leave();
        // });

        this.handle = router.handle.bind(router);
    }

    handle: HandleCallback;
}