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

import { DapInfoRequest } from "./cmsis-dap";

/**
 * Debug interface
 */
export interface Interface {
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
     * @returns Promise
     */
    reset(): Promise<void>;
    /**
     * Execute a command
     * @param command Command to execute
     * @param data Data to use
     * @returns Promise of DataView
     */
    execute(command: number, data?: BufferSource): Promise<DataView>;
}

/**
 * CMSIS Debug interface
 */
export interface CmsisInterface extends Interface {
    /**
     * Get DAP information
     * @param request Type of information to get
     * @returns Promise of information as number or string
     */
    dapInfo(request: DapInfoRequest): Promise<number | string>;
    /**
     * Transfer data
     * @param data Data to transfer
     * @returns Promise of DataView
     */
    transfer(data: BufferSource): Promise<DataView>;
    /**
     * Transfer a block of data
     * @param data Data to transfer
     * @returns Promise of DataView
     */
    transferBlock(data: BufferSource): Promise<DataView>;
}

export { CmsisDap } from "./cmsis-dap";
