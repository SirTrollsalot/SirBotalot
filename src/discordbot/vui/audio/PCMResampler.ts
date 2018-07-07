import { spawn } from "child_process";
import { Duplex, Readable } from "stream";
import * as duplexify from "duplexify";
import { PCMFormat } from "./PCMFormat";

export function createResampler(inputFormat: PCMFormat, outputFormat: PCMFormat): Duplex {
    let sox = spawn("sox", ["-b", inputFormat.bitDepth, "-c", inputFormat.channels, "-e", inputFormat.encoding, "-r", inputFormat.sampleRate, "-t", "raw", "-",
        "-b", outputFormat.bitDepth, "-c", outputFormat.channels, "-e", outputFormat.encoding, "-r", outputFormat.sampleRate, "-t", "raw", "-"].map(val => val.toString()));
    let stream = duplexify(sox.stdin, sox.stdout, { objectMode: false, highWaterMark: 16384 });
    sox.on("error", err => stream.emit("error", err));
    sox.stderr.on("data", err => stream.emit("error", err));
    return stream;
}
