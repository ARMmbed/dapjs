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

import { CmsisDap, TransferMode, DapPort } from "../cmsis-dap";
import { DPRegister, ApRegister, CSW, SelectMask, AbortBits, CtrlStatBits } from "./enums";
import { Debug } from "./";
import { TransferOperation } from "../cmsis-dap/enums";

// http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100230_0002_00_en/smr1439293428201.html

/**
 * Arm Debug Interface class
 */
export class DAP extends CmsisDap implements Debug {

    private selectedAddress: number = null;
    private cswValue: number = null;

    public connect() {
        return super.connect()
        .then(() => this.transferSequence([
            this.writeDPCommand(DPRegister.ABORT, AbortBits.STKERRCLR), // clear sticky error
            this.writeDPCommand(DPRegister.SELECT, ApRegister.CSW), // select CTRL_STAT
            this.writeDPCommand(DPRegister.CTRL_STAT, CtrlStatBits.CSYSPWRUPREQ | CtrlStatBits.CDBGPWRUPREQ),
            this.readDPCommand(DPRegister.CTRL_STAT),
        ]))
        .then(result => {
            const status = result[0];
            const mask = CtrlStatBits.CDBGPWRUPACK | CtrlStatBits.CSYSPWRUPACK;
            while ((status & mask) !== mask) {
                // this.readDp(Register.CTRL_STAT);
            }
        });
    }

    private readDPCommand(register: number): TransferOperation[] {
        return [{
            mode: TransferMode.READ,
            port: DapPort.DEBUG,
            register
        }];
    }

    private writeDPCommand(register: number, value: number): TransferOperation[] {
        if (register === DPRegister.SELECT) {
            if (value === this.selectedAddress) {
                return [];
            }
            this.selectedAddress = value;
        }

        return [{
            mode: TransferMode.WRITE,
            port: DapPort.DEBUG,
            register,
            value
        }];
    }

    private readAPCommand(register: number): TransferOperation[] {
        const address = (register & SelectMask.APSEL) | (register & SelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: TransferMode.READ,
            port: DapPort.ACCESS,
            register
        });
    }

    private writeAPCommand(register: number, value: number): TransferOperation[] {
        if (register === ApRegister.CSW) {
            if (value === this.cswValue) {
                return [];
            }
            this.cswValue = value;
        }

        const address = (register & SelectMask.APSEL) | (register & SelectMask.APBANKSEL);

        return this.writeDPCommand(DPRegister.SELECT, address).concat({
            mode: TransferMode.WRITE,
            port: DapPort.ACCESS,
            register,
            value
        });
    }

    private transferSequence(operations: TransferOperation[][]): Promise<Uint32Array> {
        const merged = [].concat(...operations);
        return this.transfer(merged);
    }

    /**
     * Read from a debug port register
     * @param register DP register to read
     * @returns Promise of register value
     */
    public readDP(register: DPRegister): Promise<number> {
        return this.transfer(this.readDPCommand(register))
        .then(result => result[0]);
    }

    /**
     * Write to a debug port register
     * @param register DP register to write
     * @param value Value to write
     * @returns Promise
     */
    public writeDP(register: DPRegister, value: number): Promise<void> {
        return this.transfer(this.writeDPCommand(register, value))
        .then(() => undefined);
    }

    /**
     * Read from an access port register
     * @param register AP register to read
     * @returns Promise of register value
     */
    public readAP(register: ApRegister): Promise<number> {
        return this.transfer(this.readAPCommand(register))
        .then(result => result[0]);
    }

    /**
     * Write to an access port register
     * @param register AP register to write
     * @param value Value to write
     * @returns Promise
     */
    public writeAP(register: ApRegister, value: number): Promise<void> {
        return this.transfer(this.writeAPCommand(register, value))
        .then(() => undefined);
    }

    /**
     * Read a 16-bit word from a memory access port register
     * @param registerId ID of register to read
     * @returns Promise of register data
     */
    public readMem16(registerId: number): Promise<number> {
        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE16),
            this.writeAPCommand(ApRegister.TAR, registerId),
            this.readAPCommand(ApRegister.DRW)
        ])
        .then(result => result[0]);
    }

    /**
     * Write a 16-bit word to a memory access port register
     * @param registerId ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public writeMem16(registerId: number, value: number): Promise<void> {
        value = value as number << ((registerId & 0x02) << 3);

        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE16),
            this.writeAPCommand(ApRegister.TAR, registerId),
            this.writeAPCommand(ApRegister.DRW, value)
        ])
        .then(() => undefined);
    }

    /**
     * Read a 32-bit word from a memory access port register
     * @param registerId ID of register to read
     * @returns Promise of register data
     */
    public readMem32(registerId: number): Promise<number> {
        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE32),
            this.writeAPCommand(ApRegister.TAR, registerId),
            this.readAPCommand(ApRegister.DRW)
        ])
        .then(result => result[0]);
    }

    /**
     * Write a 32-bit word to a memory access port register
     * @param registerId ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    public writeMem32(registerId: number, value: number): Promise<void> {
        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE32),
            this.writeAPCommand(ApRegister.TAR, registerId),
            this.writeAPCommand(ApRegister.DRW, value as number)
        ])
        .then(() => undefined);
    }

    /**
     * Read a block of 32-bit words from a memory access port register
     * @param registerId ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    public readBlock(registerId: number, count: number): Promise<Uint32Array> {
        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE32),
            this.writeAPCommand(ApRegister.TAR, registerId),
        ])
        .then(() => this.transferBlock(DapPort.ACCESS, ApRegister.DRW, count))
        .then(() => undefined);
    }

    /**
     * Write a block of 32-bit words to a memory access port register
     * @param registerId ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    public writeBlock(registerId: number, values: Uint32Array): Promise<void> {
        return this.transferSequence([
            this.writeAPCommand(ApRegister.CSW, CSW.CSW_VALUE | CSW.CSW_SIZE32),
            this.writeAPCommand(ApRegister.TAR, registerId),
        ])
        .then(() => this.transferBlock(DapPort.ACCESS, ApRegister.DRW, values))
        .then(() => undefined);
    }
}
