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

import type { Device, InEndpoint, OutEndpoint} from 'usb';
import { Transport } from './';

/**
 * @hidden
 */
const LIBUSB_REQUEST_TYPE_CLASS = (0x01 << 5);
/**
 * @hidden
 */
const LIBUSB_RECIPIENT_INTERFACE = 0x01;
/**
 * @hidden
 */
const LIBUSB_ENDPOINT_OUT = 0x00;
/**
 * @hidden
 */
const LIBUSB_ENDPOINT_IN = 0x80;
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
 * USB Transport class
 */
export class USB implements Transport {

    private interfaceNumber?: number;
    private endpointIn?: InEndpoint;
    private endpointOut?: OutEndpoint;
    public readonly packetSize = 64;

    /**
     * USB constructor
     * @param device USB device to use
     * @param interfaceClass Optional interface class to use (default: 0xFF)
     * @param configuration Optional Configuration to use (default: 1)
     * @param alwaysControlTransfer Whether to always use control transfer instead of endpoints (default: false)
     */
    constructor(private device: Device, private interfaceClass = DEFAULT_CLASS, private configuration = DEFAULT_CONFIGURATION, private alwaysControlTransfer: boolean = false) {
    }

    private bufferToDataView(buffer: Buffer): DataView {
        const arrayBuffer = new Uint8Array(buffer).buffer;
        return new DataView(arrayBuffer);
    }

    private isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
        return (source as ArrayBufferView).buffer !== undefined;
    }

    private bufferSourceToBuffer(bufferSource: ArrayBuffer | ArrayBufferView): Buffer {
        const arrayBuffer = this.isView(bufferSource) ? bufferSource.buffer : bufferSource;
        return Buffer.from(arrayBuffer);
    }

    private extendBuffer(data: BufferSource, packetSize: number): BufferSource {
        const arrayBuffer = this.isView(data) ? data.buffer : data;
        const length = Math.min(arrayBuffer.byteLength, packetSize);

        const result = new Uint8Array(length);
        result.set(new Uint8Array(arrayBuffer));

        return result;
    }

    /**
     * Open device
     * @returns Promise
     */
    public async open(): Promise<void> {
        this.device.open();

        await new Promise((resolve, reject) => {
            this.device.setConfiguration(this.configuration, error => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve();
                }
            });
        });

        const interfaces = this.device.interfaces.filter(iface => {
            return iface.descriptor.bInterfaceClass === this.interfaceClass;
        });

        if (!interfaces.length) {
            throw new Error('No valid interfaces found.');
        }

        // Prefer interface with endpoints
        let selectedInterface = interfaces.find(iface => iface.endpoints.length > 0);

        // Otherwise use the first
        if (!selectedInterface) {
            selectedInterface = interfaces[0];
        }

        this.interfaceNumber = selectedInterface.interfaceNumber;

        // If we always want to use control transfer, don't find/set endpoints and claim interface
        if (!this.alwaysControlTransfer) {
            const endpoints = selectedInterface.endpoints;

            this.endpointIn = undefined;
            this.endpointOut = undefined;

            for (const endpoint of endpoints) {
                if (endpoint.direction === 'in' && !this.endpointIn) this.endpointIn = (endpoint as InEndpoint);
                else if (endpoint.direction === 'out' && !this.endpointOut) this.endpointOut = (endpoint as OutEndpoint);
            }

            // If endpoints are found, claim the interface
            if (this.endpointIn || this.endpointOut) {

                // If the interface can't be claimed, use control transfer
                try {
                    selectedInterface.claim();
                } catch (_e) {
                    this.endpointIn = undefined;
                    this.endpointOut = undefined;
                }
            }
        }
    }

    /**
     * Close device
     * @returns Promise
     */
    public async close(): Promise<void> {
        this.device.close();
    }

    /**
     * Read from device
     * @returns Promise of DataView
     */
    public async read(): Promise<DataView> {
        if (this.interfaceNumber === undefined) {
            throw new Error('No device opened');
        }

        const result = await new Promise<Buffer>((resolve, reject) => {
            // Use endpoint if it exists
            if (this.endpointIn) {
                this.endpointIn.transfer(this.packetSize, (exception, buffer) => {
                    if (exception) {
                        reject(exception);
                    } else {
                        resolve(buffer);
                    }
                });
                return;
            }

            // Fallback to using control transfer
            this.device.controlTransfer(
                LIBUSB_ENDPOINT_IN | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
                GET_REPORT,
                IN_REPORT,
                this.interfaceNumber!,
                this.packetSize,
                (exception, buffer) => {
                    if (exception) {
                        reject(exception);
                    } else if (!buffer) {
                        reject(new Error('No buffer read'));
                    } else {
                        resolve(buffer);
                    }
                }
            );
        });

        return this.bufferToDataView(result);
    }

    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    public async write(data: BufferSource): Promise<void> {
        if (this.interfaceNumber === undefined) {
            throw new Error('No device opened');
        }

        const extended = this.extendBuffer(data, this.packetSize);
        const buffer = this.bufferSourceToBuffer(extended);

        await new Promise((resolve, reject) => {
            // Use endpoint if it exists
            if (this.endpointOut) {
                this.endpointOut.transfer(buffer, exception => {
                    if (exception) {
                        return reject(exception);
                    } else {
                        resolve();
                    }
                });
                return;
            }

            // Fallback to using control transfer
            this.device.controlTransfer(
                LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE,
                SET_REPORT,
                OUT_REPORT,
                this.interfaceNumber!,
                buffer,
                exception => {
                    if (exception) {
                        return reject(exception);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}
