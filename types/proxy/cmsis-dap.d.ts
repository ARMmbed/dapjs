/// <reference types="node" />
import { EventEmitter } from 'events';
import { Transport } from '../transport';
import { DAPPort, DAPTransferMode, DAPProtocol, DAPInfoRequest } from './enums';
import { Proxy, DAPOperation } from './';
/**
 * @hidden
 */
export declare const DEFAULT_CLOCK_FREQUENCY = 10000000;
/**
 * CMSIS-DAP class
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Commands__gr.html
 */
export declare class CmsisDAP extends EventEmitter implements Proxy {
    private transport;
    private mode;
    private clockFrequency;
    /**
     * Whether the device has been opened
     */
    connected: boolean;
    /**
     * The maximum DAPOperations which can be transferred
     */
    operationCount: number;
    /**
     * The maximum block size which can be transferred
     */
    blockSize: number;
    /**
     * CMSIS-DAP constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode?: DAPProtocol, clockFrequency?: number);
    private bufferSourceToUint8Array;
    /**
     * Switches the CMSIS-DAP unit to use SWD
     * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ddi0316d/Chdhfbhc.html
     */
    protected selectProtocol(protocol: DAPProtocol): Promise<void>;
    /**
     * Send a command
     * @param command Command to send
     * @param data Data to use
     * @returns Promise of DataView
     */
    protected send(command: number, data?: BufferSource): Promise<DataView>;
    /**
     * Get DAP information
     * @param request Type of information to get
     * @returns Promise of number or string
     */
    dapInfo(request: DAPInfoRequest): Promise<number | string>;
    /**
     * Send an SWJ Sequence
     * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__SWJ__Sequence.html
     * @param sequence The sequence to send
     * @returns Promise
     */
    swjSequence(sequence: BufferSource): Promise<void>;
    /**
     * Configure Transfer
     * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__TransferConfigure.html
     * @param idleCycles Number of extra idle cycles after each transfer
     * @param waitRetry Number of transfer retries after WAIT response
     * @param matchRetry Number of retries on reads with Value Match in DAP_Transfer
     * @returns Promise
     */
    configureTransfer(idleCycles: number, waitRetry: number, matchRetry: number): Promise<void>;
    /**
     * Connect to target device
     * @returns Promise
     */
    connect(): Promise<void>;
    /**
     * Disconnect from target device
     * @returns Promise
     */
    disconnect(): Promise<void>;
    /**
     * Reconnect to target device
     * @returns Promise
     */
    reconnect(): Promise<void>;
    /**
     * Reset target device
     * @returns Promise of whether a device specific reset sequence is implemented
     */
    reset(): Promise<boolean>;
    /**
     * Transfer data with a single read or write operation
     * @param port Port type (debug port or access port)
     * @param mode Whether to read or write
     * @param register The register to use
     * @param value Any value to write
     * @returns Promise of any value read
     */
    transfer(port: DAPPort, mode: DAPTransferMode, register: number, value?: number): Promise<number>;
    /**
     * Transfer data with multiple read or write operations
     * @param operations The operations to use
     * @returns Promise of any values read
     */
    transfer(operations: DAPOperation[]): Promise<Uint32Array>;
    /**
     * Read a block of data from a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @returns Promise of values read
     */
    transferBlock(port: DAPPort, register: number, count: number): Promise<Uint32Array>;
    /**
     * Write a block of data to a single register
     * @param port Port type (debug port or access port)
     * @param register The register to use
     * @param values The values to write
     * @returns Promise
     */
    transferBlock(port: DAPPort, register: number, values: Uint32Array): Promise<undefined>;
}
