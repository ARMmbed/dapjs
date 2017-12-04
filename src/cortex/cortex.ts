import {DAP} from "../dap/dap";

import {Debug} from "../debug/debug";
import {Memory} from "../memory/memory";
import {PreparedMemoryCommand} from "../memory/prepared";
import {assert} from "../util";

import {
    CoreNames,
    CoreState,
    CoreType,
    CortexReg,
    CortexSpecialReg,
    CPUID_ARCHITECTURE_MASK,
    CPUID_ARCHITECTURE_POS,
    CPUID_IMPLEMENTER_MASK,
    CPUID_IMPLEMENTER_POS,
    CPUID_PARTNO_MASK,
    CPUID_PARTNO_POS,
    CPUIDImplementer,
    DEFAULT_RUNCODE_TIMEOUT,
    ISA,
} from "./constants";
import {PreparedCortexMCommand} from "./prepared";

/**
 * # Cortex M
 *
 * Manages access to a CPU core, and its associated memory and debug functionality.
 *
 * > **NOTE:** all of the methods that involve interaction with the CPU core
 * > are asynchronous, so must be `await`ed, or explicitly handled as a Promise.
 *
 * ## Usage
 *
 * First, let's create an instance of `CortexM`, using an associated _Debug Access
 * Port_ (DAP) instance that we created earlier.
 *
 * ```typescript
 * const core = new CortexM(dap);
 * ```
 *
 * Now, we can halt and resume the core just like this:
 *
 * > **NOTE:** If you're not using ES2017, you can replace the use of `async` and
 * > `await` with direct use of Promises. These examples also need to be run within
 * > an `async` function for `async` to be used.
 *
 * ```typescript
 * await core.halt();
 * await core.resume();
 * ```
 *
 * Resetting the core is just as easy:
 *
 * ```typescript
 * await core.reset();
 * ```
 *
 * You can even halt immediately after reset:
 *
 * ```typescript
 * await core.reset(true);
 * ```
 *
 * We can also read and write 32-bit values to/from core registers:
 *
 * ```typescript
 * const sp = await core.readCoreRegister(CortexReg.SP);
 *
 * await core.writeCoreRegister(CortexReg.R0, 0x1000);
 * await core.writeCoreRegister(CortexReg.PC, 0x1234);
 * ```
 *
 * ### See also
 *
 * For details on debugging and memory features, see the documentation for
 * `Debug` and `Memory`.
 */
export class CortexM {
    /**
     * Read and write to on-chip memory associated with this CPU core.
     */
    public readonly memory: Memory;

    /**
     * Control the CPU's debugging features.
     */
    public readonly debug: Debug;

    /**
     * Underlying Debug Access Port (DAP).
     */
    private dev: DAP;

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
        await this.debug.init();
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
        return [implementer, arch, coreType];
    }

    public prepareCommand(): PreparedCortexMCommand {
        return new PreparedCortexMCommand(this.dev);
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

        // await this.halt();

        const cmd = this.prepareCommand();

        cmd.halt();

        // Point the program counter to the start of the program
        cmd.writeCoreRegister(CortexReg.PC, pc);
        cmd.writeCoreRegister(CortexReg.LR, lr);
        cmd.writeCoreRegister(CortexReg.SP, sp);

        for (let i = 0; i < args.length; i++) {
            cmd.writeCoreRegister(i, args[i]);
        }

        await cmd.go();

        // Write the program to memory at the specified address
        if (upload) {
            await this.memory.writeBlock(address, code);
        }

        // Run the program and wait for halt
        await this.resume();
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
