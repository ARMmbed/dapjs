import {ApReg, Csw, DAP,  DapVal, PreparedDapCommand} from "../dap";
import {apReg, assert, bufferConcat, delay} from "../util";

export class PreparedMemoryCommand {
    private cmd: PreparedDapCommand;

    constructor(dap: DAP) {
        this.cmd = new PreparedDapCommand(dap);
    }

    public write32(addr: number, data: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.writeAp(ApReg.DRW, data);
    }

    public write16(addr: number, data: number) {
        data = data << ((addr & 0x02) << 3);

        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.writeAp(ApReg.DRW, data);
    }

    public read32(addr: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.readAp(ApReg.DRW);
    }

    public read16(addr: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.readAp(ApReg.DRW);
    }

    public async go() {
        return this.cmd.go();
    }
}

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
        const prep = new PreparedDapCommand(this.dev);
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

        const prep = new PreparedDapCommand(this.dev);
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
        const prep = new PreparedDapCommand(this.dev);

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
        const prep = new PreparedDapCommand(this.dev);

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

        return this.writeBlockCore(addr, words);
    }

    private async readBlockCore(addr: number, words: number) {
        const prep = new PreparedDapCommand(this.dev);
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

            const prep = new PreparedDapCommand(this.dev);
            prep.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
            prep.writeAp(ApReg.TAR, addr);

            for (let i = 0; i < Math.ceil(words.length / blSz); i++) {
                prep.writeRegRepeat(reg, words.slice(i * blSz, i * blSz + blSz));
            }

            await prep.go();
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
