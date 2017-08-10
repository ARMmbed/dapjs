import {DAP} from "../dap";
import {Debug} from "../debug/debug";
import {assert} from "../util";
import {Memory, PreparedMemoryCommand} from "./memory";

const DEFAULT_RUNCODE_TIMEOUT = 10000 /* ms */;

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

export const enum ISA {
    ARMv6M = 0xC,
    ARMv7M = 0xF,
}

export const ISANames: Map<ISA, string> = new Map<ISA, string>();
ISANames.set(ISA.ARMv6M, "ARMv6M");
ISANames.set(ISA.ARMv7M, "ARMv7M");

export const enum CoreType {
    CortexM0 = 0xc20,
    CortexM1 = 0xc21,
    CortexM3 = 0xc23,
    CortexM4 = 0xc24,
    CortexM0p = 0xc60,
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

/**
 * Abstraction of an ARM Cortex M CPU from a programmer's perspective. Provides functionality
 * for setting breakpoints, reading general-purpose registers, reading from memory and stopping
 * and starting the CPU.
 */
export class CortexM {
    public readonly memory: Memory;
    public readonly debug: Debug;

    protected dev: DAP;

    constructor(device: DAP) {
        this.dev = device;
        this.memory = new Memory(device);
        this.debug = new Debug(this);
    }

    /**
     * Initialise the debug access port on the device, and read the device type.
     */
    public async init() {
        await this.dev.init();

        // FIXME: don't run this if security is enabled on the K64F
        await this.debug.setupFpb();
        await this.readCoreType();
    }

    /**
     * Read the current state of the CPU.
     *
     * @returns A member of the `CoreState` enum corresponding to the current status of the CPU.
     */
    public async getState() {
        const dhcsr = await this.memory.read32(CortexSpecialReg.DHCSR);

        if (dhcsr & CortexSpecialReg.S_RESET_ST) {
            const newDHCSR = await this.memory.read32(CortexSpecialReg.DHCSR);

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

    /**
     * Read the CPUID register from the CPU, and interpret its meaning in terms of implementer,
     * architecture and core type.
     */
    public async readCoreType(): Promise<[CPUIDImplementer, ISA, CoreType]> {
        const cpuid = await this.memory.read32(CortexSpecialReg.CPUID);

        const implementer = ((cpuid & CPUID_IMPLEMENTER_MASK) >> CPUID_IMPLEMENTER_POS) as CPUIDImplementer;
        const arch = ((cpuid & CPUID_ARCHITECTURE_MASK) >> CPUID_ARCHITECTURE_POS) as ISA;
        const coreType = ((cpuid & CPUID_PARTNO_MASK) >> CPUID_PARTNO_POS) as CoreType;

        console.debug(`Found an ARM ${CoreNames.get(coreType)}`);

        return [implementer, arch, coreType];
    }

    /**
     * Read a core register from the CPU (e.g. r0...r15, pc, sp, lr, s0...)
     *
     * @param no Member of the `CortexReg` enum - an ARM Cortex CPU general-purpose register.
     */
    public async readCoreRegister(no: CortexReg) {
        await this.memory.write32(CortexSpecialReg.DCRSR, no);
        const v = await this.memory.read32(CortexSpecialReg.DHCSR);
        assert(v & CortexSpecialReg.S_REGRDY);
        return await this.memory.read32(CortexSpecialReg.DCRDR);
    }

    /**
     * Write a 32-bit word to the specified CPU general-purpose register.
     *
     * @param no Member of the `CortexReg` enum - an ARM Cortex CPU general-purpose register.
     * @param val Value to be written.
     */
    public async writeCoreRegister(no: CortexReg, val: number) {
        const prep = new PreparedMemoryCommand(this.dev);

        prep.write32(CortexSpecialReg.DCRDR, val);
        prep.write32(CortexSpecialReg.DCRSR, no | CortexSpecialReg.DCRSR_REGWnR);
        prep.read32(CortexSpecialReg.DHCSR);
        const v = (await prep.go())[0];

        assert(v & CortexSpecialReg.S_REGRDY);
    }

    /**
     * Halt the CPU core.
     */
    public async halt() {
        return this.memory.write32(
            CortexSpecialReg.DHCSR,
            CortexSpecialReg.DBGKEY | CortexSpecialReg.C_DEBUGEN | CortexSpecialReg.C_HALT,
        );
    }

    /**
     * Resume the CPU core.
     */
    public async resume() {
        if (await this.isHalted()) {
            await this.memory.write32(
                CortexSpecialReg.DFSR,
                CortexSpecialReg.DFSR_DWTTRAP | CortexSpecialReg.DFSR_BKPT | CortexSpecialReg.DFSR_HALTED,
            );
            await this.debug.enable();
        }
    }

    /**
     * Find out whether the CPU is halted.
     */
    public async isHalted() {
        const s = await this.status();
        return s.isHalted;
    }

    /**
     * Read the current status of the CPU.
     *
     * @returns Object containing the contents of the `DHCSR` register, the `DFSR` register, and a boolean value
     * stating the current halted state of the CPU.
     */
    public async status() {
        const prep = new PreparedMemoryCommand(this.dev);

        prep.read32(CortexSpecialReg.DHCSR);
        prep.read32(CortexSpecialReg.DFSR);

        const results = await prep.go();

        const dhcsr = results[0];
        const dfsr = results[1];

        return {
            dfsr,
            dhscr: dhcsr,
            isHalted: !!(dhcsr & CortexSpecialReg.S_HALT),
        };
    }

    /**
     * Reset the CPU core. This currently does a software reset - it is also technically possible to perform a 'hard'
     * reset using the reset pin from the debugger.
     */
    public async reset(halt = false) {
        if (halt) {
            await this.halt();

            // VC_CORERESET causes the core to halt on reset.
            const demcr = await this.memory.read32(CortexSpecialReg.DEMCR);
            await this.memory.write32(CortexSpecialReg.DEMCR, demcr | CortexSpecialReg.DEMCR_VC_CORERESET);

            await this.softwareReset();
            await this.waitForHalt();

            // Unset the VC_CORERESET bit
            await this.memory.write32(CortexSpecialReg.DEMCR, demcr);
        } else {
            await this.softwareReset();
        }
    }

    /**
     * Run specified machine code natively on the device. Assumes usual C calling conventions
     * - returns the value of r0 once the program has terminated. The program _must_ terminate
     * in order for this function to return. This can be achieved by placing a `bkpt`
     * instruction at the end of the function.
     *
     * @param code array containing the machine code (32-bit words).
     * @param address memory address at which to place the code.
     * @param pc initial value of the program counter.
     * @param lr initial value of the link register.
     * @param sp initial value of the stack pointer.
     * @param upload should we upload the code before running it.
     * @param args set registers r0...rn before running code
     *
     * @returns A promise for the value of r0 on completion of the function call.
     */
    public async runCode(
        code: Uint32Array,
        address: number,
        pc: number,
        lr: number,
        sp: number,
        upload: boolean,
        ...args: number[]) {
        const cmd = new PreparedCortexMCommand(this.dev);

        cmd.halt();

        // Point the program counter to the start of the program
        cmd.writeCoreRegister(CortexReg.PC, pc);
        cmd.writeCoreRegister(CortexReg.LR, lr);
        cmd.writeCoreRegister(CortexReg.SP, sp);

        for (let i = 0; i < args.length; i++) {
            cmd.writeCoreRegister(i, args[i]);
        }

        if (!upload) {
            // batch the resume command if we're not uploading the program.
            cmd.resume();
        }

        await cmd.go();

        // Write the program to memory at the specified address
        if (upload) {
            await this.memory.writeBlock(address, code);
            // Run the program and wait for halt
            await this.resume();
        }

        await this.waitForHalt(DEFAULT_RUNCODE_TIMEOUT); // timeout after 10s

        return await this.readCoreRegister(CortexReg.R0);
    }

    /**
     * Spin until the chip has halted.
     */
    public async waitForHalt(timeout = 0) {
        return new Promise<void>(async (resolve, reject) => {
            let running = true;

            if (timeout > 0) {
                setTimeout(() => {
                    reject("waitForHalt timed out.");
                    running = false;
                }, timeout);
            }

            while (running && !(await this.isHalted())) {
                /* empty */
            }

            if (running) {
                resolve();
            }
        });
    }

    private async softwareReset() {
        await this.memory.write32(
            CortexSpecialReg.NVIC_AIRCR,
            CortexSpecialReg.NVIC_AIRCR_VECTKEY | CortexSpecialReg.NVIC_AIRCR_SYSRESETREQ,
        );

        // wait for the system to come out of reset
        let dhcsr = await this.memory.read32(CortexSpecialReg.DHCSR);

        while ((dhcsr & CortexSpecialReg.S_RESET_ST) !== 0) {
            dhcsr = await this.memory.read32(CortexSpecialReg.DHCSR);
        }
    }
}
