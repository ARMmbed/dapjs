/**
 * DAP interface
 */
export interface DAP {
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
     * @param register ID of register to read
     * @returns Promise of register value
     */
    readDP(register: number): Promise<number>;
    /**
     * Write to a debug port register
     * @param register ID of register to write
     * @param value Value to write
     * @returns Promise
     */
    writeDP(register: number, value: number): Promise<void>;
    /**
     * Read from an access port register
     * @param register ID of register to read
     * @returns Promise of register value
     */
    readAP(register: number): Promise<number>;
    /**
     * Write to an access port register
     * @param register ID of register to write
     * @param value Value to write
     * @returns Promise
     */
    writeAP(register: number, value: number): Promise<void>;
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
export * from './adi';
export * from './enums';
