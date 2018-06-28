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

import {
    LIBUSB_REQUEST_TYPE_CLASS,
    LIBUSB_RECIPIENT_INTERFACE,
    LIBUSB_ENDPOINT_IN,
    LIBUSB_ENDPOINT_OUT,
    Device
} from "usb";
import { Transport } from "./";

/**
 * @hidden
 */
const DEFAULT_CLASS = 0xFF;
/**
 * @hidden
 */
const PACKET_SIZE = 64;

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
 * USB Transport class
 */
export class USB implements Transport {

    private interfaceNumber: number;

    /**
     * USB constructor
     * @param device USB device to use
     * @param interfaceClass Optional interface class to use
     */
    constructor(private device: Device, private interfaceClass = DEFAULT_CLASS) {
    }

    private bufferToDataView(buffer: Buffer): DataView {
        const arrayBuffer = new Uint8Array(buffer).buffer;
        return new DataView(arrayBuffer);
    }

    private bufferSourceToBuffer(bufferSource: ArrayBuffer | ArrayBufferView): Buffer {
        function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
            return (source as ArrayBufferView).buffer !== undefined;
        }

        const arrayBuffer = isView(bufferSource) ? bufferSource.buffer : bufferSource;
        return new Buffer(arrayBuffer);
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
        return new Promise((resolve, reject) => {
            this.device.open();
            this.device.setConfiguration(1, error => {
                if (error) return reject(error);
                const interfaces = this.device.interfaces.filter(iface => {
                    return iface.descriptor.bInterfaceClass === this.interfaceClass;
                });

                if (!interfaces.length) {
                    throw new Error("No HID interfaces found.");
                }

                // tslint:disable-next-line:no-string-literal
                this.interfaceNumber = interfaces[0]["interfaceNumber"];
                resolve();
            });
        });
    }

    /**
     * Close device
     * @returns Promise
     */
    public close(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.device.close();
            resolve();
        });
    }

    /**
     * Read from device
     * @returns Promise of DataView
     */
    public read(): Promise<DataView> {
        return new Promise((resolve, reject) => {
            this.device.controlTransfer(
                LIBUSB_ENDPOINT_IN | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
                GET_REPORT,
                IN_REPORT,
                this.interfaceNumber,
                PACKET_SIZE,
                (error, buffer) => {
                    if (error) return reject(error);
                    resolve(this.bufferToDataView(buffer));
                }
            );
        });
    }

    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    public write(data: BufferSource): Promise<any> {
        const buffer = this.extendBuffer(data, PACKET_SIZE);

        return new Promise((resolve, reject) => {
            this.device.controlTransfer(
                LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
                SET_REPORT,
                OUT_REPORT,
                this.interfaceNumber,
                this.bufferSourceToBuffer(buffer),
                (error: string) => {
                    if (error) return reject(error);
                    resolve();
                }
            );
        });
    }
}
