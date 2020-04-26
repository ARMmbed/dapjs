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

import { DAPPort, DAPTransferMode } from './enums';

/**
 * CMSIS-DAP Transfer Operation
 */
export interface DAPOperation {
    /**
     * The register to use
     */
    register: number;
    /**
     * The read/write mode to use
     */
    mode: DAPTransferMode;
    /**
     * The port to use (Debug/Access)
     */
    port: DAPPort;
    /**
     * The (optional) value to write
     */
    value?: number;
}

/**
 * CMSIS Proxy interface
 */
export interface Proxy {
    /**
     * The maximum DAPOperations which can be transferred
     */
    operationCount: number;

    /**
     * The maximum block size which can be transferred
     */
    blockSize: number;

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
     * Reconnect to target device
     * @returns Promise
     */
    reconnect(): Promise<void>;

    /**
     * Reset target device
     * @returns Promise
     */
    reset(): Promise<boolean>;

    /**
     * Transfer data with a single read or write operation
     * @param port Port type (debug port or access port)
     * @param mode Whether to read or write
     * @param register The register to use
     * @param value Any value to write
     * @returns Promise of any value read
     */
    transfer(port: DAPPort, mode: DAPTransferMode, register: number, value?: number): Promise<number>;

    /**
     * Transfer data with multiple read or write operations
     * @param operations The operations to use
     * @returns Promise of any values read
     */
    transfer(operations: DAPOperation[]): Promise<Uint32Array>;

    /**
     * Read a block of data from a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @returns Promise of values read
     */
    transferBlock(port: DAPPort, register: number, count: number): Promise<Uint32Array>;

    /**
     * Write a block of data to a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @param values The values to write
     * @returns Promise
     */
    transferBlock(port: DAPPort, register: number, values: Uint32Array): Promise<void>;
}

export * from './cmsis-dap';
export * from './enums';
