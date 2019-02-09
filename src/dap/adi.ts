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

import { Transport } from "../transport";
import { Proxy, CmsisDAP, DAPOperation } from "../proxy";
import { DPRegister, APRegister, CSWMask, BankSelectMask, AbortMask, CtrlStatMask } from "./enums";
import { DAP } from "./";
import { DAPTransferMode, DAPPort, DAPProtocol } from "../proxy/enums";
import { DEFAULT_CLOCK_FREQUENCY } from "../proxy/cmsis-dap";

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
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode: DAPProtocol, clockFrequency: number);
    /**
     * ADI constructor
     * @param proxy Proxy to use
     */
    constructor(proxy: Proxy);
    constructor(transportOrDap: Transport | Proxy, mode: DAPProtocol = DAPProtocol.DEFAULT, clockFrequency: number = DEFAULT_CLOCK_FREQUENCY) {
        function isTransport(test: Transport | Proxy): test is Transport {
            return (test as Transport).open !== undefined;
        }
        this.proxy = isTransport(transportOrDap) ? new CmsisDAP(transportOrDap, mode, clockFrequency) : transportOrDap;
    }

    protected delay(timeout: number): Promise<void> {
        return new Promise((resolve, _reject) => {
            setTimeout(resolve, timeout);
        });
    }

    /**
     * Continually run a function until it returns true
     * @param fn The function to run
     * @param timer The milliseconds to wait between each run
     * @param timeout Optional timeout to wait before giving up and rejecting
     * @returns Promise
     */
    protected waitDelay(fn: () => Promise<boolean>, timer: number = 100, timeout: number = 0): Promise<void> {
        let running: boolean = true;

        const chain = (condition: boolean): Promise<void> => {
            if (!running) return Promise.resolve();
            return condition
                ? Promise.resolve()
                : this.delay(timer)
                .then(fn)
                .then(chain);
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

    protected transferSequence(operations: DAPOperation[][]): Promise<Uint32Array> {
        // Flatten operations into single array
        let merged: DAPOperation[] = [];
        merged = merged.concat(...operations);

        let chain: Promise<Uint32Array[]> = Promise.resolve([]);

        // Split operations into sequences no longer than operation count
        while (merged.length) {
            const sequence = merged.splice(0, this.proxy.operationCount);
            chain = chain.then(results => this.proxy.transfer(sequence).then(result => [...results, result]));
        }

        return chain
        .then(arrays => this.concatTypedArray(arrays));
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public connect() {
        const mask = CtrlStatMask.CDBGPWRUPACK | CtrlStatMask.CSYSPWRUPACK;

        return this.proxy.connect()
        .then(() => this.readDP(DPRegister.DPIDR))
        .then(() => this.transferSequence([
            this.writeDPCommand(DPRegister.ABORT, AbortMask.STKERRCLR), // clear sticky error
            this.writeDPCommand(DPRegister.SELECT, APRegister.CSW), // select CTRL_STAT
            this.writeDPCommand(DPRegister.CTRL_STAT, CtrlStatMask.CSYSPWRUPREQ | CtrlStatMask.CDBGPWRUPREQ)
        ]))
        // Wait until system and debug have powered up
        .then(() => this.waitDelay(() => {
            return this.readDP(DPRegister.CTRL_STAT)
            .then(status => ((status & mask) === mask));
        }));
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
    public reconnect(): Promise<void> {
        return this.disconnect()
        .then(() => this.delay(100))
        .then(() => this.connect());
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
    public readDP(register: DPRegister): Promise<number> {
        return this.proxy.transfer(this.readDPCommand(register))
        .then(result => result[0]);
    }

    /**
     * Write to a debug port register
     * @param register DP register to write
     * @param value Value to write
     * @returns Promise
     */
    public writeDP(register: DPRegister, value: number): Promise<void> {
        return this.proxy.transfer(this.writeDPCommand(register, value))
        .then(() => undefined);
    }

    /**
     * Read from an access port register
     * @param register AP register to read
     * @returns Promise of register value
     */
    public readAP(register: APRegister): Promise<number> {
        return this.proxy.transfer(this.readAPCommand(register))
        .then(result => result[0]);
    }

    /**
     * Write to an access port register
     * @param register AP register to write
     * @param value Value to write
     * @returns Promise
     */
    public writeAP(register: APRegister, value: number): Promise<void> {
        return this.proxy.transfer(this.writeAPCommand(register, value))
        .then(() => undefined);
    }

    /**
     * Read a 16-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    public readMem16(register: number): Promise<number> {
        return this.proxy.transfer(this.readMem16Command(register))
        .then(result => result[0]);
    }

    /**
     * Write a 16-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public writeMem16(register: number, value: number): Promise<void> {
        value = value as number << ((register & 0x02) << 3);
        return this.proxy.transfer(this.writeMem16Command(register, value))
        .then(() => undefined);
    }

    /**
     * Read a 32-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    public readMem32(register: number): Promise<number> {
        return this.proxy.transfer(this.readMem32Command(register))
        .then(result => result[0]);
    }

    /**
     * Write a 32-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public writeMem32(register: number, value: number): Promise<void> {
        return this.proxy.transfer(this.writeMem32Command(register, value))
        .then(() => undefined);
    }

    /**
     * Read a block of 32-bit words from a memory access port register
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    public readBlock(register: number, count: number): Promise<Uint32Array> {
        let chain: Promise<Uint32Array[]> = this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register),
        ])
        .then(() => []);

        // Split into requests no longer than block size
        let remainder = count;
        while (remainder > 0) {
            const chunkSize = Math.min(remainder, this.proxy.blockSize);
            chain = chain.then(results => this.proxy.transferBlock(DAPPort.ACCESS, APRegister.DRW, chunkSize)
            .then(result => [...results, result]));
            remainder -= chunkSize;
        }

        return chain
        .then(arrays => this.concatTypedArray(arrays));
    }

    /**
     * Write a block of 32-bit words to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    public writeBlock(register: number, values: Uint32Array): Promise<void> {
        let chain: Promise<void> = this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CSWMask.VALUE | CSWMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register),
        ])
        .then(() => undefined);

        // Split values into chunks no longer than block size
        let index = 0;
        while (index < values.length) {
            const chunk = values.slice(index, index + this.proxy.blockSize);
            chain = chain.then(() => this.proxy.transferBlock(DAPPort.ACCESS, APRegister.DRW, chunk));
            index += this.proxy.blockSize;
        }

        return chain;
    }
}
