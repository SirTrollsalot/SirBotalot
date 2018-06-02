import { Logger, LoggerStatic, transports, LoggerInstance } from 'winston';

export function getDiscordBotLogger(): LoggerInstance {
    return new Logger({
        transports: [
            new transports.Console()
        ]
    });
}

export function getMainLogger(): LoggerInstance {
    return new Logger({
        transports: [
            new transports.Console()
        ]
    });
}

export function getDiscordAUILogger(): LoggerInstance {
    return new Logger({
        transports: [
            new transports.Console()
        ]
    });
}
