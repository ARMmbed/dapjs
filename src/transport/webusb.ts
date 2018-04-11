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

import { Transport } from "./index";

const DEFAULT_CLASS = 0xFF;
const PACKET_SIZE = 64;

const GET_REPORT = 0x01;
const SET_REPORT = 0x09;
const OUT_REPORT = 0x200;
const IN_REPORT = 0x100;

/**
 * WebUSB Transport class
 */
export class WebUSB implements Transport {

    private interface: USBInterface;
    private endpointIn: USBEndpoint;
    private endpointOut: USBEndpoint;

    /**
     * WebUSB constructor
     * @param device WebUSB device to use
     * @param interfaceClass Optional interface class to use
     */
    constructor(private device: USBDevice, private interfaceClass = DEFAULT_CLASS) {
    }

    private sliceBuffer(data: BufferSource, packetSize: number): BufferSource {
        function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
            return (source as ArrayBufferView).buffer !== undefined;
        }

        const arrayBuffer = isView(data) ? data.buffer : data;
        const length = Math.min(arrayBuffer.byteLength, packetSize);

        return arrayBuffer.slice(length);
    }

    /**
     * Open device
     * @returns Promise
     */
    public open(): Promise<void> {
        this.endpointIn = null;
        this.endpointOut = null;

        return this.device.open()
        .then(() => this.device.selectConfiguration(1))
        .then(() => {
            const interfaces = this.device.configuration.interfaces.filter(iface => {
                return iface.alternates[0].interfaceClass === this.interfaceClass;
            });

            if (!interfaces.length) {
                throw new Error("No HID interfaces found.");
            }

            this.interface = interfaces[0];
            return this.device.claimInterface(this.interface.interfaceNumber);
        })
        .then(() => {
            const endpoints = this.interface.alternates[0].endpoints;

            endpoints.forEach(endpoint => {
                if (endpoint.direction === "in") this.endpointIn = endpoint;
                else this.endpointOut = endpoint;
            });
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
        // Use the endpoint if it exists
        if (this.endpointIn) {
            const packetSize = this.endpointIn.packetSize;
            return this.device.transferIn(this.endpointIn.endpointNumber, packetSize)
            .then(result => result.data);
        }

        // Device does not have endpoint, use control transfer
        return this.device.controlTransferIn(
            {
                requestType: "class",
                recipient: "interface",
                request: GET_REPORT,
                value: IN_REPORT,
                index: this.interface.interfaceNumber
            },
            PACKET_SIZE
        )
        .then(result => result.data);
    }

    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    public write(data: BufferSource): Promise<any> {
        let buffer: BufferSource;

        // Use the endpoint if it exists
        if (this.endpointOut) {
            const packetSize = this.endpointOut.packetSize;
            buffer = this.sliceBuffer(data, packetSize);
            return this.device.transferOut(this.endpointOut.endpointNumber, buffer);
        }

        // Device does not have endpoint, use control transfer
        buffer = this.sliceBuffer(data, PACKET_SIZE);

        return this.device.controlTransferOut(
            {
                requestType: "class",
                recipient: "interface",
                request: SET_REPORT,
                value: OUT_REPORT,
                index: this.interface.interfaceNumber
            },
            buffer
        );
    }
}
