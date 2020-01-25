export declare class TextDecoder {
    private partialChar;
    /**
     * Decode an ArrayBuffer to a string, handling double-byte characters
     * @param input The ArrayBuffer to decode
     */
    decode(input: ArrayBuffer): string;
    private decoderReplacer;
}
