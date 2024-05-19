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

import { Transport } from '../transport';
import { Proxy, CmsisDAP, DAPOperation } from '../proxy';
import { DPRegister, APRegister, CSWMask, BankSelectMask, AbortMask, CtrlStatMask } from './enums';
import { DAP } from './';
import { DAPTransferMode, DAPPort, DAPProtocol } from '../proxy/enums';
import { DEFAULT_CLOCK_FREQUENCY } from '../proxy/cmsis-dap';

/**
 * @hidden
 */
const DEFAULT_WAIT_DELAY = 100;

// auto-increment beyond 1kB (10 bits) is implementation defined, see:
// https://developer.arm.com/documentation/ihi0031/a/The-Memory-Access-Port--MEM-AP-/MEM-AP-functions/Auto-incrementing-the-Transfer-Address-Register--TAR-
const DEFAULT_AUTOINC_PAGESIZE = (1 << 10);

/**
 * Arm Debug Interface class
 */
export class ADI implements DAP {

    private selectedAddress?: number;
    private cswValue?: number;
    private proxy: Proxy;

    /**
     * ADI constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use (default 0)
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode?: DAPProtocol, clockFrequency?: number);
    /**
     * ADI constructor
     * @param proxy Proxy to use
     */
    constructor(proxy: Proxy);
    constructor(transportOrDap: Transport | Proxy, mode: DAPProtocol = DAPProtocol.DEFAULT, clockFrequency: number = DEFAULT_CLOCK_FREQUENCY) {
        const isTransport = (test: Transport | Proxy): test is Transport => {
            return (test as Transport).open !== undefined;
        };

        this.proxy = isTransport(transportOrDap) ? new CmsisDAP(transportOrDap, mode, clockFrequency) : transportOrDap;
    }

    /**
     * Continually run a function until it returns true
     * @param fn The function to run
     * @param timeout Optional timeout to wait before giving up and throwing
     * @param delay The milliseconds to wait between each run
     * @returns Promise
     */
    protected async waitDelay(fn: () => Promise<boolean>, timeout: number = 0, delay: number = DEFAULT_WAIT_DELAY): Promise<void> {
        let running = true;

        if (timeout > 0) {
            setTimeout(() => {
                if (running) {
                    running = false;
                    throw new Error('Wait timed out');
                }
            }, timeout);
        }

        while (running) {
            const result = await fn();
            if (result === true) {
                running = false;
                return;
            }

            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    protected concatTypedArray(arrays: Uint32Array[]): Uint32Array {
        // Only one array exists
        if (arrays.length === 1) return arrays[0];

        // Determine array length
        let length: number = 0;
        for (const array of arrays) {
            length += array.length;
        }

        // Concat the arrays
        const result = new Uint32Array(length);
        for (let i = 0, j = 0; i < arrays.length; i++) {
            result.set(arrays[i], j);
            j += arrays[i].length;
        }

        return result;
    }

    protected readDPCommand(register: number): DAPOperation[] {
        return [{
            mode: DAPTransferMode.READ,
            port: DAPPort.DEBUG,
            register
        }];
    }

    protected writeDPCommand(register: number, value: number): DAPOperation[] {
        if (register === DPRegister.SELECT) {
            if (value === this.selectedAddress) {
                return [];
            }
            this.selectedAddress = value;
        }

        return [{
            mode: DAPTransferMode.WRITE,
            port: DAPPort.DEBUG,
            register,
            value
        }];
    }

    protected readAPCommand(register: number): DAPOperation[] {
        const address = (register & BankSelectMask.APSEL) | (register & BankSelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: DAPTransferMode.READ,
            port: DAPPort.ACCESS,
            register
        });
    }

    protected writeAPCommand(register: number, value: number): DAPOperation[] {
        if (register === APRegister.CSW) {
            if (value === this.cswValue) {
                return [];
            }
            this.cswValue = value;
        }

        const address = (register & BankSelectMask.APSEL) | (register & BankSelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: DAPTransferMode.WRITE,
            port: DAPPort.ACCESS,
            register,
            value
        });
    }

    protected readMem8Command(register: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_8)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.readAPCommand(APRegister.DRW));
    }

    protected writeMem8Command(register: number, value: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_8)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.writeAPCommand(APRegister.DRW, value));
    }

    protected readMem16Command(register: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_16)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.readAPCommand(APRegister.DRW));
    }

    protected writeMem16Command(register: number, value: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_16)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.writeAPCommand(APRegister.DRW, value));
    }

    protected readMem32Command(register: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.readAPCommand(APRegister.DRW));
    }

    protected writeMem32Command(register: number, value: number): DAPOperation[] {
        return this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32)
            .concat(this.writeAPCommand(APRegister.TAR, register))
            .concat(this.writeAPCommand(APRegister.DRW, value as number));
    }

    protected async transferSequence(operations: DAPOperation[][]): Promise<Uint32Array> {
        // Flatten operations into single array
        let merged: DAPOperation[] = [];
        merged = merged.concat(...operations);

        const results: Uint32Array[] = [];

        // Split operations into sequences no longer than operation count
        while (merged.length) {
            const sequence = merged.splice(0, this.proxy.operationCount);
            const result = await this.proxy.transfer(sequence);
            results.push(result);
        }

        return this.concatTypedArray(results);
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public async connect() {
        const mask = CtrlStatMask.CDBGPWRUPACK | CtrlStatMask.CSYSPWRUPACK;

        await this.proxy.connect();
        await this.readDP(DPRegister.DPIDR);
        await this.transferSequence([
            this.writeDPCommand(DPRegister.ABORT, AbortMask.STKERRCLR), // clear sticky error
            this.writeDPCommand(DPRegister.SELECT, APRegister.CSW), // select CTRL_STAT
            this.writeDPCommand(DPRegister.CTRL_STAT, CtrlStatMask.CSYSPWRUPREQ | CtrlStatMask.CDBGPWRUPREQ)
        ]);

        // Wait until system and debug have powered up
        await this.waitDelay(async () => {
            const status = await this.readDP(DPRegister.CTRL_STAT);
            return (status & mask) === mask;
        });
    }

    /**
     * Disconnect from target device
     * @returns Promise
     */
    public disconnect(): Promise<void> {
        return this.proxy.disconnect();
    }

    /**
     * Reconnect to target device
     * @returns Promise
     */
    public async reconnect(): Promise<void> {
        await this.disconnect();
        await new Promise(resolve => setTimeout(resolve, DEFAULT_WAIT_DELAY));
        await this.connect();
    }

    /**
     * Reset target device
     * @returns Promise
     */
    public reset(): Promise<boolean> {
        return this.proxy.reset();
    }

    /**
     * Read from a debug port register
     * @param register DP register to read
     * @returns Promise of register value
     */
    public async readDP(register: DPRegister): Promise<number> {
        const result = await this.proxy.transfer(this.readDPCommand(register));
        return result[0];
    }

    /**
     * Write to a debug port register
     * @param register DP register to write
     * @param value Value to write
     * @returns Promise
     */
    public async writeDP(register: DPRegister, value: number): Promise<void> {
        await this.proxy.transfer(this.writeDPCommand(register, value));
    }

    /**
     * Read from an access port register
     * @param register AP register to read
     * @returns Promise of register value
     */
    public async readAP(register: APRegister): Promise<number> {
        const result = await this.proxy.transfer(this.readAPCommand(register));
        return result[0];
    }

    /**
     * Write to an access port register
     * @param register AP register to write
     * @param value Value to write
     * @returns Promise
     */
    public async writeAP(register: APRegister, value: number): Promise<void> {
        await this.proxy.transfer(this.writeAPCommand(register, value));
    }

    /**
     * Read an 8-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    public async readMem8(register: number): Promise<number> {
        const result = await this.proxy.transfer(this.readMem8Command(register));
        return result[0] as number >> ((register & 0x03) << 3) & 0xFF;
    }

    /**
     * Write an 8-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public async writeMem8(register: number, value: number): Promise<void> {
        value = value as number << ((register & 0x03) << 3);
        await this.proxy.transfer(this.writeMem8Command(register, value));
    }

    /**
     * Read a 16-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    public async readMem16(register: number): Promise<number> {
        const result = await this.proxy.transfer(this.readMem16Command(register));
        return result[0] as number >> ((register & 0x02) << 3) & 0xFFFF;
    }

    /**
     * Write a 16-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public async writeMem16(register: number, value: number): Promise<void> {
        value = value as number << ((register & 0x02) << 3);
        await this.proxy.transfer(this.writeMem16Command(register, value));
    }

    /**
     * Read a 32-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    public async readMem32(register: number): Promise<number> {
        const result = await this.proxy.transfer(this.readMem32Command(register));
        return result[0];
    }

    /**
     * Write a 32-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public async writeMem32(register: number, value: number): Promise<void> {
        await this.proxy.transfer(this.writeMem32Command(register, value));
    }

    /**
     * Read a sequence of 32-bit words from a memory access port register, without crossing TAR auto-increment boundaries
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    protected async readMem32Sequence(register: number, count: number): Promise<Uint32Array> {
        await this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register)
        ]);

        const results: Uint32Array[] = [];

        // Split into requests no longer than block size
        let remainder = count;
        while (remainder > 0) {
            const chunkSize = Math.min(remainder, Math.floor(this.proxy.blockSize / 4));
            const result = await this.proxy.transferBlock(DAPPort.ACCESS, APRegister.DRW, chunkSize);
            results.push(result);
            remainder -= chunkSize;
        }

        return this.concatTypedArray(results);
    }

    /**
     * Write a sequence of 32-bit words to a memory access port register, without crossing TAR auto-increment boundaries
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    protected async writeMem32Sequence(register: number, values: Uint32Array): Promise<void> {
        await this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register)
        ]);

        // Split values into chunks no longer than block size
        let index = 0;
        while (index < values.length) {
            const chunk = values.slice(index, index + Math.floor(this.proxy.blockSize / 4));
            await this.proxy.transferBlock(DAPPort.ACCESS, APRegister.DRW, chunk);
            index += Math.floor(this.proxy.blockSize / 4);
        }
    }

    /**
     * Read a block of 32-bit words from a memory access port register
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    public async readBlock(register: number, count: number): Promise<Uint32Array> {
        const results: Uint32Array[] = [];

        // Split into reads that do not cross TAR autoincrement boundaries
        let remainder = count;
        while (remainder > 0) {
            const nextPageOffset = DEFAULT_AUTOINC_PAGESIZE - (register % DEFAULT_AUTOINC_PAGESIZE);
            const chunkSize = Math.min(remainder, nextPageOffset / 4);
            const result = await this.readMem32Sequence(register, chunkSize);
            results.push(result);
            register += chunkSize * 4;
            remainder -= chunkSize;
        }

        return this.concatTypedArray(results);
    }

    /**
     * Write a block of 32-bit words to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    public async writeBlock(register: number, values: Uint32Array): Promise<void> {
        // Split into writes that do not cross TAR autoincrement boundaries
        let index = 0;
        while (index < values.length) {
            const nextPageOffset = DEFAULT_AUTOINC_PAGESIZE - (register % DEFAULT_AUTOINC_PAGESIZE);
            const chunkSize = Math.min(values.length - index, nextPageOffset / 4);
            const chunk = values.slice(index, index + chunkSize);
            await this.writeMem32Sequence(register, chunk);
            register += chunkSize * 4;
            index += chunkSize;
        }
    }

    /**
     * Read a block of bytes from a memory access port register
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    public async readBytes(register: number, count: number): Promise<Uint8Array> {
        // read a word-aligned chunk of 32-bit words containing the requested range, then trim it
        let bytesToRead = count;
        const startOffset = register & 0x03;
        const endOffset = (register + count) & 0x03;

        // include left-most 32-bit word
        if (startOffset) {
            register -= startOffset;
            bytesToRead += startOffset;
        }

        // include right-most 32-bit word
        if (endOffset) {
            bytesToRead += (4 - endOffset);
        }

        const result = await this.readBlock(register, bytesToRead / 4);
        return new Uint8Array(result.buffer).slice(startOffset, startOffset + count);
    }

    /**
     * Write a block of bytes to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    public async writeBytes(register: number, values: Uint8Array): Promise<void> {
        let bytesToWrite = values.length;
        let index = 0;

        // initial byte write
        if ((bytesToWrite > 0) && (register & 0x01)) {
            await this.writeMem8(register, values[index]);
            bytesToWrite -= 1;
            register += 1;
            index += 1;
        }

        // initial 16-bit word write
        if ((bytesToWrite > 1) && (register & 0x02)) {
            await this.writeMem16(register, values[index] | (values[index + 1] << 8));
            bytesToWrite -= 2;
            register += 2;
            index += 2;
        }

        // chunk of word-aligned 32-bit words
        if (bytesToWrite >= 4) {
            const chunkSize = bytesToWrite - bytesToWrite % 4;
            const chunk = new Uint32Array(values.slice(index, index + chunkSize).buffer);
            await this.writeBlock(register, chunk);
            bytesToWrite -= chunkSize;
            register += chunkSize;
            index += chunkSize;
        }

        // trailing 16-bit word write
        if (bytesToWrite > 1) {
            await this.writeMem16(register, values[index] | (values[index + 1] << 8));
            bytesToWrite -= 2;
            register += 2;
            index += 2;
        }

        // tailing byte write
        if (bytesToWrite > 0) {
            await this.writeMem8(register, values[index]);
        }
    }
}
