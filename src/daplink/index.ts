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

import { CmsisDAP, Proxy } from "../proxy";
import { DAPLinkFlash, DAPLinkSerial } from "./enums";

/**
 * @hidden
 */
const DEFAULT_BAUDRATE = 9600;
/**
 * @hidden
 */
const SERIAL_DELAY = 200;
/**
 * @hidden
 */
const PAGE_SIZE = 62;

/**
 * DAPLink Class
 */
export class DAPLink extends CmsisDAP implements Proxy {

    /**
     * Progress event
     * @event
     */
    public static EVENT_PROGRESS: string = "progress";

    /**
     * Serial read event
     * @event
     */
    public static EVENT_SERIAL_DATA: string = "serial";

    private timer: NodeJS.Timer = null;

    /**
     * Detect if buffer contains text or binary data
     */
    private isBufferBinary(buffer: ArrayBuffer): boolean {
        const bufferString: string = String.fromCharCode.apply(null, new Uint16Array(buffer, 0, 50));

        for (let i = 0; i < bufferString.length; i++) {
            const charCode = bufferString.charCodeAt(i);
            // 65533 is a code for unknown character
            // 0-8 are codes for control characters
            if (charCode === 65533 || charCode <= 8) {
                return true;
            }
        }
        return false;
    }

    private writeBuffer(buffer: ArrayBuffer, offset: number = 0): Promise<void> {
        const end = Math.min(buffer.byteLength, offset + PAGE_SIZE);
        const page = buffer.slice(offset, end);
        const data = new Uint8Array(page.byteLength + 1);

        data.set([page.byteLength]);
        data.set(new Uint8Array(page), 1);

        return this.send(DAPLinkFlash.WRITE, data)
        .then(() => {
            this.emit(DAPLink.EVENT_PROGRESS, offset / buffer.byteLength);
            if (end < buffer.byteLength) {
                return this.writeBuffer(buffer, end);
            }
        });
    }

    /**
     * Flash the target
     * @param buffer The image to flash
     * @returns Promise
     */
    public flash(buffer: BufferSource): Promise<void> {
        function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
            return (source as ArrayBufferView).buffer !== undefined;
        }

        const arrayBuffer = isView(buffer) ? buffer.buffer : buffer;
        const streamType = this.isBufferBinary(arrayBuffer) ? 0 : 1;

        return this.send(DAPLinkFlash.OPEN, new Uint32Array([streamType]))
        .then(result => {
            // An error occurred
            if (result.getUint8(1) !== 0) return;
            return this.writeBuffer(arrayBuffer);
        })
        .then(() => {
            this.emit(DAPLink.EVENT_PROGRESS, 1.0);
            return this.send(DAPLinkFlash.CLOSE);
        })
        .then(result => {
            // An error occurred
            if (result.getUint8(1) !== 0) return;
            return this.send(DAPLinkFlash.RESET);
        })
        .then(() => undefined);
    }

    /**
     * Get the serial baud rate setting
     * @returns Promise of baud rate
     */
    public getSerialBaudrate(): Promise<number> {
        return this.send(DAPLinkSerial.READ_SETTINGS)
        .then(result => {
            return result.getUint32(1, true);
        });
    }

    /**
     * Set the serial baud rate setting
     * @param baudrate The baudrate to use (defaults to 9600)
     * @returns Promise
     */
    public setSerialBaudrate(baudrate: number = DEFAULT_BAUDRATE): Promise<void> {
        return this.send(DAPLinkSerial.WRITE_SETTINGS, new Uint32Array([baudrate]))
        .then(() => undefined);
    }

    /**
     * Start listening for serial data
     */
    public startSerialRead() {
        this.stopSerialRead();
        this.timer = setInterval(() => {
            return this.send(DAPLinkSerial.READ)
            .then(serialData => {
                if (serialData.byteLength > 0) {
                    // check if there is any data returned from the device
                    if (serialData.getUint8(1) !== 0) {
                        const data = String.fromCharCode.apply(null, new Uint8Array(serialData.buffer.slice(1)));
                        this.emit(DAPLink.EVENT_SERIAL_DATA, data);
                    }
                }
            });
        }, SERIAL_DELAY);
    }

    /**
     * Stop listening for serial data
     */
    public stopSerialRead() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Write serial data
     * @param data The data to write
     * @returns Promise
     */
    public serialWrite(data: string): Promise<void> {
        const arrayData = data.split("").map((e: string) => e.charCodeAt(0));
        arrayData.unshift(arrayData.length);
        return this.send(DAPLinkSerial.WRITE, new Uint16Array(arrayData).buffer)
        .then(() => undefined);
    }
}
