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
import { CortexRegister, CoreRegister } from "./enums";
import { Processor } from "./";

// http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.set.cortexm/index.html

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

    public enableDebug() {
        return this.writeMem32(CortexRegister.DHCSR, CortexRegister.DBGKEY | CortexRegister.C_DEBUGEN);
    }

    public isHalted(): Promise<boolean> {
        return this.readMem32(CortexRegister.DHCSR)
        .then(dhcsr => {
            return !!(dhcsr & CortexRegister.S_HALT);
        });
    }

    public halt(wait: boolean = true): Promise<void> {
        return this.isHalted()
        .then(halted => {
            if (halted) return;

            return this.writeMem32(CortexRegister.DHCSR, CortexRegister.DBGKEY | CortexRegister.C_DEBUGEN | CortexRegister.C_HALT)
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted(), 100);
            });
        });
    }

    public resume(wait: boolean = true) {
        return this.isHalted()
        .then(halted => {
            if (!halted) return;

            return this.writeMem32(CortexRegister.DFSR, CortexRegister.DFSR_DWTTRAP | CortexRegister.DFSR_BKPT | CortexRegister.DFSR_HALTED)
            .then(() => this.enableDebug())
            .then(() => {
                if (!wait) return;

                return this.waitDelay(() => this.isHalted().then(result => !result), 100);
            });
        });
    }

    public readCoreRegister(register: CoreRegister): Promise<number> {
        return this.transferSequence([
            this.writeMem32Command(CortexRegister.DCRSR, register),
            this.readMem32Command(CortexRegister.DHCSR)
        ])
        .then(results => {
            const dhcsr = results[0];
            if (!(dhcsr & CortexRegister.S_REGRDY)) {
                throw new Error("Register not ready");
            }

            return this.readMem32(CortexRegister.DCRDR);
        });
    }

    public writeCoreRegister(register: CoreRegister, value: number): Promise<void> {
        return this.transferSequence([
            this.writeMem32Command(CortexRegister.DCRDR, value),
            this.writeMem32Command(CortexRegister.DCRSR, register | CortexRegister.DCRSR_REGWnR),
            this.readMem32Command(CortexRegister.DHCSR)
        ])
        .then(results => {
            const dhcsr = results[0];
            if (!(dhcsr & CortexRegister.S_REGRDY)) {
                throw new Error("Register not ready");
            }
        });
    }
}
