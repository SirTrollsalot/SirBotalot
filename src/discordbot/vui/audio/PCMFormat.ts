export interface PCMFormat {
    bitDepth: number;
    channels: number;
    encoding: "signed-integer" | "unsigned-integer" | "floating-point" | "a-law" | "u-law" | "mu-law" | "oki-adpcm" | "ima-adpcm" | "ms-adpcm" | "gsm-full-rate";
    sampleRate: number;
}