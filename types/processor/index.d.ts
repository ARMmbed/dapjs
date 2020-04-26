import { DAP } from '../dap';
import { CoreRegister, CoreState } from './enums';
/**
 * Processor interface
 */
export interface Processor extends DAP {
    /**
     * Get the state of the processor core
     * @returns Promise of CoreState
     */
    getState(): Promise<CoreState>;
    /**
     * Whether the target is halted
     * @returns Promise of halted state
     */
    isHalted(): Promise<boolean>;
    /**
     * Halt the target
     * @param wait Wait until halted before returning
     * @param timeout Milliseconds to wait before aborting wait
     * @returns Promise
     */
    halt(wait?: boolean, timeout?: number): Promise<void>;
    /**
     * Resume a target
     * @param wait Wait until resumed before returning
     * @param timeout Milliseconds to wait before aborting wait
     * @returns Promise
     */
    resume(wait?: boolean, timeout?: number): Promise<void>;
    /**
     * Read from a core register
     * @param register The register to read
     * @returns Promise of value
     */
    readCoreRegister(register: CoreRegister): Promise<number>;
    /**
     * Read an array of core registers
     * @param registers The registers to read
     * @returns Promise of register values in an array
     */
    readCoreRegisters(registers: CoreRegister[]): Promise<number[]>;
    /**
     * Write to a core register
     * @param register The register to write to
     * @param value The value to write
     * @returns Promise
     */
    writeCoreRegister(register: CoreRegister, value: number): Promise<void>;
    /**
     * Exucute code at a specified memory address
     * @param address The address to put the code
     * @param code The code to use
     * @param stackPointer The stack pointer to use
     * @param programCounter The program counter to use
     * @param linkRegister The link register to use (defaults to address + 1)
     * @param registers Values to add to the general purpose registers, R0, R1, R2, etc.
     */
    execute(address: number, code: Uint32Array, stackPointer: number, programCounter: number, linkRegister?: number, ...registers: number[]): Promise<void>;
}
export * from './cortex-m';
export * from './enums';
