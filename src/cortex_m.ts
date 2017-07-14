import {ApReg, Csw, Dap, DapCmd, DapVal, Reg} from "./dap";
import {Breakpoint} from "./debug";
import {Device} from "./device";
import {apReg, assert, bufferConcat, delay} from "./util";

export const enum CortexSpecialReg {
    // Debug Fault Status Register
    DFSR = 0xE000ED30,
    DFSR_EXTERNAL = (1 << 4),
    DFSR_VCATCH = (1 << 3),
    DFSR_DWTTRAP = (1 << 2),
    DFSR_BKPT = (1 << 1),
    DFSR_HALTED = (1 << 0),

    // Debug Exception and Monitor Control Register
    DEMCR = 0xE000EDFC,
    // DWTENA in armv6 architecture reference manual
    DEMCR_TRCENA = (1 << 24),
    DEMCR_VC_HARDERR = (1 << 10),
    DEMCR_VC_BUSERR = (1 << 8),
    DEMCR_VC_CORERESET = (1 << 0),

    // CPUID Register
    CPUID = 0xE000ED00,

    // Debug Core Register Selector Register
    DCRSR = 0xE000EDF4,
    DCRSR_REGWnR = (1 << 16),
    DCRSR_REGSEL = 0x1F,

    // Debug Halting Control and Status Register
    DHCSR = 0xE000EDF0,
    C_DEBUGEN = (1 << 0),
    C_HALT = (1 << 1),
    C_STEP = (1 << 2),
    C_MASKINTS = (1 << 3),
    C_SNAPSTALL = (1 << 5),
    S_REGRDY = (1 << 16),
    S_HALT = (1 << 17),
    S_SLEEP = (1 << 18),
    S_LOCKUP = (1 << 19),
    S_RETIRE_ST = (1 << 24),
    S_RESET_ST = (1 << 25),

    // Debug Core Register Data Register
    DCRDR = 0xE000EDF8,

    // Coprocessor Access Control Register
    CPACR = 0xE000ED88,
    CPACR_CP10_CP11_MASK = (3 << 20) | (3 << 22),

    NVIC_AIRCR = (0xE000ED0C),
    NVIC_AIRCR_VECTKEY = (0x5FA << 16),
    NVIC_AIRCR_VECTRESET = (1 << 0),
    NVIC_AIRCR_SYSRESETREQ = (1 << 2),

    CSYSPWRUPACK = 0x80000000,
    CDBGPWRUPACK = 0x20000000,
    CSYSPWRUPREQ = 0x40000000,
    CDBGPWRUPREQ = 0x10000000,

    TRNNORMAL = 0x00000000,
    MASKLANE = 0x00000f00,

    DBGKEY = (0xA05F << 16),

    // FPB (breakpoint)
    FP_CTRL = (0xE0002000),
    FP_CTRL_KEY = (1 << 1),
    FP_COMP0 = (0xE0002008),

    // DWT (data watchpoint & trace)
    DWT_CTRL = 0xE0001000,
    DWT_COMP_BASE = 0xE0001020,
    DWT_MASK_OFFSET = 4,
    DWT_FUNCTION_OFFSET = 8,
    DWT_COMP_BLOCK_SIZE = 0x10,
}

export const CPUID_IMPLEMENTER_MASK = 0xff000000;
export const CPUID_IMPLEMENTER_POS = 24;
export const CPUID_VARIANT_MASK = 0x00f00000;
export const CPUID_VARIANT_POS = 20;
export const CPUID_ARCHITECTURE_MASK = 0x000f0000;
export const CPUID_ARCHITECTURE_POS = 16;
export const CPUID_PARTNO_MASK = 0x0000fff0;
export const CPUID_PARTNO_POS = 4;
export const CPUID_REVISION_MASK = 0x0000000f;
export const CPUID_REVISION_POS = 0;

export const enum CPUIDImplementer {
    CPUID_IMPLEMENTER_ARM = 0x41,
}

export const enum CPUIDISA {
    ARMv6M = 0xC,
    ARMv7M = 0xF,
}

export const enum CoreType {
    CortexM0 = 0xc20,
    CortexM1 = 0xc21,
    CortexM3 = 0xc23,
    CortexM4 = 0xc24,
    CortexM0p = 0xc60,
}

export interface IMachineState {
    registers: number[];
    stack: number[];
}

export const CoreNames: Map<CoreType, string> = new Map<CoreType, string>();
CoreNames.set(CoreType.CortexM0, "Cortex-M0");
CoreNames.set(CoreType.CortexM1, "Cortex-M1");
CoreNames.set(CoreType.CortexM3, "Cortex-M3");
CoreNames.set(CoreType.CortexM4, "Cortex-M4");
CoreNames.set(CoreType.CortexM0p, "Cortex-M0+");

export const enum CortexReg {
    R0 = 0,
    R1 = 1,
    R2 = 2,
    R3 = 3,
    R4 = 4,
    R5 = 5,
    R6 = 6,
    R7 = 7,
    R8 = 8,
    R9 = 9,
    R10 = 10,
    R11 = 11,
    R12 = 12,
    SP = 13,
    LR = 14,
    PC = 15,
    XPSR = 16,
    MSP = 17, // Main Stack Pointer
    PSP = 18, // Process Stack Pointer
    PRIMASK = 20,  // &0xff
    CONTROL = 20,  // &0xff000000 >> 24
}

export const enum CoreState {
    TARGET_RESET,
    TARGET_LOCKUP,
    TARGET_SLEEPING,
    TARGET_HALTED,
    TARGET_RUNNING,
}

export class CortexM {
    protected dev: Device;
    private breakpoints: Breakpoint[];

    constructor(device: Device) {
        this.dev = device;
    }

    public async init() {
        await this.dev.init();

        await this.setupFpb();
        await this.readCoreType();
        console.log("Initialized.");
    }

    public async getState() {
        const dhcsr = await this.readMem(CortexSpecialReg.DHCSR);

        if (dhcsr & CortexSpecialReg.S_RESET_ST) {
            const newDHCSR = await this.readMem(CortexSpecialReg.DHCSR);

            if (newDHCSR & CortexSpecialReg.S_RESET_ST && !(newDHCSR & CortexSpecialReg.S_RETIRE_ST)) {
                return CoreState.TARGET_RESET;
            }
        }

        if (dhcsr & CortexSpecialReg.S_LOCKUP) {
            return CoreState.TARGET_LOCKUP;
        } else if (dhcsr & CortexSpecialReg.S_SLEEP) {
            return CoreState.TARGET_SLEEPING;
        } else if (dhcsr & CortexSpecialReg.S_HALT) {
            return CoreState.TARGET_HALTED;
        } else {
            return CoreState.TARGET_RUNNING;
        }
    }

    public async readCoreType() {
        const cpuid = await this.readMem(CortexSpecialReg.CPUID);

        const implementer = ((cpuid & CPUID_IMPLEMENTER_MASK) >> CPUID_IMPLEMENTER_POS) as CPUIDImplementer;
        const arch = ((cpuid & CPUID_ARCHITECTURE_MASK) >> CPUID_ARCHITECTURE_POS) as CPUIDISA;
        const coreType = ((cpuid & CPUID_PARTNO_MASK) >> CPUID_PARTNO_POS) as CoreType;

        console.log(`Found an ARM ${CoreNames.get(coreType)}`);
    }

    public async setupFpb() {
        // Reads the number of hardware breakpoints available on the core
        // and disable the FPB (Flash Patch and Breakpoint Unit)
        // which will be enabled when a first breakpoint will be set

        // setup FPB (breakpoint)
        const fpcr = await this.readMem(CortexSpecialReg.FP_CTRL);
        const nbCode = ((fpcr >> 8) & 0x70) | ((fpcr >> 4) & 0xf);
        const nbLit = (fpcr >> 7) & 0xf;

        console.log(`${nbCode} hardware breakpoints, ${nbLit} literal comparators`);

        this.breakpoints = [];

        for (let i = 0; i < nbCode; i++) {
            const b = new Breakpoint(this, i);
            b.write(0);

            await this.breakpoints.push(b);
        }

        await this.setFpbEnabled(false);
    }

    public async setBreakpoints(addrs: number[]) {
        const mapAddr = (addr: number) => {
            if (addr === null) {
                return 0;
            } else if ((addr & 3) === 2) {
                return 0x80000001 | (addr & ~3);
            } else if ((addr & 3) === 0) {
                return 0x40000001 | (addr & ~3);
            } else {
                console.error("uneven address");
            }
        };

        if (addrs.length > this.breakpoints.length) {
            console.error("not enough hw breakpoints");
        }

        await this.debugEnable();
        await this.setFpbEnabled(true);

        while (addrs.length < this.breakpoints.length) {
            addrs.push(null);
        }

        for (let i = 0; i < addrs.length; i++) {
            await this.breakpoints[i].write(mapAddr(addrs[i]));
        }
    }

    public async setFpbEnabled(enabled = true) {
        return this.writeMem(CortexSpecialReg.FP_CTRL, CortexSpecialReg.FP_CTRL_KEY | (enabled ? 1 : 0));
    }

    public async writeMem(addr: number, data: number) {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);
        await this.dev.writeAp(ApReg.DRW, data);
    }

    public async readMem(addr: number): Promise<number> {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);

        try {
            return await this.dev.readAp(ApReg.DRW);
        } catch (e) {
            // transfer wait, try again.
            await delay(100);
            return await this.readMem(addr);
        }
    }

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

        return await bufferConcat(bufs);
    }

    public async writeBlock(addr: number, words: number[]) {
        if (words.length === 0) {
            return;
        }

        console.log(`write block: 0x${addr.toString(16)} ${words.length} len`);

        // TODO: do we need this, or the second part?
        if (1 > 0) {
            await this.writeBlockCore(addr, words);
            console.log("written");
            return;
        }

        const blSz = 10;

        for (let i = 0; i < Math.ceil(words.length / blSz); i++) {
            await this.writeBlockCore(addr + i * blSz * 4, words.slice(i * blSz, i * blSz + blSz));
        }

        console.log("written");
    }

    public async readCoreRegister(no: CortexReg) {
        await this.writeMem(CortexSpecialReg.DCRSR, no);
        const v = await this.readMem(CortexSpecialReg.DHCSR);
        assert(v & CortexSpecialReg.S_REGRDY);
        return await this.readMem(CortexSpecialReg.DCRDR);
    }

    public async writeCoreRegister(no: CortexReg, val: number) {
        await this.writeMem(CortexSpecialReg.DCRDR, val);
        await this.writeMem(CortexSpecialReg.DCRSR, no | CortexSpecialReg.DCRSR_REGWnR);
        const v = await this.readMem(CortexSpecialReg.DHCSR);

        assert(v & CortexSpecialReg.S_REGRDY);
    }

    public async halt() {
        return this.writeMem(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN | CortexSpecialReg.C_HALT,
        );
    }

    public async resume() {
        if (await this.isHalted()) {
            await this.writeMem(
                CortexSpecialReg.DFSR,
                CortexSpecialReg.DFSR_DWTTRAP | CortexSpecialReg.DFSR_BKPT | CortexSpecialReg.DFSR_HALTED,
            );
            this.debugEnable();
        }
    }

    public async isHalted() {
        const s = await this.status();
        return s.isHalted;
    }

    public async status() {
        const dhcsr = await this.readMem(CortexSpecialReg.DHCSR);
        const dfsr = await this.readMem(CortexSpecialReg.DFSR);

        return {
            dfsr,
            dhscr: dhcsr,
            isHalted: !!(dhcsr & CortexSpecialReg.S_HALT),
        };
    }

    public async debugEnable() {
        return this.writeMem(CortexSpecialReg.DHCSR, CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN);
    }

    public async reset() {
        await this.writeMem(
            CortexSpecialReg.NVIC_AIRCR,
            CortexSpecialReg.NVIC_AIRCR_VECTKEY | CortexSpecialReg.NVIC_AIRCR_SYSRESETREQ,
        );

        // wait for the system to come out of reset
        let dhcsr = await this.readMem(CortexSpecialReg.DHCSR);

        while ((dhcsr & CortexSpecialReg.S_RESET_ST) !== 0) {
            dhcsr = await this.readMem(CortexSpecialReg.DHCSR);
        }
    }

    public async snapshotMachineState() {
        const state: IMachineState = {
            registers: [],
            stack: [],
        };

        for (let i = 0; i < 16; i++) {
            state.registers[i] = await this.readCoreRegister(i);
        }

        return state;
    }

    private async readBlockCore(addr: number, words: number) {
        await this.dev.writeAp(ApReg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32);
        await this.dev.writeAp(ApReg.TAR, addr);

        let lastSize = words % 15;
        if (lastSize === 0) {
            lastSize = 15;
        }

        const bufs: Uint8Array[] = [];
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

    private async writeBlockCore(addr: number, words: number[]): Promise<void> {
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
                console.log(`transfer wait, write block`);
                await delay(100);
                return await this.writeBlockCore(addr, words);
            } else {
                throw e;
            }
        }
    }
}
