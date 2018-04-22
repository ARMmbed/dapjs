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

import { DapPort, TransferMode } from "../enums";

/**
 * DAP proxy
 */
export interface DapProxy {
    /**
     * Connect to target device
     * @returns Promise
     */
    connect(): Promise<void>;

    /**
     * Disconnect from target device
     * @returns Promise
     */
    disconnect(): Promise<void>;

    /**
     * Reset target device
     * @returns Promise of success
     */
    reset(): Promise<boolean>;

    /**
     * Transfer data
     * @param register The register to use
     * @param mode Whether to read or write
     * @param port Port type (debug port or access port)
     * @param value Any value to write
     * @returns Promise of any value read
     */
    transfer(register: number, mode: TransferMode, port?: DapPort, value?: number): Promise<number>;

    /**
     * Transfer a block of data
     * @param register The register to use
     * @param mode Whether to read or write
     * @param port Port type (debug port or access port)
     * @param values Any values to write
     * @returns Promise of any values read
     */
    transferBlock(register: number, mode: TransferMode, port?: DapPort, values?: Uint32Array): Promise<Uint32Array>;
}

export { CmsisDap } from "./cmsis-dap";
