import * as MemoryMap from "nrf-intel-hex";

export class FlashSection {
    constructor(public address: number, public data: Uint32Array) {
        /* empty */
    }

    public toString() {
        return `${this.data.byteLength} bytes @ ${this.address.toString(16)}`;
    }
}

/**
 * # Flash Program
 *
 * Represents a program to be flashed to memory as a series of disjoint sections
 * in memory/flash.
 *
 * ## Usage
 *
 * Use with a hex file is as simple as loading it from disk, and calling `fromIntelHex`.
 *
 * ```typescript
 * const hexFile = "microbit.hex";
 * const hexData = fs.readFileSync(hexFile, { encoding: 'utf-8' });
 *
 * const program = FlashProgram.fromIntelHex(hexData);
 * core.program(program, (progress) => {
 *     console.log(`Flash progress: ${progress * 100}%`);
 * });
 * ```
 *
 * When used with a binary file, you must make sure that the file is stored in a
 * Uint32Array, and you must provide a base address for the binary to be written to.
 * The base address is commonly zero.
 */
export class FlashProgram {

    constructor(public sections: FlashSection[]) {}

    public static fromArrayBuffer(buffer: ArrayBuffer): FlashProgram {
        // detect if buffer contains text or binary data
        const lengthToCheck = buffer.byteLength > 50 ? 50 : buffer.byteLength;
        const bufferString = Buffer.from(buffer).toString("utf8");
        for (let i = 0; i < lengthToCheck; i++) {
            const charCode = bufferString.charCodeAt(i);
            // 65533 is a code for unknown character
            // 0-8 are codes for control characters
            if (charCode === 65533 || charCode <= 8) {
                return FlashProgram.fromBinary(0, new Uint32Array(buffer));
            }
        }
        return FlashProgram.fromIntelHex(bufferString);
    }

    public static fromIntelHex(hex: string): FlashProgram {
        const hexMemory = MemoryMap.fromHex(hex);
        const flashSections: FlashSection[] = [];
        hexMemory.forEach((value: any, key: any) => {
            flashSections.push(new FlashSection(key, new Uint32Array(value.buffer)));
        });
        return new FlashProgram(flashSections);
    }

    public static fromBinary(addr: number, bin: Uint32Array) {
        return new FlashProgram([new FlashSection(addr, bin)]);
    }

    public totalByteLength() {
        return this.sections.map(s => s.data.byteLength).reduce((x, y) => x + y);
    }

    public toString() {
        return this.sections.toString();
    }
}
