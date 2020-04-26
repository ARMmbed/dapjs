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

/**
 * DAP interface
 */
export interface DAP {
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
     * Read from a debug port register
     * @param register ID of register to read
     * @returns Promise of register value
     */
    readDP(register: number): Promise<number>;

    /**
     * Write to a debug port register
     * @param register ID of register to write
     * @param value Value to write
     * @returns Promise
     */
    writeDP(register: number, value: number): Promise<void>;

    /**
     * Read from an access port register
     * @param register ID of register to read
     * @returns Promise of register value
     */
    readAP(register: number): Promise<number>;

    /**
     * Write to an access port register
     * @param register ID of register to write
     * @param value Value to write
     * @returns Promise
     */
    writeAP(register: number, value: number): Promise<void>;

    /**
     * Read a 16-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    readMem16(register: number): Promise<number>;

    /**
     * Write a 16-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeMem16(register: number, value: number): Promise<void>;

    /**
     * Read a 32-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    readMem32(register: number): Promise<number>;

    /**
     * Write a 32-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeMem32(register: number, value: number): Promise<void>;

    /**
     * Read a block of 32-bit words from a memory access port register
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    readBlock(register: number, count: number): Promise<Uint32Array>;

    /**
     * Write a block of 32-bit words to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    writeBlock(register: number, values: Uint32Array): Promise<void>;
}

export * from './adi';
export * from './enums';
