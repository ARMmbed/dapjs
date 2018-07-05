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

import { DAP } from "../dap";
import { CoreRegister } from "./enums";

/**
 * Processor interface
 */
export interface Processor extends DAP {
    /**
     * Enable flash patch breakpoints
     * @returns Promise
     */
    enableFPB(): Promise<void>;

    /**
     * Disable flash patch breakpoints
     * @returns Promise
     */
    disableFPB(): Promise<void>;

    /**
     * Halt the target
     * @param wait Wait until halted before returning
     * @returns Promise
     */
    halt(wait?: boolean): Promise<void>;

    /**
     * Whether the target is halted
     * @returns Promise of halted state
     */
    isHalted(): Promise<boolean>;

    /**
     * Resume a target
     * @param wait Wait until resumed before returning
     * @returns Promise
     */
    resume(wait?: boolean): Promise<void>;

    /**
     * Read from a core register
     * @param register The register to read
     * @returns Promise of value
     */
    readCoreRegister(register: CoreRegister): Promise<number>;

    /**
     * Write to a core register
     * @param register The register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeCoreRegister(register: CoreRegister, value: number): Promise<void>;
}

export { CortexM } from "./cortex-m";
