import { ChildProcess, execFile } from "child_process";
import { Duplex, Readable, Writable } from "stream";

export type Format = {
    bitDepth: number;
    channels: number;
    encoding: "signed-integer" | "unsigned-integer" | "floating-point" | "a-law" | "u-law" | "mu-law" | "oki-adpcm" | "ima-adpcm" | "ms-adpcm" | "gsm-full-rate";
    sampleRate: number;
};

export function PCMResampler(inputFormat: Format, outputFormat: Format, input: Readable): Readable {
    let sox = execFile("sox", ["-b", inputFormat.bitDepth, "-c", inputFormat.channels, "-e", inputFormat.encoding, "-r", inputFormat.sampleRate, "-t", "raw", "-",
        "-b", outputFormat.bitDepth, "-c", outputFormat.channels, "-e", outputFormat.encoding, "-r", outputFormat.sampleRate, "-t", "raw", "-"].map(val => val.toString()));
    input.pipe(sox.stdin);
    sox.on("exit", (code, sig) => console.error(`SoX terminated in '${sig}' with code ${code}`));
    return sox.stdout;
}
