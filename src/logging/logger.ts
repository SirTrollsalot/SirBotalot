import { Logger, LoggerOptions, transports, LoggerInstance, config } from 'winston';
import { Guild } from 'discord.js';

export type LoggerOptions = {
    colors?: boolean
};

let options: LoggerOptions = {};

export function setOptions(opts: LoggerOptions) {
    options = opts;
}

function getGuildLoggerOptions(label: string, guild: Guild): LoggerOptions {
    return {
        level: "debug",
        transports: [
            new transports.Console({
                timestamp: () => new Date().toLocaleString(),
                formatter: opts => `[${opts.timestamp()}|${options.colors ? config.colorize(opts.level, opts.level.toUpperCase()) : opts.level.toUpperCase()}|${label}(Guild-${guild.id})] ${opts.message} ${opts.meta && Object.keys(opts.meta).length ? "\n\t" + JSON.stringify(opts.meta) : ""}`
            })
        ]
    };
}

function getLoggerOptions(label: string): LoggerOptions {
    return {
        level: "debug",
        transports: [
            new transports.Console({
                timestamp: () => new Date().toLocaleString(),
                formatter: opts => `[${opts.timestamp()}|${options.colors ? config.colorize(opts.level, opts.level.toUpperCase()) : opts.level.toUpperCase()}|${label}] ${opts.message} ${opts.meta && Object.keys(opts.meta).length ? "\n\t" + JSON.stringify(opts.meta) : ""}`
            })
        ]
    };
}

export function getDiscordBotLogger(): LoggerInstance {
    return new Logger(getLoggerOptions("DiscordBot"));
}

export function getMainLogger(): LoggerInstance {
    return new Logger(getLoggerOptions("Main"));
}

export function getDiscordVUILogger(): LoggerInstance {
    return new Logger(getLoggerOptions("DiscordVUI"));
}

export function getDiscordLobbyManagerLogger(): LoggerInstance {
    return new Logger(getLoggerOptions("DiscordLobbyManager"));
}

export function getDiscordGuildPlayerLogger(guild: Guild): LoggerInstance {
    return new Logger(getGuildLoggerOptions("GuildPlayer", guild));
}

export function getDiscordGuildVUILogger(guild: Guild): LoggerInstance {
    return new Logger(getGuildLoggerOptions("GuildVUI", guild));
}

export function getVoiceConnectionStreamLogger(guild: Guild): LoggerInstance {
    return new Logger(getGuildLoggerOptions("VoiceConnectionStream", guild));
}
