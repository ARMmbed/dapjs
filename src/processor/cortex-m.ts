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
    FPBCtrlMask
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

    private waitDelay(fn: () => Promise<boolean>, timeout: number): Promise<void> {
        const chain = (condition: boolean): Promise<void> => {
            return condition
                ? Promise.resolve()
                : this.delay(timeout)
                .then(fn)
                .then(chain);
        };

        return chain(false);
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
     * @returns Promise
     */
    public halt(wait: boolean = true): Promise<void> {
        return this.isHalted()
        .then(halted => {
            if (halted) return;

            return this.writeMem32(DebugRegister.DHCSR, DhcsrMask.DBGKEY | DhcsrMask.C_DEBUGEN | DhcsrMask.C_HALT)
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted(), 100);
            });
        });
    }

    /**
     * Resume a target
     * @param wait Wait until resumed before returning
     * @returns Promise
     */
    public resume(wait: boolean = true) {
        return this.isHalted()
        .then(halted => {
            if (!halted) return;

            return this.writeMem32(DebugRegister.DFSR, DfsrMask.DWTTRAP | DfsrMask.BKPT | DfsrMask.HALTED)
            .then(() => this.enableDebug())
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted().then(result => !result), 100);
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
