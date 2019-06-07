import { Device } from "node-hid";
import { Transport } from "./";
/**
 * HID Transport class
 */
export declare class HID implements Transport {
    private os;
    private path;
    private device?;
    readonly packetSize = 64;
    /**
     * HID constructor
     * @param path Path to HID device to use
     */
    constructor(deviceOrPath: Device | string);
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
