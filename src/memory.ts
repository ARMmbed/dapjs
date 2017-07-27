import {ApReg, Csw, DapVal} from "./dap";
import {Device} from "./device";
import {apReg, assert, bufferConcat, delay} from "./util";

export class Memory {
    private dev: Device;

    constructor(dev: Device) {
        this.dev = dev;
    }

    /**
     * Write a 32-bit word to the specified (word-aligned) memory address.
     *
     * @param addr Memory address to write to
     * @param data Data to write (values above 2**32 will be truncated)
     */
    public async write32(addr: number, data: number) {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);
        await this.dev.writeAp(ApReg.DRW, data);
    }

    /**
     * Write a 16-bit word to the specified (half word-aligned) memory address.
     *
     * @param addr Memory address to write to
     * @param data Data to write (values above 2**16 will be truncated)
     */
    public async write16(addr: number, data: number) {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        data = data << ((addr & 0x02) << 3);
        await this.dev.writeAp(ApReg.TAR, addr);
        await this.dev.writeAp(ApReg.DRW, data);
    }

    /**
     * Read a 32-bit word from the specified (word-aligned) memory address.
     *
     * @param addr Memory address to read from.
     */
    public async read32(addr: number): Promise<number> {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);

        try {
            return await this.dev.readAp(ApReg.DRW);
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
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        await this.dev.writeAp(ApReg.TAR, addr);

        let val;

        try {
            val = await this.dev.readAp(ApReg.DRW);
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
        return result.slice(0, words * 4);
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

        console.debug(`write block: 0x${addr.toString(16)} ${words.length} len`);

        // TODO: do we need this, or the second part?
        if (1 > 0) {
            await this.writeBlockCore(addr, words);
            console.debug("written");
            return;
        }

        const blSz = 10;

        for (let i = 0; i < Math.ceil(words.length / blSz); i++) {
            await this.writeBlockCore(addr + i * blSz * 4, words.slice(i * blSz, i * blSz + blSz));
        }

        console.debug("written");
    }

    private async readBlockCore(addr: number, words: number) {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);

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
            await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
            await this.dev.writeAp(ApReg.TAR, addr);
            const blSz = 12; // with 15 we get strange errors

            const reg = apReg(ApReg.DRW, DapVal.WRITE);

            for (let i = 0; i < Math.ceil(words.length / blSz); i++) {
                await this.dev.writeRegRepeat(reg, words.slice(i * blSz, i * blSz + blSz));
            }
        } catch (e) {
            if (e.dapWait) {
                console.debug(`transfer wait, write block`);
                await delay(100);
                return await this.writeBlockCore(addr, words);
            } else {
                throw e;
            }
        }
    }
}
