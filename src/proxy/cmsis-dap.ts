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

import { EventEmitter } from "events";
import { Transport } from "../transport";
import {
    DAPPort,
    DAPTransferMode,
    DAPProtocol,
    DAPCommand,
    DAPConnectResponse,
    DAPResponse,
    DAPInfoRequest,
    DAPResetTargeResponse,
    DAPTransferResponse
} from "./enums";
import { Proxy, DAPOperation } from "./";

/**
 * @hidden
 */
export const DEFAULT_CLOCK_FREQUENCY = 10000000;
/**
 * @hidden
 */
const SWD_SEQUENCE = 0xE79E;
/**
 * @hidden
 */
const JTAG_SEQUENCE = 0xE73C;

/**
 * @hidden
 */
const BLOCK_HEADER_SIZE = 4;
/**
 * @hidden
 */
const TRANSFER_HEADER_SIZE = 2;
/**
 * @hidden
 */
const TRANSFER_OPERATION_SIZE = 5;

/**
 * CMSIS-DAP class
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Commands__gr.html
 */
export class CmsisDAP extends EventEmitter implements Proxy {

    /**
     * The maximum DAPOperations which can be transferred
     */
    public operationCount: number;

    /**
     * The maximum block size which can be transferred
     */
    public blockSize: number;

    /**
     * CMSIS-DAP constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(private transport: Transport, private mode: DAPProtocol = DAPProtocol.DEFAULT, private clockFrequency: number = DEFAULT_CLOCK_FREQUENCY) {
        super();

        // Determine the block size
        this.blockSize = this.transport.packetSize - BLOCK_HEADER_SIZE - 1; // -1 for the DAP_TRANSFER_BLOCK command

        // Determine the operation count possible
        const operationSpace = this.transport.packetSize - TRANSFER_HEADER_SIZE - 1; // -1 for the DAP_TRANSFER command
        this.operationCount = Math.floor(operationSpace / TRANSFER_OPERATION_SIZE);
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

    /**
     * Switches the CMSIS-DAP unit to use SWD
     * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ddi0316d/Chdhfbhc.html
     */
    protected selectProtocol(protocol: DAPProtocol): Promise<void> {
        const sequence = protocol === DAPProtocol.JTAG ? JTAG_SEQUENCE : SWD_SEQUENCE;

        return this.swjSequence(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])) // Sequence of 1's
        .then(() => this.swjSequence(new Uint16Array([sequence]))) // Send protocol sequence
        .then(() => this.swjSequence(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]))) // Sequence of 1's
        .then(() => this.swjSequence(new Uint8Array([0x00])));
    }

    /**
     * Send a command
     * @param command Command to send
     * @param data Data to use
     * @returns Promise of DataView
     */
    protected send(command: number, data?: BufferSource): Promise<DataView> {
        const array = this.bufferSourceToUint8Array(command, data);

        return this.transport.write(array)
        .then(() => this.transport.read())
        .then(response => {
            if (response.getUint8(0) !== command) {
                throw new Error(`Bad response for ${command} -> ${response.getUint8(0)}`);
            }

            switch (command) {
                case DAPCommand.DAP_DISCONNECT:
                case DAPCommand.DAP_WRITE_ABORT:
                case DAPCommand.DAP_DELAY:
                case DAPCommand.DAP_RESET_TARGET:
                case DAPCommand.DAP_SWJ_CLOCK:
                case DAPCommand.DAP_SWJ_SEQUENCE:
                case DAPCommand.DAP_SWD_CONFIGURE:
                case DAPCommand.DAP_SWD_SEQUENCE:
                case DAPCommand.DAP_SWO_TRANSPORT:
                case DAPCommand.DAP_SWO_MODE:
                case DAPCommand.DAP_SWO_CONTROL:
                case DAPCommand.DAP_JTAG_CONFIGURE:
                case DAPCommand.DAP_JTAG_ID_CODE:
                case DAPCommand.DAP_TRANSFER_CONFIGURE:
                    if (response.getUint8(1) !== DAPResponse.DAP_OK) {
                        throw new Error(`Bad status for ${command} -> ${response.getUint8(1)}`);
                    }
            }

            return response;
        });
    }

    /**
     * Get DAP information
     * @param request Type of information to get
     * @returns Promise of number or string
     */
    public dapInfo(request: DAPInfoRequest): Promise<number | string> {
        return this.send(DAPCommand.DAP_INFO, new Uint8Array([request]))
        .then(result => {
            const length = result.getUint8(1);

            if (length === 0) {
                throw new Error("DAP Info Failure");
            }

            switch (request) {
                case DAPInfoRequest.CAPABILITIES:
                case DAPInfoRequest.PACKET_COUNT:
                case DAPInfoRequest.PACKET_SIZE:
                case DAPInfoRequest.SWO_TRACE_BUFFER_SIZE:
                    // Byte
                    if (length === 1) return result.getUint8(2);

                    // Short
                    if (length === 2) return result.getUint16(2);

                    // Word
                    if (length === 4) return result.getUint32(2);
            }

            const ascii = Array.prototype.slice.call(new Uint8Array(result.buffer, 2, length));
            return String.fromCharCode.apply(null, ascii);
        });
    }

    /**
     * Send an SWJ Sequence
     * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__SWJ__Sequence.html
     * @param sequence The sequence to send
     * @returns Promise
     */
    public swjSequence(sequence: BufferSource): Promise<void> {
        const bitLength = sequence.byteLength * 8;
        const data = this.bufferSourceToUint8Array(bitLength, sequence);

        return this.send(DAPCommand.DAP_SWJ_SEQUENCE, data)
        .then(() => undefined);
    }

    /**
     * Configure Transfer
     * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__TransferConfigure.html
     * @param idleCycles Number of extra idle cycles after each transfer
     * @param waitRetry Number of transfer retries after WAIT response
     * @param matchRetry Number of retries on reads with Value Match in DAP_Transfer
     * @returns Promise
     */
    public configureTransfer(idleCycles: number, waitRetry: number, matchRetry: number): Promise<void> {
        const data = new Uint8Array(5);
        const view = new DataView(data.buffer);

        view.setUint8(0, idleCycles);
        view.setUint16(1, waitRetry, true);
        view.setUint16(3, matchRetry, true);

        return this.send(DAPCommand.DAP_TRANSFER_CONFIGURE, data)
        .then(() => undefined);
    }

    /**
     * Connect to target device
     * @returns Promise
     */
    public connect(): Promise<void> {
        return this.transport.open()
        .then(() => this.send(DAPCommand.DAP_SWJ_CLOCK, new Uint32Array([this.clockFrequency])))
        .then(() => this.send(DAPCommand.DAP_CONNECT, new Uint8Array([this.mode])))
        .then(result => {
            if (result.getUint8(1) === DAPConnectResponse.FAILED || this.mode !== DAPProtocol.DEFAULT && result.getUint8(1) !== this.mode) {
                throw new Error("Mode not enabled.");
            }
        })
        .then(() => this.configureTransfer(0, 100, 0))
        .then(() => this.selectProtocol(DAPProtocol.SWD));
    }

    /**
     * Disconnect from target device
     * @returns Promise
     */
    public disconnect(): Promise<void> {
        return this.send(DAPCommand.DAP_DISCONNECT)
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
        .then(() => this.connect());
    }

    /**
     * Reset target device
     * @returns Promise of whether a device specific reset sequence is implemented
     */
    public reset(): Promise<boolean> {
        return this.send(DAPCommand.DAP_RESET_TARGET)
        .then(response => response.getUint8(2) === DAPResetTargeResponse.RESET_SEQUENCE);
    }

    /**
     * Transfer data with a single read or write operation
     * @param port Port type (debug port or access port)
     * @param mode Whether to read or write
     * @param register The register to use
     * @param value Any value to write
     * @returns Promise of any value read
     */
    public transfer(port: DAPPort, mode: DAPTransferMode, register: number, value?: number): Promise<number>;
    /**
     * Transfer data with multiple read or write operations
     * @param operations The operations to use
     * @returns Promise of any values read
     */
    public transfer(operations: DAPOperation[]): Promise<Uint32Array>;
    public transfer(portOrOps: DAPPort | DAPOperation[], mode: DAPTransferMode = DAPTransferMode.READ, register: number = 0, value: number = 0): Promise<number | Uint32Array> {

        let operations: DAPOperation[];

        if (typeof portOrOps === "number") {
            operations = [{
                port: portOrOps,
                mode,
                register,
                value
            }];
        } else {
            operations = portOrOps;
        }

        const data = new Uint8Array(TRANSFER_HEADER_SIZE + (operations.length * TRANSFER_OPERATION_SIZE));
        const view = new DataView(data.buffer);

        // DAP Index, ignored for SWD
        view.setUint8(0, 0);
        // Transfer count
        view.setUint8(1, operations.length);

        operations.forEach((operation, index) => {
            const offset = TRANSFER_HEADER_SIZE + (index * TRANSFER_OPERATION_SIZE);

            // Transfer request
            view.setUint8(offset, operation.port | operation.mode | operation.register);
            // Transfer data
            view.setUint32(offset + 1, operation.value || 0, true);
        });

        return this.send(DAPCommand.DAP_TRANSFER, data)
        .then(result => {

            // Transfer count
            if (result.getUint8(1) !== operations.length) {
                throw new Error("Transfer count mismatch");
            }

            // Transfer response
            const response = result.getUint8(2);
            if (response === DAPTransferResponse.WAIT) {
                throw new Error("Transfer response WAIT");
            }
            if (response === DAPTransferResponse.FAULT) {
                throw new Error("Transfer response FAULT");
            }
            if (response === DAPTransferResponse.PROTOCOL_ERROR) {
                throw new Error("Transfer response PROTOCOL_ERROR");
            }
            if (response === DAPTransferResponse.VALUE_MISMATCH) {
                throw new Error("Transfer response VALUE_MISMATCH");
            }
            if (response === DAPTransferResponse.NO_ACK) {
                throw new Error("Transfer response NO_ACK");
            }

            if (typeof portOrOps === "number") {
                return result.getUint32(3, true);
            }

            const length = operations.length * 4;
            return new Uint32Array(result.buffer.slice(3, 3 + length));
        });
    }

    /**
     * Read a block of data from a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @returns Promise of values read
     */
    public transferBlock(port: DAPPort, register: number, count: number): Promise<Uint32Array>;
    /**
     * Write a block of data to a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @param values The values to write
     * @returns Promise
     */
    public transferBlock(port: DAPPort, register: number, values: Uint32Array): Promise<undefined>;
    public transferBlock(port: DAPPort, register: number, countOrValues: number | Uint32Array): Promise<Uint32Array | undefined> {

        let operationCount: number;
        let mode: DAPTransferMode;
        let dataSize = BLOCK_HEADER_SIZE;

        if (typeof countOrValues === "number") {
            operationCount = countOrValues;
            mode = DAPTransferMode.READ;
        } else {
            operationCount = countOrValues.length;
            mode = DAPTransferMode.WRITE;
            dataSize += countOrValues.byteLength;
        }

        const data = new Uint8Array(dataSize);
        const view = new DataView(data.buffer);

        // DAP Index, ignored for SWD
        view.setUint8(0, 0);
        // Transfer count
        view.setUint16(1, operationCount, true);
        // Transfer request
        view.setUint8(3, port | mode | register);

        if (typeof countOrValues !== "number") {
            // Transfer data
            data.set(countOrValues, BLOCK_HEADER_SIZE);
        }

        return this.send(DAPCommand.DAP_TRANSFER_BLOCK, view)
        .then(result => {

            // Transfer count
            if (result.getUint16(1, true) !== operationCount) {
                throw new Error("Transfer count mismatch");
            }

            // Transfer response
            const response = result.getUint8(3);
            if (response & DAPTransferResponse.WAIT) {
                throw new Error("Transfer response WAIT");
            }
            if (response & DAPTransferResponse.FAULT) {
                throw new Error("Transfer response FAULT");
            }
            if (response & DAPTransferResponse.PROTOCOL_ERROR) {
                throw new Error("Transfer response PROTOCOL_ERROR");
            }
            if (response & DAPTransferResponse.NO_ACK) {
                throw new Error("Transfer response NO_ACK");
            }

            if (typeof countOrValues === "number") {
                return new Uint32Array(result.buffer.slice(4));
            }

            return undefined;
        });
    }
}
