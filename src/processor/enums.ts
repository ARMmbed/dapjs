/*
* DAPjs
* Copyright Arm Limited 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/**
 * Processor Core States
 */
export const enum CoreState {
    /**
     * The core has been reset
     */
    RESET,
    /**
     * Core is running with a lockup condition
     */
    LOCKUP,
    /**
     * The core is sleeping
     */
    SLEEPING,
    /**
     * The core is in debug state
     */
    DEBUG,
    /**
     * The core is running
     */
    RUNNING
}

/**
 * Processor Core Registers
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100230_0004_00_en/way1435345987733.html
 */
export const enum CoreRegister {
    /**
     * General purpose register
     */
    R0 = 0,
    /**
     * General purpose register
     */
    R1 = 1,
    /**
     * General purpose register
     */
    R2 = 2,
    /**
     * General purpose register
     */
    R3 = 3,
    /**
     * General purpose register
     */
    R4 = 4,
    /**
     * General purpose register
     */
    R5 = 5,
    /**
     * General purpose register
     */
    R6 = 6,
    /**
     * General purpose register
     */
    R7 = 7,
    /**
     * General purpose register
     */
    R8 = 8,
    /**
     * General purpose register
     */
    R9 = 9,
    /**
     * General purpose register
     */
    R10 = 10,
    /**
     * General purpose register
     */
    R11 = 11,
    /**
     * General purpose register
     */
    R12 = 12,
    /**
     * Stack Pointer
     */
    SP = 13,
    /**
     * The Link Register
     */
    LR = 14,
    /**
     * The Program Counter
     */
    PC = 15,
    /**
     * The Program Status Register
     */
    PSR = 16,
    /**
     * Main Stack Pointer
     */
    MSP = 17,
    /**
     * Process Stack Pointer
     */
    PSP = 18,
    /**
     * Prevents activation of exceptions
     */
    PRIMASK = 20,
    /**
     * Controls the stack used
     */
    CONTROL = 20
}

/**
 * Debug Registers
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100165_0201_00_en/ric1417175947147.html
 */
export const enum DebugRegister {
    /**
     * Debug Fault Status Register
     */
    DFSR = 0xE000ED30,
    /**
     * Debug Halting Control and Status Register
     */
    DHCSR = 0xE000EDF0,
    /**
     * Debug Core Register Selector Register, write only
     */
    DCRSR = 0xE000EDF4,
    /**
     * Debug Core Register Data Register
     */
    DCRDR = 0xE000EDF8,
    /**
     * Debug Exception and Monitor Control Register
     */
    DEMCR = 0xE000EDFC
}

/**
 * NVIC Registers
 */
export const enum NvicRegister {
    /**
     * NVIC: Interrupt Controller Type Register
     */
    ICT = 0xE000E004,
    /**
     * NVIC: CPUID Base Register
     */
    CPUID = 0xE000ED00,
    /**
     * NVIC: Application Interrupt/Reset Control Register
     */
    AIRCR = 0xE000ED0C,
    /**
     * NVIC: Debug Fault Status Register
     */
    DFSR = 0xE000ED30
}

/**
 * NVIC: Application Interrupt/Reset Control Register
 * @hidden
 */
export const enum AircrMask {
    /**
     * Reset Cortex-M (except Debug)
     */
    VECTRESET = (1 << 0),
    /**
     * Clear Active Vector Bit
     */
    VECTCLRACTIVE = (1 << 1),
    /**
     * Reset System (except Debug)
     */
    SYSRESETREQ = (1 << 2),
    /**
     * Write Key
     */
    VECTKEY = 0x05FA0000
}

/**
 * Debug Halting Control and Status Register
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ddi0337e/CEGCJAHJ.html
 * @hidden
 */
export const enum DhcsrMask {
    /**
     * Enables debug
     */
    C_DEBUGEN = (1 << 0),
    /**
     * Halts the core
     */
    C_HALT = (1 << 1),
    /**
     * Steps the core in halted debug
     */
    C_STEP = (1 << 2),
    /**
     * Mask interrupts when stepping or running in halted debug
     */
    C_MASKINTS = (1 << 3),
    /**
     * Enables Halting debug to gain control
     */
    C_SNAPSTALL = (1 << 5),
    /**
     * Register Read/Write on the Debug Core Register Selector register is available
     */
    S_REGRDY = (1 << 16),
    /**
     * The core is in debug state
     */
    S_HALT = (1 << 17),
    /**
     * Indicates that the core is sleeping
     */
    S_SLEEP = (1 << 18),
    /**
     * Core is running (not halted) and a lockup condition is present
     */
    S_LOCKUP = (1 << 19),
    /**
     * An instruction has completed since last read
     */
    S_RETIRE_ST = (1 << 24),
    /**
     * The core has been reset
     */
    S_RESET_ST = (1 << 25),
    /**
     * Debug Key
     */
    DBGKEY = (0xA05F << 16)
}

/**
 * Debug Fault Status Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0413d/Cihdifbf.html
 * @hidden
 */
export const enum DfsrMask {
    /**
     * Halt request flag
     */
    HALTED = (1 << 0),
    /**
     * BKPT instruction or hardware breakpoint match
     */
    BKPT = (1 << 1),
    /**
     * Data Watchpoint (DW) flag
     */
    DWTTRAP = (1 << 2),
    /**
     * Vector catch occurred
     */
    VCATCH = (1 << 3),
    /**
     * External debug request (EDBGRQ) has halted the core
     */
    EXTERNAL = (1 << 4)
}

/**
 * Debug Core Register Selector Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/CEGIAJBH.html
 * @hidden
 */
export const enum DcrsrMask {
    /**
     * Register write or read, write is 1
     */
    REGWnR = (1 << 16),
    /**
     * Register select - DebugReturnAddress & PSR/Flags, Execution Number, and state information
     */
    REGSEL = 0x1F,
}

/**
 * Debug Exception and Monitor Control Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/CEGHJDCF.html
 * @hidden
 */
export const enum DemcrMask {
    /**
     * Reset Vector Catch
     */
    CORERESET = (1 << 0),
    /**
     * Debug Trap on MMU Fault
     */
    MMERR = (1 << 4),
    /**
     * Debug Trap on No Coprocessor Fault
     */
    NOCPERR = (1 << 5),
    /**
     * Debug Trap on Checking Error Fault
     */
    CHKERR = (1 << 6),
    /**
     * Debug Trap on State Error Fault
     */
    STATERR = (1 << 7),
    /**
     * Debug Trap on Bus Error Fault
     */
    BUSERR = (1 << 8),
    /**
     * Debug Trap on Interrupt Error Fault
     */
    INTERR = (1 << 9),
    /**
     * Debug Trap on Hard Fault
     */
    HARDERR = (1 << 10),
    /**
     * Monitor Enable
     */
    MON_EN = (1 << 16),
    /**
     * Monitor Pend
     */
    MON_PEND = (1 << 17),
    /**
     * Monitor Step
     */
    MON_STEP = (1 << 18),
    /**
     * Monitor Request
     */
    MON_REQ = (1 << 19),
    /**
     * Trace Enable
     */
    TRCENA = (1 << 24)
}

/**
 * Flash Patch and Breakpoint Registers
 * http://infocenter.arm.com/help/topic/com.arm.doc.100165_0201_00_en/ric1417175949176.html
 * @hidden
 */
export const enum FPBRegister {
    /**
     * FlashPatch Control Register
     */
    FP_CTRL = 0xE0002000,
    /**
     * FlashPatch Remap Register
     */
    FP_REMAP = 0xE0002004,
    /**
     * FlashPatch Comparator Register0
     */
    FP_COMP0 = 0xE0002008,
    /**
     * FlashPatch Comparator Register1
     */
    FP_COMP1 = 0xE000200C,
    /**
     * FlashPatch Comparator Register2
     */
    FP_COMP2 = 0xE0002010,
    /**
     * FlashPatch Comparator Register3
     */
    FP_COMP3 = 0xE0002014,
    /**
     * FlashPatch Comparator Register4
     */
    FP_COMP4 = 0xE0002018,
    /**
     * FlashPatch Comparator Register5
     */
    FP_COMP5 = 0xE000201C,
    /**
     * FlashPatch Comparator Register6
     */
    FP_COMP6 = 0xE0002020,
    /**
     * FlashPatch Comparator Register7
     */
    FP_COMP7 = 0xE0002024,
}

/**
 * Flash Patch and Breakpoint Control Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/ch11s04s01.html#BABCAFAG
 * @hidden
 */
export enum FPBCtrlMask {
    /**
     * Flash patch unit enable
     */
    ENABLE = (1 << 0),
    /**
     * Key field which enables writing to the Flash Patch Control Register
     */
    KEY = (1 << 1)
}
