import type { Device } from 'usb';
import { Transport } from './';
/**
 * USB Transport class
 */
export declare class USB implements Transport {
    private device;
    private interfaceClass;
    private configuration;
    private alwaysControlTransfer;
    private interfaceNumber?;
    private endpointIn?;
    private endpointOut?;
    readonly packetSize = 64;
    /**
     * USB constructor
     * @param device USB device to use
     * @param interfaceClass Optional interface class to use (default: 0xFF)
     * @param configuration Optional Configuration to use (default: 1)
     * @param alwaysControlTransfer Whether to always use control transfer instead of endpoints (default: false)
     */
    constructor(device: Device, interfaceClass?: number, configuration?: number, alwaysControlTransfer?: boolean);
    private bufferToDataView;
    private isView;
    private bufferSourceToBuffer;
    private extendBuffer;
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
