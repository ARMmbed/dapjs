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
import { Proxy, CmsisDap, DapOperation } from "../proxy";
import { DPRegister, APRegister, CswMask, BankSelectMask, AbortMask, CtrlStatMask } from "./enums";
import { DAP } from "./";
import { DapTransferMode, DapPort, DapConnectPort } from "../proxy/enums";

/**
 * Arm Debug Interface class
 */
export class ADI implements DAP {

    private selectedAddress: number = null;
    private cswValue: number = null;
    private proxy: Proxy;

    /**
     * ADI constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use
     */
    constructor(transport: Transport, mode: DapConnectPort, clockFrequency: number);
    /**
     * ADI constructor
     * @param proxy Proxy to use
     */
    constructor(proxy: Proxy);
    constructor(transportOrDap: Transport | Proxy, mode: DapConnectPort = DapConnectPort.DEFAULT, clockFrequency: number = 10000000) {
        function isTransport(test: Transport | Proxy): test is Transport {
            return (test as Transport).open !== undefined;
        }

        this.proxy = isTransport(transportOrDap) ? new CmsisDap(transportOrDap, mode, clockFrequency) : transportOrDap;
    }

    protected readDPCommand(register: number): DapOperation[] {
        return [{
            mode: DapTransferMode.READ,
            port: DapPort.DEBUG,
            register
        }];
    }

    protected writeDPCommand(register: number, value: number): DapOperation[] {
        if (register === DPRegister.SELECT) {
            if (value === this.selectedAddress) {
                return [];
            }
            this.selectedAddress = value;
        }

        return [{
            mode: DapTransferMode.WRITE,
            port: DapPort.DEBUG,
            register,
            value
        }];
    }

    protected readAPCommand(register: number): DapOperation[] {
        const address = (register & BankSelectMask.APSEL) | (register & BankSelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: DapTransferMode.READ,
            port: DapPort.ACCESS,
            register
        });
    }

    protected writeAPCommand(register: number, value: number): DapOperation[] {
        if (register === APRegister.CSW) {
            if (value === this.cswValue) {
                return [];
            }
            this.cswValue = value;
        }

        const address = (register & BankSelectMask.APSEL) | (register & BankSelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: DapTransferMode.WRITE,
            port: DapPort.ACCESS,
            register,
            value
        });
    }

    protected readMem16Command(register: number): DapOperation[] {
        return this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_16)
        .concat(this.writeAPCommand(APRegister.TAR, register))
        .concat(this.readAPCommand(APRegister.DRW));
    }

    protected writeMem16Command(register: number, value: number): DapOperation[] {
        return this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_16)
        .concat(this.writeAPCommand(APRegister.TAR, register))
        .concat(this.writeAPCommand(APRegister.DRW, value));
    }

    protected readMem32Command(register: number): DapOperation[] {
        return this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_32)
        .concat(this.writeAPCommand(APRegister.TAR, register))
        .concat(this.readAPCommand(APRegister.DRW));
    }

    protected writeMem32Command(register: number, value: number): DapOperation[] {
        return this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_32)
        .concat(this.writeAPCommand(APRegister.TAR, register))
        .concat(this.writeAPCommand(APRegister.DRW, value as number));
    }

    protected transferSequence(operations: DapOperation[][]): Promise<Uint32Array> {
        const merged = [].concat(...operations);
        return this.proxy.transfer(merged);
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public connect() {
        return this.proxy.connect()
        .then(() => this.readDP(DPRegister.DPIDR))
        .then(() => this.transferSequence([
            this.writeDPCommand(DPRegister.ABORT, AbortMask.STKERRCLR), // clear sticky error
            this.writeDPCommand(DPRegister.SELECT, APRegister.CSW), // select CTRL_STAT
            this.writeDPCommand(DPRegister.CTRL_STAT, CtrlStatMask.CSYSPWRUPREQ | CtrlStatMask.CDBGPWRUPREQ),
            this.readDPCommand(DPRegister.CTRL_STAT),
        ]))
        .then(result => {
            const status = result[0];
            const mask = CtrlStatMask.CDBGPWRUPACK | CtrlStatMask.CSYSPWRUPACK;
            while ((status & mask) !== mask) {
                // this.readDp(Register.CTRL_STAT);
            }
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
    public reconnect(): Promise<void> {
        return this.proxy.reconnect();
    }

    /**
     * Reset target device
     * @returns Promise
     */
    public reset(): Promise<boolean> {
        return this.proxy.reset();
    }

    /**
     * Transfer data with a single read or write operation
     * @param port Port type (debug port or access port)
     * @param mode Whether to read or write
     * @param register The register to use
     * @param value Any value to write
     * @returns Promise of any value read
     */
    public transfer(port: DapPort, mode: DapTransferMode, register: number, value?: number): Promise<number>;
    /**
     * Transfer data with multiple read or write operations
     * @param operations The operations to use
     * @returns Promise of any values read
     */
    public transfer(operations: DapOperation[]): Promise<Uint32Array>;
    public transfer(portOrOps: DapPort | DapOperation[], mode?: DapTransferMode, register?: number, value?: number): Promise<number | Uint32Array> {
        return (typeof portOrOps === "number") ? this.proxy.transfer(portOrOps, mode, register, value) : this.proxy.transfer(portOrOps);
    }

    /**
     * Read a block of data from a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @returns Promise of values read
     */
    public transferBlock(port: DapPort, register: number, count: number): Promise<Uint32Array>;
    /**
     * Write a block of data to a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @param values The values to write
     * @returns Promise
     */
    public transferBlock(port: DapPort, register: number, values: Uint32Array): Promise<void>;
    public transferBlock(port: DapPort, register: number, countOrValues: number | Uint32Array): Promise<Uint32Array | void> {
        return (typeof countOrValues === "number") ? this.proxy.transferBlock(port, register, countOrValues) : this.proxy.transferBlock(port, register, countOrValues);
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
        return this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register),
        ])
        .then(() => this.proxy.transferBlock(DapPort.ACCESS, APRegister.DRW, count))
        .then(() => undefined);
    }

    /**
     * Write a block of 32-bit words to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    public writeBlock(register: number, values: Uint32Array): Promise<void> {
        return this.transferSequence([
            this.writeAPCommand(APRegister.CSW, CswMask.VALUE | CswMask.SIZE_32),
            this.writeAPCommand(APRegister.TAR, register),
        ])
        .then(() => this.proxy.transferBlock(DapPort.ACCESS, APRegister.DRW, values))
        .then(() => undefined);
    }
}
