import { CmsisDAP, DAPProtocol } from '../proxy';
import { Transport } from '../transport';
/**
 * DAPLink Class
 */
export declare class DAPLink extends CmsisDAP {
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
    /**
     * @hidden
     */
    protected serialPolling: boolean;
    /**
     * @hidden
     */
    protected serialListeners: boolean;
    /**
     * DAPLink constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode?: DAPProtocol, clockFrequency?: number);
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
     * Write serial data
     * @param data The data to write
     * @returns Promise
     */
    serialWrite(data: string): Promise<void>;
    /**
     * Read serial data
     * @returns Promise of any arrayBuffer read
     */
    serialRead(): Promise<ArrayBuffer | undefined>;
    /**
     * Start listening for serial data
     * @param serialDelay The serial delay to use (default 100)
     * @param autoConnect whether to automatically connect to the target (default true)
     */
    startSerialRead(serialDelay?: number, autoConnect?: boolean): Promise<void>;
    /**
     * Stop listening for serial data
     */
    stopSerialRead(): void;
}
export * from './enums';
