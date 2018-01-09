import {hex2bin} from "../util";

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

    public static fromIntelHex(hex: string): FlashProgram {
        const lines = hex.split(/\n/);
        let upperAddr = 0;

        let startAddr = 0;

        let current = null;
        const chunks: FlashSection[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.substr(0, 1) !== ":") {
                throw new Error(`Invaild line in hex file: ${i + 1}`);
            } else {
                const length = parseInt(line.substr(1, 2), 16);
                const addr = upperAddr + parseInt(line.substr(3, 4), 16);
                const fieldType = parseInt(line.substr(7, 2), 16);
                const data = line.substr(9, length * 2);

                if (fieldType === 0x00) {
                    if (current && addr !== startAddr + (current.length / 2)) {
                        // non-contiguous
                        const sectionData = hex2bin(current);
                        chunks.push(new FlashSection(startAddr, new Uint32Array(sectionData.buffer)));

                        current = "";
                        startAddr = addr;
                    } else if (!current) {
                        startAddr = addr;
                        current = "";
                    }

                    current += data;
                } else if (fieldType === 0x01) {
                    // EOF
                    break;
                } else if (fieldType === 0x02) {
                    // extended segment address record
                    upperAddr = parseInt(data, 16) << 4;
                } else if (fieldType === 0x04) {
                    // extended linear address record
                    upperAddr = parseInt(data, 16) << 16;
                }
            }
        }

        return new FlashProgram(chunks);
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
