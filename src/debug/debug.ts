import {CortexM, CortexSpecialReg} from "../core/cortex";
import {DisabledBreakpoint, HWBreakpoint, IBreakpoint, SWBreakpoint} from "./breakpoint";

export class Debug {
    private core: CortexM;

    // if the breakpoint is disabled, call it a number
    private breakpoints: Map<number, IBreakpoint | DisabledBreakpoint>;
    private availableHWBreakpoints: number[];
    private totalHWBreakpoints: number;

    private enabled: boolean;

    constructor(core: CortexM) {
        this.core = core;
        this.enabled = false;
        this.availableHWBreakpoints = [];
        this.breakpoints = new Map<number, IBreakpoint | DisabledBreakpoint>();
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

        await this.setFpbEnabled(false);

        for (let i = 0; i < nbCode; i++) {
            this.availableHWBreakpoints.push(CortexSpecialReg.FP_COMP0 + (4 * i));
            await this.core.memory.write32(CortexSpecialReg.FP_COMP0 + (i * 4), 0);
        }
    }

    /**
     * Enable or disable the Flash Patch and Breakpoint unit (FPB).
     *
     * @param enabled
     */
    public async setFpbEnabled(enabled = true) {
        this.enabled = enabled;
        await this.core.memory.write32(CortexSpecialReg.FP_CTRL, CortexSpecialReg.FP_CTRL_KEY | (enabled ? 1 : 0));
    }

    /**
     * Enable debugging on the target CPU
     */
    public async enable() {
        await this.core.memory.write32(CortexSpecialReg.DHCSR, CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN);
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

            if (this.availableHWBreakpoints.length > 0) {
                if (!this.enabled) {
                    console.log("enabling fpb");
                    await this.setFpbEnabled(true);
                }

                const regAddr = this.availableHWBreakpoints.pop();
                console.log(`using regAddr=${regAddr.toString(16)}`);
                bkpt = new HWBreakpoint(regAddr, this.core, addr);
            } else {
                bkpt = new SWBreakpoint(this.core, addr);
            }
        } else {
            bkpt = new SWBreakpoint(this.core, addr);
        }

        await bkpt.set();
        this.breakpoints.set(addr, bkpt);
    }

    public async deleteBreakpoint(addr: number) {
        if (this.breakpoints.has(addr)) {
            const bkpt = this.breakpoints.get(addr);
            if (typeof bkpt !== "number") {
                await bkpt.clear();

                if (bkpt instanceof HWBreakpoint) {
                    // return the register address to the pool
                    this.availableHWBreakpoints.push(bkpt.regAddr);
                }
            }

            this.breakpoints.delete(addr);
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

        await this.core.memory.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY |
            CortexSpecialReg.C_DEBUGEN |
            CortexSpecialReg.C_HALT,
        );
    }
}
