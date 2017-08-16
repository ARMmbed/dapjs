import DAP from "../dap/dap";
import {PreparedMemoryCommand} from "../memory/prepared";

import {CortexReg, CortexSpecialReg} from "./constants";

/**
 * # Cortex M: Prepared Command
 *
 * Allows batching of Cortex M-related commands, such as writing to a register,
 * halting and resuming the core.
 *
 * ## Example
 *
 * When preparing the sequence of commands, we can use the same API to prepare
 * a command as we would to execute them immediately.
 *
 * ```typescript
 * // Note that only the .go method is asynchronous.
 *
 * const prep = core.prepareCommand();
 * prep.writeCoreRegister(CortexReg.R0, 0x1000);
 * prep.writeCoreRegister(CortexReg.R1, 0x0);
 * prep.writeCoreRegister(CortexReg.PC, 0x2000000);
 * prep.resume();
 * ```
 *
 * We can then execute them as efficiently as possible by combining them together
 * and executing them like so.
 *
 * ```typescript
 * await prep.go();
 * ```
 *
 * The code above is equivalent to the following _non-prepared_ command:
 *
 * ```typescript
 * await core.writeCoreRegister(CortexReg.R0, 0x1000);
 * await core.writeCoreRegister(CortexReg.R1, 0x0);
 * await core.writeCoreRegister(CortexReg.PC, 0x2000000);
 * await core.resume();
 * ```
 *
 * Since the batched version of this code avoids making three round-trips to the
 * target, we are able to significantly improve performance. This is especially
 * noticable when uploading a binary to flash memory, where are large number of
 * repetetive commands are being used.
 *
 * ## Explanation
 *
 * For a detailed explanation of why prepared commands are used in DAP.js, see the
 * documentation for `PreparedDapCommand`.
 */
export class PreparedCortexMCommand {
    private cmd: PreparedMemoryCommand;

    constructor(dap: DAP) {
        this.cmd = new PreparedMemoryCommand(dap);
    }

    /**
     * Schedule a 32-bit integer to be written to a core register.
     *
     * @param no Core register to be written.
     * @param val Value to write.
     */
    public writeCoreRegister(no: CortexReg, val: number) {
        this.cmd.write32(CortexSpecialReg.DCRDR, val);
        this.cmd.write32(CortexSpecialReg.DCRSR, no | CortexSpecialReg.DCRSR_REGWnR);
    }

    /**
     * Schedule a halt command to be written to the CPU.
     */
    public halt() {
        this.cmd.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN | CortexSpecialReg.C_HALT,
        );
    }

    /**
     * Schedule a resume command to be written to the CPU.
     */
    public resume() {
        this.cmd.write32(
            CortexSpecialReg.DFSR,
            CortexSpecialReg.DFSR_DWTTRAP | CortexSpecialReg.DFSR_BKPT | CortexSpecialReg.DFSR_HALTED,
        );
    }

    /**
     * Execute all scheduled commands.
     */
    public async go() {
        const v = await this.cmd.go();
    }
}
