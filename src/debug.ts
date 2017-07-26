import {DisabledBreakpoint, HWBreakpoint, IBreakpoint, SWBreakpoint} from "./breakpoint";
import {CortexM, CortexSpecialReg} from "./cortex_m";

export class Debug {
    private core: CortexM;

    // if the breakpoint is disabled, call it a number
    private breakpoints: Map<number, IBreakpoint | DisabledBreakpoint>;
    private availableHWBreakpoints: Set<number>;
    private totalHWBreakpoints: number;

    private enabled: boolean;

    constructor(core: CortexM) {
        this.core = core;
        this.enabled = false;
        this.availableHWBreakpoints = new Set<number>();
    }

    /**
     * Set up (and disable) the Flash Patch & Breakpoint unit. It will be enabled when
     * the first breakpoint is set.
     *
     * Also reads the number of available hardware breakpoints.
     */
    public async setupFpb() {
        // setup FPB (breakpoint)
        const fpcr = await this.core.memory.read32(CortexSpecialReg.FP_CTRL);
        const nbCode = ((fpcr >> 8) & 0x70) | ((fpcr >> 4) & 0xf);
        const nbLit = (fpcr >> 7) & 0xf;

        this.totalHWBreakpoints = nbCode;
        console.debug(`${nbCode} hardware breakpoints, ${nbLit} literal comparators`);

        for (let i = 0; i < nbCode; i++) {
            this.availableHWBreakpoints.add(CortexSpecialReg.FP_COMP0 + (4 * i));
        }

        await this.setFpbEnabled(false);
    }

    /**
     * Enable or disable the Flash Patch and Breakpoint unit (FPB).
     *
     * @param enabled
     */
    public async setFpbEnabled(enabled = true) {
        this.enabled = enabled;
        return this.core.memory.write32(CortexSpecialReg.FP_CTRL, CortexSpecialReg.FP_CTRL_KEY | (enabled ? 1 : 0));
    }

    /**
     * Set breakpoints at specified memory addresses.
     *
     * @param addrs An array of memory addresses at which to set breakpoints.
     */
    public async setBreakpoint(addr: number) {
        if (this.breakpoints.has(addr)) {
            // we already have a breakpoint there.
            const breakpoint = this.breakpoints.get(addr);
            if (typeof breakpoint !== "number") {
                // already enabled
                console.warn(`Breakpoint at ${addr.toString(16)} already enabled.`);
                return;
            }
        }

        let bkpt: IBreakpoint;

        // choose where best to place a breakpoint
        if (addr < 0x20000000) {
            // we can use a HWBreakpoint

            if (this.availableHWBreakpoints.size > 0) {
                if (!this.enabled) {
                    this.setFpbEnabled(true);
                }

                const regAddr = this.availableHWBreakpoints.values().next().value;
                this.availableHWBreakpoints.delete(regAddr);
                bkpt = new HWBreakpoint(regAddr, this.core, addr);
            } else {
                bkpt = new SWBreakpoint(this.core, addr);
            }
        }

        await bkpt.set();
        this.breakpoints.set(addr, bkpt);
    }

    public async deleteBreakpoint(addr: number) {
        if (this.breakpoints.has(addr)) {
            const bkpt = this.breakpoints.get(addr);
            if (typeof bkpt !== "number") {
                bkpt.clear();

                if (bkpt instanceof HWBreakpoint) {
                    // return the register address to the pool
                    this.availableHWBreakpoints.add(bkpt.regAddr);
                }
            }

            this.breakpoints.delete(addr);
        } else {
            console.warn(`Breakpoint at ${addr.toString(16)} does not exist.`);
        }
    }

    public async disableBreakpoint(addr: number) {
        if (this.breakpoints.has(addr)) {
            const bkpt = this.breakpoints.get(addr);

            if (typeof bkpt !== "number") {
                this.breakpoints.set(addr, addr);
            } else {
                console.warn(`Breakpoint at ${addr.toString(16)} already set.`);
            }
        } else {
            console.warn(`Breakpoint at ${addr.toString(16)} does not exist.`);
        }
    }

    /**
     * Step the processor forward by one instruction.
     */
    public async step() {
        const dhcsr = await this.core.memory.read32(CortexSpecialReg.DHCSR);

        if (!(dhcsr & (CortexSpecialReg.C_STEP | CortexSpecialReg.C_HALT))) {
            console.error("Target is not halted.");
            return;
        }

        const interruptsMasked = (CortexSpecialReg.C_MASKINTS & dhcsr) !== 0;

        if (!interruptsMasked) {
            await this.core.memory.write32(
                CortexSpecialReg.DHCSR,
                CortexSpecialReg.DBGKEY |
                CortexSpecialReg.C_DEBUGEN |
                CortexSpecialReg.C_HALT |
                CortexSpecialReg.C_MASKINTS,
            );
        }

        await this.core.memory.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY |
            CortexSpecialReg.C_DEBUGEN |
            CortexSpecialReg.C_MASKINTS |
            CortexSpecialReg.C_STEP,
        );

        await this.core.waitForHalt();

        this.core.memory.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY |
            CortexSpecialReg.C_DEBUGEN |
            CortexSpecialReg.C_HALT,
        );
    }
}
