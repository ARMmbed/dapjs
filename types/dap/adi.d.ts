import { Transport } from '../transport';
import { Proxy, DAPOperation } from '../proxy';
import { DPRegister, APRegister } from './enums';
import { DAP } from './';
import { DAPProtocol } from '../proxy/enums';
/**
 * Arm Debug Interface class
 */
export declare class ADI implements DAP {
    private selectedAddress?;
    private cswValue?;
    private proxy;
    /**
     * ADI constructor
     * @param transport Debug transport to use
     * @param mode Debug mode to use (default 0)
     * @param clockFrequency Communication clock frequency to use (default 10000000)
     */
    constructor(transport: Transport, mode?: DAPProtocol, clockFrequency?: number);
    /**
     * ADI constructor
     * @param proxy Proxy to use
     */
    constructor(proxy: Proxy);
    /**
     * Continually run a function until it returns true
     * @param fn The function to run
     * @param timeout Optional timeout to wait before giving up and throwing
     * @param timer The milliseconds to wait between each run
     * @returns Promise
     */
    protected waitDelay(fn: () => Promise<boolean>, timeout?: number, timer?: number): Promise<void>;
    protected concatTypedArray(arrays: Uint32Array[]): Uint32Array;
    protected readDPCommand(register: number): DAPOperation[];
    protected writeDPCommand(register: number, value: number): DAPOperation[];
    protected readAPCommand(register: number): DAPOperation[];
    protected writeAPCommand(register: number, value: number): DAPOperation[];
    protected readMem16Command(register: number): DAPOperation[];
    protected writeMem16Command(register: number, value: number): DAPOperation[];
    protected readMem32Command(register: number): DAPOperation[];
    protected writeMem32Command(register: number, value: number): DAPOperation[];
    protected transferSequence(operations: DAPOperation[][]): Promise<Uint32Array>;
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
     * @returns Promise
     */
    reset(): Promise<boolean>;
    /**
     * Read from a debug port register
     * @param register DP register to read
     * @returns Promise of register value
     */
    readDP(register: DPRegister): Promise<number>;
    /**
     * Write to a debug port register
     * @param register DP register to write
     * @param value Value to write
     * @returns Promise
     */
    writeDP(register: DPRegister, value: number): Promise<void>;
    /**
     * Read from an access port register
     * @param register AP register to read
     * @returns Promise of register value
     */
    readAP(register: APRegister): Promise<number>;
    /**
     * Write to an access port register
     * @param register AP register to write
     * @param value Value to write
     * @returns Promise
     */
    writeAP(register: APRegister, value: number): Promise<void>;
    /**
     * Read a 16-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    readMem16(register: number): Promise<number>;
    /**
     * Write a 16-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeMem16(register: number, value: number): Promise<void>;
    /**
     * Read a 32-bit word from a memory access port register
     * @param register ID of register to read
     * @returns Promise of register data
     */
    readMem32(register: number): Promise<number>;
    /**
     * Write a 32-bit word to a memory access port register
     * @param register ID of register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeMem32(register: number, value: number): Promise<void>;
    /**
     * Read a block of 32-bit words from a memory access port register
     * @param register ID of register to read from
     * @param count The count of values to read
     * @returns Promise of register data
     */
    readBlock(register: number, count: number): Promise<Uint32Array>;
    /**
     * Write a block of 32-bit words to a memory access port register
     * @param register ID of register to write to
     * @param values The values to write
     * @returns Promise
     */
    writeBlock(register: number, values: Uint32Array): Promise<void>;
}
