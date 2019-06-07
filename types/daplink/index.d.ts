import { CmsisDAP, Proxy } from "../proxy";
/**
 * DAPLink Class
 */
export declare class DAPLink extends CmsisDAP implements Proxy {
    /**
     * Progress event
     * @event
     */
    static EVENT_PROGRESS: string;
    /**
     * Serial read event
     * @event
     */
    static EVENT_SERIAL_DATA: string;
    private timer?;
    /**
     * Detect if buffer contains text or binary data
     */
    private isBufferBinary;
    private writeBuffer;
    /**
     * Flash the target
     * @param buffer The image to flash
     * @param pageSize The page size to use (defaults to 62)
     * @returns Promise
     */
    flash(buffer: BufferSource, pageSize?: number): Promise<void>;
    /**
     * Get the serial baud rate setting
     * @returns Promise of baud rate
     */
    getSerialBaudrate(): Promise<number>;
    /**
     * Set the serial baud rate setting
     * @param baudrate The baudrate to use (defaults to 9600)
     * @returns Promise
     */
    setSerialBaudrate(baudrate?: number): Promise<void>;
    /**
     * Start listening for serial data
     * @param serialDelay The serial delay to use (defaults to 200)
     */
    startSerialRead(serialDelay?: number): void;
    /**
     * Stop listening for serial data
     */
    stopSerialRead(): void;
    /**
     * Write serial data
     * @param data The data to write
     * @returns Promise
     */
    serialWrite(data: string): Promise<void>;
}
export * from "./enums";
