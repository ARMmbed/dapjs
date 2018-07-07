/*
* DAPjs
* Copyright Arm Limited 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import { ADI } from "../dap";
import {
    DebugRegister,
    CoreRegister,
    DhcsrMask,
    DfsrMask,
    DcrsrMask,
    FPBRegister,
    FPBCtrlMask,
    CoreState
} from "./enums";
import { Processor } from "./";

/**
 * Cortex M class
 */
export class CortexM extends ADI implements Processor {

    private delay(timeout: number): Promise<void> {
        return new Promise((resolve, _reject) => {
            setTimeout(resolve, timeout);
        });
    }

    /**
     * Continually run a function until it returns true
     * @param fn The function to run
     * @param timer The millisecoinds to wait between each run
     * @param timeout Optional timeout to wait before giving up and rejecting
     * @returns Promise
     */
    private waitDelay(fn: () => Promise<boolean>, timer: number, timeout: number = 0): Promise<void> {
        let running: boolean = true;

        const chain = (condition: boolean): Promise<void> => {
            if (running) {
                return condition
                    ? Promise.resolve()
                    : this.delay(timer)
                    .then(fn)
                    .then(chain);
            }
        };

        return new Promise((resolve, reject) => {
            if (timeout > 0) {
                setTimeout(() => {
                    running = false;
                    reject("Wait timed out");
                }, timeout);
            }

            return chain(false)
            .then(() => resolve());
        });
    }

    private enableDebug() {
        return this.writeMem32(DebugRegister.DHCSR, DhcsrMask.DBGKEY | DhcsrMask.C_DEBUGEN);
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public connect() {
        return super.connect()
        .then(() => this.disableFPB());
    }

    /**
     * Get the state of the processor core
     * @returns Promise of CoreState
     */
    public getState(): Promise<CoreState> {
        return this.readMem32(DebugRegister.DHCSR)
        .then(dhcsr => {
            let state: CoreState;

            if (dhcsr & DhcsrMask.S_LOCKUP) state = CoreState.LOCKUP;
            else if (dhcsr & DhcsrMask.S_SLEEP) state = CoreState.SLEEPING;
            else if (dhcsr & DhcsrMask.S_HALT) state = CoreState.DEBUG;
            else state = CoreState.RUNNING;

            if (dhcsr & DhcsrMask.S_RESET_ST) {
                // The core has been reset, check if an instruction has run
                return this.readMem32(DebugRegister.DHCSR)
                .then(newDhcsr => {
                    if (newDhcsr & DhcsrMask.S_RESET_ST && !(newDhcsr & DhcsrMask.S_RETIRE_ST)) {
                        return CoreState.RESET;
                    } else {
                        return state;
                    }
                });
            } else {
                return state;
            }
        });
    }

    /**
     * Enable flash patch breakpoints
     * @returns Promise
     */
    public enableFPB() {
        return this.writeMem32(FPBRegister.FP_CTRL, FPBCtrlMask.KEY | FPBCtrlMask.ENABLE);
    }

    /**
     * Disable flash patch breakpoints
     * @returns Promise
     */
    public disableFPB() {
        return this.writeMem32(FPBRegister.FP_CTRL, FPBCtrlMask.KEY | 0);
    }

    /**
     * Whether the target is halted
     * @returns Promise of halted state
     */
    public isHalted(): Promise<boolean> {
        return this.readMem32(DebugRegister.DHCSR)
        .then(dhcsr => {
            return !!(dhcsr & DhcsrMask.S_HALT);
        });
    }

    /**
     * Halt the target
     * @param wait Wait until halted before returning
     * @param timeout Milliseconds to wait before aborting wait
     * @returns Promise
     */
    public halt(wait: boolean = true, timeout: number = 0): Promise<void> {
        return this.isHalted()
        .then(halted => {
            if (halted) return;

            return this.writeMem32(DebugRegister.DHCSR, DhcsrMask.DBGKEY | DhcsrMask.C_DEBUGEN | DhcsrMask.C_HALT)
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted(), 100, timeout);
            });
        });
    }

    /**
     * Resume a target
     * @param wait Wait until resumed before returning
     * @param timeout Milliseconds to wait before aborting wait
     * @returns Promise
     */
    public resume(wait: boolean = true, timeout: number = 0) {
        return this.isHalted()
        .then(halted => {
            if (!halted) return;

            return this.writeMem32(DebugRegister.DFSR, DfsrMask.DWTTRAP | DfsrMask.BKPT | DfsrMask.HALTED)
            .then(() => this.enableDebug())
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted().then(result => !result), 100, timeout);
            });
        });
    }

    /**
     * Read from a core register
     * @param register The register to read
     * @returns Promise of value
     */
    public readCoreRegister(register: CoreRegister): Promise<number> {
        return this.transferSequence([
            this.writeMem32Command(DebugRegister.DCRSR, register),
            this.readMem32Command(DebugRegister.DHCSR)
        ])
        .then(results => {
            const dhcsr = results[0];
            if (!(dhcsr & DhcsrMask.S_REGRDY)) {
                throw new Error("Register not ready");
            }

            return this.readMem32(DebugRegister.DCRDR);
        });
    }

    /**
     * Write to a core register
     * @param register The register to write to
     * @param value The value to write
     * @returns Promise
     */
    public writeCoreRegister(register: CoreRegister, value: number): Promise<void> {
        return this.transferSequence([
            this.writeMem32Command(DebugRegister.DCRDR, value),
            this.writeMem32Command(DebugRegister.DCRSR, register | DcrsrMask.REGWnR),
            this.readMem32Command(DebugRegister.DHCSR)
        ])
        .then(results => {
            const dhcsr = results[0];
            if (!(dhcsr & DhcsrMask.S_REGRDY)) {
                throw new Error("Register not ready");
            }
        });
    }
}
