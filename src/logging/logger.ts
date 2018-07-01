import { Logger, LoggerOptions, transports, LoggerInstance, config } from 'winston';
import { Guild } from 'discord.js';

export type LoggerOptions = {
    colors?: boolean
};

let options: LoggerOptions = {};

function serializeObject(o: object, indent: number = 0, depth: number = 3): string {
    // Recursion stop
    if (depth <= 0) return "<...>";
    if (typeof(o) === "function") return "<function>";
    if (typeof(o) !== "object" || !o) return o;
    return Object.keys(o).reduce((acc, key) => acc + `\n${" ".repeat(indent)}${key}: ${serializeObject(o[key], indent + 4, depth - 1)}`, "") || "{}";
}

export function setOptions(opts: LoggerOptions) {
    options = opts;
}

function getGuildLoggerOptions(label: string, guild: Guild): LoggerOptions {
    return {
        level: "verbose",
        transports: [
            new transports.Console({
                timestamp: () => new Date().toLocaleString(),
                formatter: opts => `[${opts.timestamp()}|${options.colors ? config.colorize(opts.level, opts.level.toUpperCase()) : opts.level.toUpperCase()}|${label}(Guild-${guild.id})] ${opts.message} ${opts.meta && Object.keys(opts.meta).length ? serializeObject(opts.meta, 4) : ""}`
            })
        ]
    };
}

function getLoggerOptions(label: string): LoggerOptions {
    return {
        level: "verbose",
        transports: [
            new transports.Console({
                timestamp: () => new Date().toLocaleString(),
                formatter: opts => `[${opts.timestamp()}|${options.colors ? config.colorize(opts.level, opts.level.toUpperCase()) : opts.level.toUpperCase()}|${label}] ${opts.message} ${opts.meta && Object.keys(opts.meta).length ? serializeObject(opts.meta, 4) : ""}`
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
