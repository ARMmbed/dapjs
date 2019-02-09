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

import { Transport } from "./";

/**
 * @hidden
 */
const DEFAULT_CONFIGURATION = 1;
/**
 * @hidden
 */
const DEFAULT_CLASS = 0xFF;

/**
 * @hidden
 */
const GET_REPORT = 0x01;
/**
 * @hidden
 */
const SET_REPORT = 0x09;
/**
 * @hidden
 */
const OUT_REPORT = 0x200;
/**
 * @hidden
 */
const IN_REPORT = 0x100;

/**
 * WebUSB Transport class
 * https://wicg.github.io/webusb/
 */
export class WebUSB implements Transport {

    private interfaceNumber?: number;
    public readonly packetSize = 64;

    /**
     * WebUSB constructor
     * @param device WebUSB device to use
     * @param interfaceClass Optional interface class to use (default: 0xFF)
     * @param configuration Optional Configuration to use (default: 1)
     */
    constructor(private device: USBDevice, private interfaceClass = DEFAULT_CLASS, private configuration = DEFAULT_CONFIGURATION) {
    }

    private extendBuffer(data: BufferSource, packetSize: number): BufferSource {
        function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
            return (source as ArrayBufferView).buffer !== undefined;
        }

        const arrayBuffer = isView(data) ? data.buffer : data;
        const length = Math.min(arrayBuffer.byteLength, packetSize);

        const result = new Uint8Array(length);
        result.set(new Uint8Array(arrayBuffer));

        return result;
    }

    /**
     * Open device
     * @returns Promise
     */
    public open(): Promise<void> {
        return this.device.open()
        .then(() => this.device.selectConfiguration(this.configuration))
        .then(() => {
            const interfaces = this.device.configuration!.interfaces.filter(iface => {
                return iface.alternates[0].interfaceClass === this.interfaceClass;
            });

            if (!interfaces.length) {
                throw new Error("No valid interfaces found.");
            }

            this.interfaceNumber = interfaces[0].interfaceNumber;
            return this.device.claimInterface(this.interfaceNumber);
        });
    }

    /**
     * Close device
     * @returns Promise
     */
    public close(): Promise<void> {
        return this.device.close();
    }

    /**
     * Read from device
     * @returns Promise of DataView
     */
    public read(): Promise<DataView> {
        if (!this.interfaceNumber) return Promise.reject("No device opened");

        return this.device.controlTransferIn(
            {
                requestType: "class",
                recipient: "interface",
                request: GET_REPORT,
                value: IN_REPORT,
                index: this.interfaceNumber
            },
            this.packetSize
        )
        .then(result => result.data!);
    }

    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    public write(data: BufferSource): Promise<void> {
        if (!this.interfaceNumber) return Promise.reject("No device opened");

        const buffer = this.extendBuffer(data, this.packetSize);

        return this.device.controlTransferOut(
            {
                requestType: "class",
                recipient: "interface",
                request: SET_REPORT,
                value: OUT_REPORT,
                index: this.interfaceNumber
            },
            buffer
        )
        .then(() => undefined);
    }
}
