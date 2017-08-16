import {CortexM} from "../core/cortex";

export interface IBreakpoint {
    set(): Promise<void>;
    clear(): Promise<void>;
}

export type DisabledBreakpoint = number;

export class HWBreakpoint implements IBreakpoint {
    constructor(public readonly regAddr: number, private readonly parent: CortexM, public readonly addr: number) { }

    public async set() {
        /* set hardware breakpoint */
        const bpMatch = ((this.addr & 0x2) ? 2 : 1) << 30;
        await this.parent.memory.write32(this.regAddr, this.addr & 0x1ffffffc | bpMatch | 1);
    }

    public async clear() {
        /* clear hardware breakpoint */
        await this.parent.memory.write32(this.regAddr, 0);
    }
}

export class SWBreakpoint implements IBreakpoint {
    private static BKPT_INSTRUCTION: number = 0xbe00;

    private instruction: number;

    constructor(private readonly parent: CortexM, public readonly addr: number) {  }

    public async set() {
        // read the instruction from the CPU... pleeeeease be in thumb mode
        this.instruction = await this.parent.memory.read16(this.addr);
        await this.parent.memory.write16(this.addr, SWBreakpoint.BKPT_INSTRUCTION);
    }

    public async clear() {
        /* clear hardware breakpoint */
        await this.parent.memory.write16(this.addr, this.instruction);
    }
}
