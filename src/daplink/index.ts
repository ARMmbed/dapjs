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

import { TextDecoder } from './text-decoder';
import { CmsisDAP, DAPProtocol, DEFAULT_CLOCK_FREQUENCY } from '../proxy';
import { Transport } from '../transport';
import { DAPLinkFlash, DAPLinkSerial } from './enums';

/**
 * @hidden
 */
const DEFAULT_BAUDRATE = 9600;
/**
 * @hidden
 */
const DEFAULT_SERIAL_DELAY = 100;
/**
 * @hidden
 */
const DEFAULT_PAGE_SIZE = 62;

/**
 * @hidden
 */
const decoder = new TextDecoder();

/**
 * DAPLink Class
 */
export class DAPLink extends CmsisDAP {

    /**
     * Progress event
     * @event
     */
    public static EVENT_PROGRESS: string = 'progress';

    /**
     * Serial read event
     * @event
     */
    public static EVENT_SERIAL_DATA: string = 'serial';

    /**
     * @hidden
     */
    protected serialPolling = false;

    /**
     * @hidden
     */
    protected serialListeners = false;

    /**
     * DAPLink constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode: DAPProtocol = DAPProtocol.DEFAULT, clockFrequency: number = DEFAULT_CLOCK_FREQUENCY) {
        super(transport, mode, clockFrequency);

        this.on('newListener', async event => {
            if (event === DAPLink.EVENT_SERIAL_DATA) {
                const listenerCount = this.listenerCount(event);

                if (listenerCount === 0) {
                    this.serialListeners = true;
                }
            }
        });

        this.on('removeListener', event => {
            if (event === DAPLink.EVENT_SERIAL_DATA) {
                const listenerCount = this.listenerCount(event);

                if (listenerCount === 0) {
                    this.serialListeners = false;
                }
            }
        });
    }

    /**
     * Detect if buffer contains text or binary data
     */
    private isBufferBinary(buffer: ArrayBuffer): boolean {
        const numberArray = Array.prototype.slice.call(new Uint16Array(buffer, 0, 50));
        const bufferString: string = String.fromCharCode.apply(null, numberArray);

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

    private async writeBuffer(buffer: ArrayBuffer, pageSize: number, offset: number = 0): Promise<void> {
        const end = Math.min(buffer.byteLength, offset + pageSize);
        const page = buffer.slice(offset, end);
        const data = new Uint8Array(page.byteLength + 1);

        data.set([page.byteLength]);
        data.set(new Uint8Array(page), 1);

        try {
            await this.send(DAPLinkFlash.WRITE, data);
        } catch (error) {
            await this.clearAbort();
            throw error;
        }

        this.emit(DAPLink.EVENT_PROGRESS, offset / buffer.byteLength);
        if (end < buffer.byteLength) {
            return this.writeBuffer(buffer, pageSize, end);
        }
    }

    /**
     * Flash the target
     * @param buffer The image to flash
     * @param pageSize The page size to use (defaults to 62)
     * @returns Promise
     */
    public async flash(buffer: BufferSource, pageSize: number = DEFAULT_PAGE_SIZE): Promise<void> {
        const isView = (source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView => {
            return (source as ArrayBufferView).buffer !== undefined;
        };

        const arrayBuffer = isView(buffer) ? buffer.buffer : buffer;
        const streamType = this.isBufferBinary(arrayBuffer) ? 0 : 1;

        try {
            let result = await this.send(DAPLinkFlash.OPEN, new Uint32Array([streamType]));

            // An error occurred
            if (result.getUint8(1) !== 0) {
                throw new Error('Flash error');
            }

            await this.writeBuffer(arrayBuffer, pageSize);
            this.emit(DAPLink.EVENT_PROGRESS, 1.0);
            result = await this.send(DAPLinkFlash.CLOSE);

            // An error occurred
            if (result.getUint8(1) !== 0) {
                throw new Error('Flash error');
            }

            await this.send(DAPLinkFlash.RESET);
        } catch (error) {
            await this.clearAbort();
            throw error;
        }
    }

    /**
     * Get the serial baud rate setting
     * @returns Promise of baud rate
     */
    public async getSerialBaudrate(): Promise<number> {
        try {
            const result = await this.send(DAPLinkSerial.READ_SETTINGS);
            return result.getUint32(1, true);
        } catch (error) {
            await this.clearAbort();
            throw error;
        }
    }

    /**
     * Set the serial baud rate setting
     * @param baudrate The baudrate to use (defaults to 9600)
     * @returns Promise
     */
    public async setSerialBaudrate(baudrate: number = DEFAULT_BAUDRATE): Promise<void> {
        try {
            await this.send(DAPLinkSerial.WRITE_SETTINGS, new Uint32Array([baudrate]));
        } catch (error) {
            await this.clearAbort();
            throw error;
        }
    }

    /**
     * Write serial data
     * @param data The data to write
     * @returns Promise
     */
    public async serialWrite(data: string): Promise<void> {
        const arrayData = data.split('').map((e: string) => e.charCodeAt(0));
        arrayData.unshift(arrayData.length);
        try {
            await this.send(DAPLinkSerial.WRITE, new Uint8Array(arrayData).buffer);
        } catch (error) {
            await this.clearAbort();
            throw error;
        }
    }

    /**
     * Read serial data
     * @returns Promise of any arrayBuffer read
     */
    public async serialRead(): Promise<ArrayBuffer | undefined> {
        try {
            const serialData = await this.send(DAPLinkSerial.READ);
            // Check if there is any data returned from the device
            if (serialData.byteLength === 0) {
                return undefined;
            }

            // First byte contains the vendor code
            if (serialData.getUint8(0) !== DAPLinkSerial.READ) {
                return undefined;
            }

            // Second byte contains the actual length of data read from the device
            const dataLength = serialData.getUint8(1);
            if (dataLength === 0) {
                return undefined;
            }

            const offset = 2;
            return serialData.buffer.slice(offset, offset + dataLength);
        } catch (error) {
            await this.clearAbort();
            throw error;
        }
    }

    /**
     * Start listening for serial data
     * @param serialDelay The serial delay to use (default 100)
     * @param autoConnect whether to automatically connect to the target (default true)
     */
    public async startSerialRead(serialDelay: number = DEFAULT_SERIAL_DELAY, autoConnect = true) {
        this.serialPolling = true;

        while (this.serialPolling) {

            // Don't read serial output unless we have event listeners
            if (this.serialListeners) {

                // Remember connection state
                const connectedState = this.connected;

                if (this.connected === false && autoConnect === true) {
                    await this.connect();
                }

                const serialData = await this.serialRead();

                // Put state back
                if (connectedState === false && autoConnect === true) {
                    await this.disconnect();
                }

                if (serialData !== undefined) {
                    const data = decoder.decode(serialData);
                    this.emit(DAPLink.EVENT_SERIAL_DATA, data);
                }
            }

            await new Promise(resolve => setTimeout(resolve, serialDelay));
        }
    }

    /**
     * Stop listening for serial data
     */
    public stopSerialRead() {
        this.serialPolling = false;
    }
}

export * from './enums';
