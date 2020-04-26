/// <reference types="w3c-web-usb" />
import { Transport } from './';
/**
 * WebUSB Transport class
 * https://wicg.github.io/webusb/
 */
export declare class WebUSB implements Transport {
    private device;
    private interfaceClass;
    private configuration;
    private alwaysControlTransfer;
    private interfaceNumber?;
    private endpointIn?;
    private endpointOut?;
    readonly packetSize = 64;
    /**
     * WebUSB constructor
     * @param device WebUSB device to use
     * @param interfaceClass Optional interface class to use (default: 0xFF)
     * @param configuration Optional Configuration to use (default: 1)
     * @param alwaysControlTransfer Whether to always use control transfer instead of endpoints (default: false)
     */
    constructor(device: USBDevice, interfaceClass?: number, configuration?: number, alwaysControlTransfer?: boolean);
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
