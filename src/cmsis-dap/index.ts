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

// https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Commands__gr.html

import { EventEmitter } from "events";
import { Transport } from "../transport";
import {
    DapPort,
    TransferMode,
    DapConnectPort,
    DapCommand,
    DapConnectResponse,
    DapResponse,
    DapInfoRequest,
    DapResetTargeExecuteResponse,
    DapTransferResponse
} from "./enums";
export { TransferMode, DapPort, DapConnectPort } from "./enums";

/**
 * CMSIS-DAP class
 */
export class CmsisDap extends EventEmitter {

    /**
     * CMSIS-DAP constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use
     */
    constructor(private transport: Transport, private mode: DapConnectPort = DapConnectPort.DEFAULT, private clockFrequency = 10000000) {
        super();
    }

    private delay(timeout: number): Promise<void> {
        return new Promise((resolve, _reject) => {
            setTimeout(resolve, timeout);
        });
    }

    private bufferSourceToUint8Array(prefix: number, data?: BufferSource): Uint8Array {

        if (!data) {
            return new Uint8Array([prefix]);
        }

        function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
            return (source as ArrayBufferView).buffer !== undefined;
        }

        const arrayBuffer = isView(data) ? data.buffer : data;
        const result = new Uint8Array(arrayBuffer.byteLength + 1);

        result.set([prefix]);
        result.set(new Uint8Array(arrayBuffer), 1);

        return result;
    }

    private jtagToSwd(): Promise<void> {
        const commands = [
            new Uint8Array([56, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
            new Uint8Array([16, 0x9e, 0xe7]),
            new Uint8Array([56, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
            new Uint8Array([8, 0x00]),
        ];

        return commands.reduce((chain, command) => {
            return chain
            .then(() => this.execute(DapCommand.DAP_SWJ_SEQUENCE, command));
        }, Promise.resolve(null));
    }

    /**
     * Execute a command
     * @param command Command to execute
     * @param data Data to use
     * @returns Promise of DataView
     */
    protected execute(command: number, data?: BufferSource): Promise<DataView> {

        const array = this.bufferSourceToUint8Array(command, data);

        return this.transport.write(array)
        .then(() => this.transport.read())
        .then(response => {
            if (response.getUint8(0) !== command) {
                throw new Error(`Bad response for ${command} -> ${response.getUint8(0)}`);
            }

            switch (command) {
                case DapCommand.DAP_DISCONNECT:
                case DapCommand.DAP_WRITE_ABORT:
                case DapCommand.DAP_DELAY:
                case DapCommand.DAP_RESET_TARGET:
                case DapCommand.DAP_SWJ_CLOCK:
                case DapCommand.DAP_SWJ_SEQUENCE:
                case DapCommand.DAP_SWD_CONFIGURE:
                case DapCommand.DAP_SWD_SEQUENCE:
                case DapCommand.DAP_SWO_TRANSPORT:
                case DapCommand.DAP_SWO_MODE:
                case DapCommand.DAP_SWO_CONTROL:
                case DapCommand.DAP_JTAG_CONFIGURE:
                case DapCommand.DAP_JTAG_ID_CODE:
                case DapCommand.DAP_TRANSFER_CONFIGURE:
                    if (response.getUint8(1) !== DapResponse.DAP_OK) {
                        throw new Error(`Bad status for ${command} -> ${response.getUint8(1)}`);
                    }
            }

            return response;
        });
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public connect(): Promise<void> {
        return this.transport.open()
        .then(() => this.execute(DapCommand.DAP_SWJ_CLOCK, new Uint32Array([this.clockFrequency])))
        .then(() => this.execute(DapCommand.DAP_CONNECT, new Uint8Array([this.mode])))
        .then(result => {
            if (result.getUint8(1) === DapConnectResponse.FAILED || this.mode !== DapConnectPort.DEFAULT && result.getUint8(1) !== this.mode) {
                throw new Error("Mode not enabled.");
            }

            // await this.execute(DapCommand.DAP_SWJ_CLOCK, addInt32(null, this.clockFrequency));
            return this.execute(DapCommand.DAP_TRANSFER_CONFIGURE, new Uint8Array([0, 0x50, 0, 0, 0]));
        })
        .then(() => this.execute(DapCommand.DAP_SWD_CONFIGURE, new Uint8Array([0])))
        .then(() => this.jtagToSwd());
    }

    /**
     * Disconnect from target device
     * @returns Promise
     */
    public disconnect(): Promise<void> {
        return this.execute(DapCommand.DAP_DISCONNECT)
        .then(() => {
            return this.transport.close();
        });
    }

    /**
     * Reconnect to target device
     * @returns Promise
     */
    public reconnect(): Promise<void> {
        return this.disconnect()
        .then(() => this.delay(100))
        .then(this.connect);
    }

    /**
     * Get DAP information
     * @param request Type of information to get
     * @returns Promise of DataView
     */
    public dapInfo(request: DapInfoRequest): Promise<number | string> {
        return this.execute(DapCommand.DAP_INFO, new Uint8Array([request]))
        .then(result => {
            const length = result.getUint8(1);

            if (length === 0) {
                return null;
            }

            switch (request) {
                case DapInfoRequest.CAPABILITIES:
                case DapInfoRequest.PACKET_COUNT:
                case DapInfoRequest.PACKET_SIZE:
                case DapInfoRequest.SWO_TRACE_BUFFER_SIZE:
                    // Byte
                    if (length === 1) return result.getUint8(2);

                    // Short
                    if (length === 2) return result.getUint16(2);

                    // Word
                    if (length === 4) return result.getUint32(2);
            }

            const ascii = new Uint8Array(result.buffer, 2, length);
            return String.fromCharCode.apply(null, ascii);
        });
    }

    /**
     * Reset target device
     * @returns Promise
     */
    public reset(): Promise<boolean> {
        return this.execute(DapCommand.DAP_RESET_TARGET)
        .then(response => response.getUint8(2) === DapResetTargeExecuteResponse.RESET_SEQUENCE);
    }

    /**
     * Transfer data
     * @param register The register to use
     * @param mode Whether to read or write
     * @param port Port type (debug port or access port)
     * @param value Any value to write
     * @returns Promise of any value read
     */
    public transfer(register: number, mode: TransferMode, port: DapPort, value?: number): Promise<number> {

        const data = new Uint8Array(7);
        const view = new DataView(data.buffer);

        // DAP Index, ignored for SWD
        view.setUint8(0, 0);
        // Transfer count
        view.setUint8(1, 1);
        // Transfer request
        view.setUint8(2, port | mode | register);
        // Transfer data
        view.setUint32(3, value, true);

        return this.execute(DapCommand.DAP_TRANSFER, data)
        .then(result => {

            // Transfer count
            if (value && result.getUint8(1) !== 1) {
                throw new Error("Transfer count mismatch");
            }

            // Transfer response
            const response = result.getUint8(2);
            if (response & DapTransferResponse.WAIT) {
                throw new Error("Transfer response WAIT");
            }
            if (response & DapTransferResponse.FAULT) {
                throw new Error("Transfer response FAULT");
            }
            if (response & DapTransferResponse.PROTOCOL_ERROR) {
                throw new Error("Transfer response PROTOCOL_ERROR");
            }
            if (response & DapTransferResponse.VALUE_MISMATCH) {
                throw new Error("Transfer response VALUE_MISMATCH");
            }
            if (response & DapTransferResponse.NO_ACK) {
                throw new Error("Transfer response NO_ACK");
            }

            if (mode === TransferMode.READ) {
                return result.getUint32(3, true);
            }
        });
    }

    /**
     * Transfer a block of data
     * @param register The register to use
     * @param mode Whether to read or write
     * @param port Port type (debug port or access port)
     * @param values Any values to write
     * @returns Promise of any values read
     */
    public transferBlock(register: number, mode: TransferMode, port: DapPort, values?: Uint32Array): Promise<Uint32Array> {

        const data = new Uint8Array(4 + values.byteLength);
        const view = new DataView(data.buffer);

        // DAP Index, ignored for SWD
        view.setUint8(0, 0);
        // Transfer count
        view.setUint16(1, values.length, true);
        // Transfer request
        view.setUint8(3, port | mode | register);
        // Transfer data
        data.set(values, 4);

        return this.execute(DapCommand.DAP_TRANSFER_BLOCK, data)
        .then(result => {

            // Transfer count
            if (values && result.getUint16(1, true) !== values.length) {
                throw new Error("Transfer count mismatch");
            }

            // Transfer response
            const response = result.getUint8(3);
            if (response & DapTransferResponse.WAIT) {
                throw new Error("Transfer response WAIT");
            }
            if (response & DapTransferResponse.FAULT) {
                throw new Error("Transfer response FAULT");
            }
            if (response & DapTransferResponse.PROTOCOL_ERROR) {
                throw new Error("Transfer response PROTOCOL_ERROR");
            }
            if (response & DapTransferResponse.NO_ACK) {
                throw new Error("Transfer response NO_ACK");
            }

            if (mode === TransferMode.READ) {
                return new Uint32Array(result.buffer.slice(4));
            }
        });
    }
}
