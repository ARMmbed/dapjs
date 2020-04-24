/**
 * Processor Core States
 */
export declare const enum CoreState {
    /**
     * The core has been reset
     */
    RESET = 0,
    /**
     * Core is running with a lockup condition
     */
    LOCKUP = 1,
    /**
     * The core is sleeping
     */
    SLEEPING = 2,
    /**
     * The core is in debug state
     */
    DEBUG = 3,
    /**
     * The core is running
     */
    RUNNING = 4
}
/**
 * Processor Core Registers
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100230_0004_00_en/way1435345987733.html
 */
export declare const enum CoreRegister {
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
export declare const enum DebugRegister {
    /**
     * Debug Fault Status Register
     */
    DFSR = 3758157104,
    /**
     * Debug Halting Control and Status Register
     */
    DHCSR = 3758157296,
    /**
     * Debug Core Register Selector Register, write only
     */
    DCRSR = 3758157300,
    /**
     * Debug Core Register Data Register
     */
    DCRDR = 3758157304,
    /**
     * Debug Exception and Monitor Control Register
     */
    DEMCR = 3758157308
}
/**
 * NVIC Registers
 */
export declare const enum NvicRegister {
    /**
     * NVIC: Interrupt Controller Type Register
     */
    ICT = 3758153732,
    /**
     * NVIC: CPUID Base Register
     */
    CPUID = 3758157056,
    /**
     * NVIC: Application Interrupt/Reset Control Register
     */
    AIRCR = 3758157068,
    /**
     * NVIC: Debug Fault Status Register
     */
    DFSR = 3758157104
}
/**
 * NVIC: Application Interrupt/Reset Control Register
 * @hidden
 */
export declare const enum AircrMask {
    /**
     * Reset Cortex-M (except Debug)
     */
    VECTRESET = 1,
    /**
     * Clear Active Vector Bit
     */
    VECTCLRACTIVE = 2,
    /**
     * Reset System (except Debug)
     */
    SYSRESETREQ = 4,
    /**
     * Write Key
     */
    VECTKEY = 100270080
}
/**
 * Debug Halting Control and Status Register
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ddi0337e/CEGCJAHJ.html
 * @hidden
 */
export declare const enum DhcsrMask {
    /**
     * Enables debug
     */
    C_DEBUGEN = 1,
    /**
     * Halts the core
     */
    C_HALT = 2,
    /**
     * Steps the core in halted debug
     */
    C_STEP = 4,
    /**
     * Mask interrupts when stepping or running in halted debug
     */
    C_MASKINTS = 8,
    /**
     * Enables Halting debug to gain control
     */
    C_SNAPSTALL = 32,
    /**
     * Register Read/Write on the Debug Core Register Selector register is available
     */
    S_REGRDY = 65536,
    /**
     * The core is in debug state
     */
    S_HALT = 131072,
    /**
     * Indicates that the core is sleeping
     */
    S_SLEEP = 262144,
    /**
     * Core is running (not halted) and a lockup condition is present
     */
    S_LOCKUP = 524288,
    /**
     * An instruction has completed since last read
     */
    S_RETIRE_ST = 16777216,
    /**
     * The core has been reset
     */
    S_RESET_ST = 33554432,
    /**
     * Debug Key
     */
    DBGKEY = -1604386816
}
/**
 * Debug Fault Status Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0413d/Cihdifbf.html
 * @hidden
 */
export declare const enum DfsrMask {
    /**
     * Halt request flag
     */
    HALTED = 1,
    /**
     * BKPT instruction or hardware breakpoint match
     */
    BKPT = 2,
    /**
     * Data Watchpoint (DW) flag
     */
    DWTTRAP = 4,
    /**
     * Vector catch occurred
     */
    VCATCH = 8,
    /**
     * External debug request (EDBGRQ) has halted the core
     */
    EXTERNAL = 16
}
/**
 * Debug Core Register Selector Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/CEGIAJBH.html
 * @hidden
 */
export declare const enum DcrsrMask {
    /**
     * Register write or read, write is 1
     */
    REGWnR = 65536,
    /**
     * Register select - DebugReturnAddress & PSR/Flags, Execution Number, and state information
     */
    REGSEL = 31
}
/**
 * Debug Exception and Monitor Control Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/CEGHJDCF.html
 * @hidden
 */
export declare const enum DemcrMask {
    /**
     * Reset Vector Catch
     */
    CORERESET = 1,
    /**
     * Debug Trap on MMU Fault
     */
    MMERR = 16,
    /**
     * Debug Trap on No Coprocessor Fault
     */
    NOCPERR = 32,
    /**
     * Debug Trap on Checking Error Fault
     */
    CHKERR = 64,
    /**
     * Debug Trap on State Error Fault
     */
    STATERR = 128,
    /**
     * Debug Trap on Bus Error Fault
     */
    BUSERR = 256,
    /**
     * Debug Trap on Interrupt Error Fault
     */
    INTERR = 512,
    /**
     * Debug Trap on Hard Fault
     */
    HARDERR = 1024,
    /**
     * Monitor Enable
     */
    MON_EN = 65536,
    /**
     * Monitor Pend
     */
    MON_PEND = 131072,
    /**
     * Monitor Step
     */
    MON_STEP = 262144,
    /**
     * Monitor Request
     */
    MON_REQ = 524288,
    /**
     * Trace Enable
     */
    TRCENA = 16777216
}
/**
 * Flash Patch and Breakpoint Registers
 * http://infocenter.arm.com/help/topic/com.arm.doc.100165_0201_00_en/ric1417175949176.html
 * @hidden
 */
export declare const enum FPBRegister {
    /**
     * FlashPatch Control Register
     */
    FP_CTRL = 3758104576,
    /**
     * FlashPatch Remap Register
     */
    FP_REMAP = 3758104580,
    /**
     * FlashPatch Comparator Register0
     */
    FP_COMP0 = 3758104584,
    /**
     * FlashPatch Comparator Register1
     */
    FP_COMP1 = 3758104588,
    /**
     * FlashPatch Comparator Register2
     */
    FP_COMP2 = 3758104592,
    /**
     * FlashPatch Comparator Register3
     */
    FP_COMP3 = 3758104596,
    /**
     * FlashPatch Comparator Register4
     */
    FP_COMP4 = 3758104600,
    /**
     * FlashPatch Comparator Register5
     */
    FP_COMP5 = 3758104604,
    /**
     * FlashPatch Comparator Register6
     */
    FP_COMP6 = 3758104608,
    /**
     * FlashPatch Comparator Register7
     */
    FP_COMP7 = 3758104612
}
/**
 * Flash Patch and Breakpoint Control Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.ddi0337e/ch11s04s01.html#BABCAFAG
 * @hidden
 */
export declare enum FPBCtrlMask {
    /**
     * Flash patch unit enable
     */
    ENABLE = 1,
    /**
     * Key field which enables writing to the Flash Patch Control Register
     */
    KEY = 2
}
