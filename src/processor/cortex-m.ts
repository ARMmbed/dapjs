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
    CoreState
} from "./enums";
import { Processor } from "./";
import { DAPOperation } from "../proxy";

/**
 * @hidden
 */
const EXECUTE_TIMEOUT = 10000;
/**
 * @hidden
 */
const BKPT_INSTRUCTION = 0xBE2A;
/**
 * @hidden
 */
const GENERAL_REGISTER_COUNT = 12;

/**
 * Cortex M class
 */
export class CortexM extends ADI implements Processor {

    private enableDebug() {
        return this.writeMem32(DebugRegister.DHCSR, DhcsrMask.DBGKEY | DhcsrMask.C_DEBUGEN);
    }

    protected readCoreRegisterCommand(register: number): DAPOperation[] {
        return this.writeMem32Command(DebugRegister.DCRSR, register)
        .concat(this.readMem32Command(DebugRegister.DHCSR))
        .concat(this.readMem32Command(DebugRegister.DCRDR));
    }

    protected writeCoreRegisterCommand(register: number, value: number): DAPOperation[] {
        return this.writeMem32Command(DebugRegister.DCRDR, value)
        .concat(this.writeMem32Command(DebugRegister.DCRSR, register | DcrsrMask.REGWnR));
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
     * Read an array of core registers
     * @param registers The registers to read
     * @returns Promise of register values in an array
     */
    public readCoreRegisters(registers: CoreRegister[]): Promise<number[]> {
        let chain = Promise.resolve([]);

        registers.forEach(register => {
            chain = chain.then(results => this.readCoreRegister(register).then(result => [...results, result]));
        });

        return chain;
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

    /**
     * Exucute code at a specified memory address
     * @param address The address to put the code
     * @param code The code to use
     * @param stackPointer The stack pointer to use
     * @param programCounter The program counter to use
     * @param linkRegister The link register to use (defaults to address + 1)
     * @param registers Values to add to the general purpose registers, R0, R1, R2, etc.
     */
    public execute(address: number, code: Uint32Array, stackPointer: number, programCounter: number, linkRegister: number = address + 1, ...registers: number[]): Promise<number> {

        // Ensure a breakpoint exists at the end of the code
        if (code[code.length - 1] !== BKPT_INSTRUCTION) {
            const newCode = new Uint32Array(code.length + 1);
            newCode.set(code);
            newCode.set([BKPT_INSTRUCTION], code.length - 1);
            code = newCode;
        }

        // Create sequence of core register writes
        const sequence = [
            this.writeCoreRegisterCommand(CoreRegister.SP, stackPointer),
            this.writeCoreRegisterCommand(CoreRegister.PC, programCounter),
            this.writeCoreRegisterCommand(CoreRegister.LR, linkRegister)
        ];

        // Add in register values R0, R1, R2, etc.
        for (let i = 0; i < Math.min(registers.length, GENERAL_REGISTER_COUNT); i++) {
            sequence.push(this.writeCoreRegisterCommand(i, registers[i]));
        }

        return this.halt() // Halt the target
        .then(() => this.transferSequence(sequence)) // Write the registers
        .then(() => this.writeBlock(address, code)) // Write the code to the address
        .then(() => this.resume(false)) // Resume the target, without waiting
        .then(() => this.waitDelay(() => this.isHalted(), 100, EXECUTE_TIMEOUT)) // Wait for the target to halt on the breakpoint
        .then(() => undefined); // Return
    }
}
