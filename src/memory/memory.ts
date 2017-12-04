import {DAP} from "../dap/dap";

import {ApReg, Csw,  DapVal} from "../dap/constants";
import {PreparedDapCommand} from "../dap/prepared";
import {apReg, assert, bufferConcat, delay} from "../util";

import {PreparedMemoryCommand} from "./prepared";

/**
 * # Memory Interface
 *
 * Controls access to the target's memory.
 *
 * ## Usage
 *
 * Using an instance of `CortexM`, as described before, we can simply read and
 * write numbers to memory as follows:
 *
 * ```typescript
 * const mem = core.memory;
 *
 * // NOTE: the address parameter must be word (4-byte) aligned.
 * await mem.write32(0x200000, 12345);
 * const val = await mem.read32(0x200000);
 *
 * // val === 12345
 *
 * // NOTE: the address parameter must be half-word (2-byte) aligned
 * await mem.write16(0x2000002, 65534);
 * const val16 = await mem.read16(0x2000002);
 *
 * // val16 === 65534
 * ```
 *
 * To write a larger block of memory, we can use `readBlock` and `writeBlock`. Again,
 * these blocks must be written to word-aligned addresses in memory.
 *
 * ```typescript
 * const data = new Uint32Array([0x1234, 0x5678, 0x9ABC, 0xDEF0]);
 * await mem.writeBlock(0x200000, data);
 *
 * const readData = await mem.readBlock(0x200000, data.length, 0x100);
 * ```
 *
 * ## See also
 *
 * `PreparedMemoryCommand` provides an equivalent API with better performance (in some
 * cases) by enabling batched memory operations.
 */
export class Memory {
    private dev: DAP;

    constructor(dev: DAP) {
        this.dev = dev;
    }

    /**
     * Write a 32-bit word to the specified (word-aligned) memory address.
     *
     * @param addr Memory address to write to
     * @param data Data to write (values above 2**32 will be truncated)
     */
    public async write32(addr: number, data: number) {
        const prep = this.dev.prepareCommand();
        prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        prep.writeAp(ApReg.TAR, addr);
        prep.writeAp(ApReg.DRW, data);

        await prep.go();
    }

    /**
     * Write a 16-bit word to the specified (half word-aligned) memory address.
     *
     * @param addr Memory address to write to
     * @param data Data to write (values above 2**16 will be truncated)
     */
    public async write16(addr: number, data: number) {
        data = data << ((addr & 0x02) << 3);

        const prep = this.dev.prepareCommand();
        prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        prep.writeAp(ApReg.TAR, addr);
        prep.writeAp(ApReg.DRW, data);

        await prep.go();
    }

    /**
     * Read a 32-bit word from the specified (word-aligned) memory address.
     *
     * @param addr Memory address to read from.
     */
    public async read32(addr: number): Promise<number> {
        const prep = this.dev.prepareCommand();

        prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        prep.writeAp(ApReg.TAR, addr);
        prep.readAp(ApReg.DRW);

        try {
            return (await prep.go())[0];
        } catch (e) {
            // transfer wait, try again.
            await delay(100);
            return await this.read32(addr);
        }
    }

    /**
     * Read a 16-bit word from the specified (half word-aligned) memory address.
     *
     * @param addr Memory address to read from.
     */
    public async read16(addr: number): Promise<number> {
        const prep = this.dev.prepareCommand();

        prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        prep.writeAp(ApReg.TAR, addr);
        prep.readAp(ApReg.DRW);

        let val;

        try {
            val = (await prep.go())[0];
        } catch (e) {
            // transfer wait, try again.
            await delay(100);
            val = await this.read16(addr);
        }

        val = (val >> ((addr & 0x02) << 3) & 0xffff);
        return val;
    }

    /**
     * Reads a block of memory from the specified memory address.
     *
     * @param addr Address to read from
     * @param words Number of words to read
     * @param pageSize Memory page size
     */
    public async readBlock(addr: number, words: number, pageSize: number) {
        const funs = [async () => Promise.resolve()];
        const bufs: Uint8Array[] = [];
        const end = addr + words * 4;
        let ptr = addr;

        while (ptr < end) {
            let nextptr = ptr + pageSize;
            if (ptr === addr) {
                nextptr &= ~(pageSize - 1);
            }

            const len = Math.min(nextptr - ptr, end - ptr);
            const ptr0 = ptr;
            assert((len & 3) === 0);
            funs.push(async () => {
                bufs.push(await this.readBlockCore(ptr0, len >> 2));
            });

            ptr = nextptr;
        }

        for (const f of funs) {
            await f();
        }

        const result = await bufferConcat(bufs);
        return result.subarray(0, words * 4);
    }

    /**
     * Write a block of memory to the specified memory address.
     *
     * @param addr Memory address to write to.
     * @param words Array of 32-bit words to write to memory.
     */
    public async writeBlock(addr: number, words: Uint32Array) {
        if (words.length === 0) {
            return;
        }

        return this.writeBlockCore(addr, words);
    }

    public prepareCommand() {
        return new PreparedMemoryCommand(this.dev);
    }

    private async readBlockCore(addr: number, words: number) {
        const prep = this.dev.prepareCommand();
        prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        prep.writeAp(ApReg.TAR, addr);
        await prep.go();

        let lastSize = words % 15;
        if (lastSize === 0) {
            lastSize = 15;
        }

        const blocks: Uint8Array[] = [];

        for (let i = 0; i < Math.ceil(words / 15); i++) {
            const b = await this.dev.readRegRepeat(
                apReg(ApReg.DRW, DapVal.READ),
                i === blocks.length - 1 ? lastSize : 15,
            );
            blocks.push(b);
        }

        return bufferConcat(blocks);
    }

    private async writeBlockCore(addr: number, words: Uint32Array): Promise<void> {
        try {
            const blSz = 14;
            const reg = apReg(ApReg.DRW, DapVal.WRITE);

            const prep = this.dev.prepareCommand();
            prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
            prep.writeAp(ApReg.TAR, addr);

            for (let i = 0; i < Math.ceil(words.length / blSz); i++) {
                prep.writeRegRepeat(reg, words.subarray(i * blSz, i * blSz + blSz));
            }

            await prep.go();
        } catch (e) {
            if (e.dapWait) {
                await delay(100);
                return await this.writeBlockCore(addr, words);
            } else {
                throw e;
            }
        }
    }
}
