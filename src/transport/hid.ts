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

import { platform } from "os";
import { HID as nodeHID, Device } from "node-hid";
import { Transport } from "./";

/**
 * HID Transport class
 */
export class HID implements Transport {

    private os: string = platform();
    private path: string;
    private device?: nodeHID;
    public readonly packetSize = 64;

    /**
     * HID constructor
     * @param path Path to HID device to use
     */
    constructor(deviceOrPath: Device | string) {
        function isDevice(source: Device | string): source is Device {
            return (source as Device).path !== undefined;
        }

        this.path = isDevice(deviceOrPath) ? deviceOrPath.path! : deviceOrPath;
    }

    /**
     * Open device
     * @returns Promise
     */
    public open(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.path.length) {
                return reject("No path specified");
            }

            try {
                const hid = require("node-hid");
                this.device = new hid.HID(this.path);
                resolve();
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * Close device
     * @returns Promise
     */
    public close(): Promise<void> {
        return new Promise((resolve, _reject) => {
            if (this.device) {
                this.device.close();
            }

            resolve();
        });
    }

    /**
     * Read from device
     * @returns Promise of DataView
     */
    public read(): Promise<DataView> {
        return new Promise((resolve, reject) => {
            if (!this.device) return reject("No device opened");

            this.device.read((error: string, data: number[]) => {
                if (error) {
                    return reject(error);
                }

                const buffer = new Uint8Array(data).buffer;
                resolve(new DataView(buffer));
            });
        });
    }

    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    public write(data: BufferSource): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.device) return reject("No device opened");

            function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
                return (source as ArrayBufferView).buffer !== undefined;
            }

            const arrayBuffer = isView(data) ? data.buffer : data;
            const array = Array.prototype.slice.call(new Uint8Array(arrayBuffer));

            // Pad to packet size
            while (array.length < this.packetSize) array.push(0);

            // Windows requires the prepend of an extra byte
            // https://github.com/node-hid/node-hid/blob/master/README.md#prepend-byte-to-hid_write
            if (this.os === "win32") {
                array.unshift(0);  // prepend throwaway byte
            }

            const bytesWritten = this.device.write(array);
            if (bytesWritten !== array.length) return reject("Incorrect bytecount written");

            resolve();
        });
    }
}
