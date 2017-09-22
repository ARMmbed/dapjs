import {DAP} from "../dap/dap";

import {ApReg, Csw} from "../dap/constants";
import {PreparedDapCommand} from "../dap/prepared";

/**
 * # Prepared Memory Command
 *
 * Allows multiple memory operations to be batched together to improve HID
 * interface utilisation.
 *
 * ## Usage
 *
 * Similarly to `CortexMPreparedCommand` and `DapPreparedCommand`, a convenience
 * function exists to quickly create a prepared memory command:
 *
 * ```typescript
 * const prep = core.memory.prepareCommand();
 * ```
 *
 * You can then construct the sequence of commands using the same API as `Memory`.
 *
 * ```typescript
 * prep.write32(0x20000, 1234);
 * prep.write32(0x12344, 5678);
 * prep.write16(0x12346, 123);
 * ```
 *
 * And then dispatch the prepared commands asynchronously:
 *
 * ```typescript
 * await prep.go();
 * ```
 */
export class PreparedMemoryCommand {
    private cmd: PreparedDapCommand;

    constructor(dap: DAP) {
        this.cmd = dap.prepareCommand();
    }

    /**
     * Schedule a 32-bit memory write operation.
     *
     * @param addr Word-aligned memory address to write to.
     * @param data Number to be written.
     */
    public write32(addr: number, data: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.writeAp(ApReg.DRW, data);
    }

    /**
     * Schedule a 16-bit memory write operation.
     *
     * @param addr Half word-aligned memory address to write to.
     * @param data Number to be written.
     */
    public write16(addr: number, data: number) {
        data = data << ((addr & 0x02) << 3);

        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.writeAp(ApReg.DRW, data);
    }

    /**
     * Schedule a 32-bit memory read operation.
     *
     * @param addr Word-aligned memory address to read from.
     */
    public read32(addr: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.readAp(ApReg.DRW);
    }

    /**
     * Schedule a 16-bit memory read operation.
     *
     * FIXME: the values need to be shifted after being read.
     *
     * @param addr Half word-aligned memory address to read from.
     */
    public read16(addr: number) {
        this.cmd.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE16);
        this.cmd.writeAp(ApReg.TAR, addr);
        this.cmd.readAp(ApReg.DRW);
    }

    /**
     * Execute all commands asynchronously.
     */
    public async go() {
        return this.cmd.go();
    }
}
