import {DAP} from "../dap";

import {CortexReg, CortexSpecialReg} from "./cortex_constants";
import {PreparedMemoryCommand} from "./memory";

/**
 * t
 */
export class PreparedCortexMCommand {
    private cmd: PreparedMemoryCommand;

    constructor(dap: DAP) {
        this.cmd = new PreparedMemoryCommand(dap);
    }

    public writeCoreRegister(no: CortexReg, val: number) {
        this.cmd.write32(CortexSpecialReg.DCRDR, val);
        this.cmd.write32(CortexSpecialReg.DCRSR, no | CortexSpecialReg.DCRSR_REGWnR);
    }

    public halt() {
        this.cmd.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN | CortexSpecialReg.C_HALT,
        );
    }

    public resume() {
        this.cmd.write32(
            CortexSpecialReg.DFSR,
            CortexSpecialReg.DFSR_DWTTRAP | CortexSpecialReg.DFSR_BKPT | CortexSpecialReg.DFSR_HALTED,
        );
    }

    public async go() {
        // this.cmd.read32(CortexSpecialReg.DHCSR);

        const v = await this.cmd.go();
        // assert(v & CortexSpecialReg.S_REGRDY);
    }
}
