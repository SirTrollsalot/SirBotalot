import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { Readable } from "stream";
import { ReadableStreamBuffer } from "stream-buffers";
import { writeFile } from "fs";

export type SpeechSynthesizerOptions = {
    defaultLanguage?: string,
    defaultGender?: string
};

export class SpeechSynthesizer {

    private client = new TextToSpeechClient();

    constructor(private options: SpeechSynthesizerOptions = {}) {
    }

    synthesize(text: string, language?: string, gender?: string): Promise<Readable> {
        return new Promise((resolve, reject) => {
            this.client.synthesizeSpeech({
                input: { text: text },
                voice: { languageCode: language || this.options.defaultLanguage || "en-US", ssmlGender: gender || this.options.defaultGender || "FEMALE" },
                audioConfig: { audioEncoding: "OGG_OPUS" }
            }, (err, response) => {
                if (err)
                    reject(err);
                else {
                    let stream = new ReadableStreamBuffer();
                    stream.put(response.audioContent);
                    resolve(stream);
                }
            });
        });
    }
}