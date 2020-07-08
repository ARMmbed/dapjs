import type { HID as nodeHID } from 'node-hid';
import { Transport } from './';
/**
 * HID Transport class
 */
export declare class HID implements Transport {
    private device;
    private os;
    readonly packetSize = 64;
    /**
     * HID constructor
     * @param path Path to HID device to use
     */
    constructor(device: nodeHID);
    /**
     * Open device
     * @returns Promise
     */
    open(): Promise<void>;
    /**
     * Close device
     * @returns Promise
     */
    close(): Promise<void>;
    /**
     * Read from device
     * @returns Promise of DataView
     */
    read(): Promise<DataView>;
    /**
     * Write to device
     * @param data Data to write
     * @returns Promise
     */
    write(data: BufferSource): Promise<void>;
}
