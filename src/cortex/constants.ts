export const DEFAULT_RUNCODE_TIMEOUT = 10000 /* ms */;

export const enum CortexSpecialReg {
    // Debug Fault Status Register
    DFSR = 0xE000ED30,
    DFSR_EXTERNAL = (1 << 4),
    DFSR_VCATCH = (1 << 3),
    DFSR_DWTTRAP = (1 << 2),
    DFSR_BKPT = (1 << 1),
    DFSR_HALTED = (1 << 0),

    // Debug Exception and Monitor Control Register
    DEMCR = 0xE000EDFC,
    // DWTENA in armv6 architecture reference manual
    DEMCR_TRCENA = (1 << 24),
    DEMCR_VC_HARDERR = (1 << 10),
    DEMCR_VC_BUSERR = (1 << 8),
    DEMCR_VC_CORERESET = (1 << 0),

    // CPUID Register
    CPUID = 0xE000ED00,

    // Debug Core Register Selector Register
    DCRSR = 0xE000EDF4,
    DCRSR_REGWnR = (1 << 16),
    DCRSR_REGSEL = 0x1F,

    // Debug Halting Control and Status Register
    DHCSR = 0xE000EDF0,
    C_DEBUGEN = (1 << 0),
    C_HALT = (1 << 1),
    C_STEP = (1 << 2),
    C_MASKINTS = (1 << 3),
    C_SNAPSTALL = (1 << 5),
    S_REGRDY = (1 << 16),
    S_HALT = (1 << 17),
    S_SLEEP = (1 << 18),
    S_LOCKUP = (1 << 19),
    S_RETIRE_ST = (1 << 24),
    S_RESET_ST = (1 << 25),

    // Debug Core Register Data Register
    DCRDR = 0xE000EDF8,

    // Coprocessor Access Control Register
    CPACR = 0xE000ED88,
    CPACR_CP10_CP11_MASK = (3 << 20) | (3 << 22),

    NVIC_AIRCR = (0xE000ED0C),
    NVIC_AIRCR_VECTKEY = (0x5FA << 16),
    NVIC_AIRCR_VECTRESET = (1 << 0),
    NVIC_AIRCR_SYSRESETREQ = (1 << 2),

    DBGKEY = (0xA05F << 16),

    // FPB (breakpoint)
    FP_CTRL = (0xE0002000),
    FP_CTRL_KEY = (1 << 1),
    FP_COMP0 = (0xE0002008),

    // DWT (data watchpoint & trace)
    DWT_CTRL = 0xE0001000,
    DWT_COMP_BASE = 0xE0001020,
    DWT_MASK_OFFSET = 4,
    DWT_FUNCTION_OFFSET = 8,
    DWT_COMP_BLOCK_SIZE = 0x10,
}

export const CPUID_IMPLEMENTER_MASK = 0xff000000;
export const CPUID_IMPLEMENTER_POS = 24;
export const CPUID_VARIANT_MASK = 0x00f00000;
export const CPUID_VARIANT_POS = 20;
export const CPUID_ARCHITECTURE_MASK = 0x000f0000;
export const CPUID_ARCHITECTURE_POS = 16;
export const CPUID_PARTNO_MASK = 0x0000fff0;
export const CPUID_PARTNO_POS = 4;
export const CPUID_REVISION_MASK = 0x0000000f;
export const CPUID_REVISION_POS = 0;

export const enum CPUIDImplementer {
    CPUID_IMPLEMENTER_ARM = 0x41,
}

export const enum ISA {
    ARMv6M = 0xC,
    ARMv7M = 0xF,
}

export const ISANames: Map<ISA, string> = new Map<ISA, string>();
ISANames.set(ISA.ARMv6M, "ARMv6M");
ISANames.set(ISA.ARMv7M, "ARMv7M");

export const enum CoreType {
    CortexM0 = 0xc20,
    CortexM1 = 0xc21,
    CortexM3 = 0xc23,
    CortexM4 = 0xc24,
    CortexM0p = 0xc60,
}

export const CoreNames: Map<CoreType, string> = new Map<CoreType, string>();
CoreNames.set(CoreType.CortexM0, "Cortex-M0");
CoreNames.set(CoreType.CortexM1, "Cortex-M1");
CoreNames.set(CoreType.CortexM3, "Cortex-M3");
CoreNames.set(CoreType.CortexM4, "Cortex-M4");
CoreNames.set(CoreType.CortexM0p, "Cortex-M0+");

export const enum CortexReg {
    R0 = 0,
    R1 = 1,
    R2 = 2,
    R3 = 3,
    R4 = 4,
    R5 = 5,
    R6 = 6,
    R7 = 7,
    R8 = 8,
    R9 = 9,
    R10 = 10,
    R11 = 11,
    R12 = 12,
    SP = 13,
    LR = 14,
    PC = 15,
    XPSR = 16,
    MSP = 17, // Main Stack Pointer
    PSP = 18, // Process Stack Pointer
    PRIMASK = 20,  // &0xff
    CONTROL = 20,  // &0xff000000 >> 24
}

export const enum CoreState {
    TARGET_RESET,
    TARGET_LOCKUP,
    TARGET_SLEEPING,
    TARGET_HALTED,
    TARGET_RUNNING,
}
