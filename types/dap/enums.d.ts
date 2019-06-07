/**
 * Debug Port Registers
 * http://infocenter.arm.com/help/topic/com.arm.doc.100230_0004_00_en/Chunk310569109.html#smr1439293850345
 */
export declare const enum DPRegister {
    /**
     * AP Abort register, write only
     */
    ABORT = 0,
    /**
     * Debug Port Identification register, read only
     */
    DPIDR = 0,
    /**
     * Control/Status register, SELECT.DPBANKSEL 0x0
     */
    CTRL_STAT = 4,
    /**
     * Data Link Control Register, SELECT.DPBANKSEL 0x1
     */
    DLCR = 4,
    /**
     * Read Resend register, read only
     */
    RESEND = 8,
    /**
     * AP Select register, write only
     */
    SELECT = 8,
    /**
     * Read Buffer register, read only
     */
    RDBUFF = 12,
    /**
     * Target Identification register, read only, SELECT.DPBANKSEL 0x2
     */
    TARGETID = 4,
    /**
     * Data Link Protocol Identification Register, read only, SELECT.DPBANKSEL 0x3
     */
    DLPIDR = 4,
    /**
     * Event Status register, read only, SELECT.DPBANKSEL 0x4
     */
    EVENTSTAT = 4,
    /**
     * Target Selection, write only
     */
    TARGETSEL = 12
}
/**
 * Access Port Registers
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100230_0004_00_en/smr1439293381481.html
 */
export declare const enum APRegister {
    /**
     * Control/Status Word register
     */
    CSW = 0,
    /**
     * Transfer Address Register
     */
    TAR = 4,
    /**
     * Data Read/Write register
     */
    DRW = 12,
    /**
     * Banked Data register
     */
    BD0 = 16,
    /**
     * Banked Data register
     */
    BD1 = 20,
    /**
     * Banked Data register
     */
    BD2 = 24,
    /**
     * Banked Data register
     */
    BD3 = 28,
    /**
     * Configuration register
     */
    CFG = 244,
    /**
     * Debug Base Address register
     */
    ROM = 248,
    /**
     * Identification Register
     */
    IDR = 252
}
/**
 * Abort Register Mask
 * @hidden
 */
export declare const enum AbortMask {
    /**
     * Generates a DAP abort, that aborts the current AP transaction
     */
    DAPABORT = 1,
    /**
     * Reserved
     */
    STKCMPCLR = 2,
    /**
     * Sets the STICKYERR sticky error flag to 0
     */
    STKERRCLR = 4,
    /**
     * Sets the WDATAERR write data error flag to 0
     */
    WDERRCLR = 8,
    /**
     * Sets the STICKYORUN overrun error flag to 0
     */
    ORUNERRCLR = 16
}
/**
 * Control/Status Register Mask
 * @hidden
 */
export declare const enum CtrlStatMask {
    /**
     * This bit is set to 1 to enable overrun detection. The reset value is 0
     */
    ORUNDETECT = 1,
    /**
     * This bit is set to 1 when an overrun occurs, read only
     */
    STICKYORUN = 2,
    /**
     * Reserved
     */
    STICKYCMP = 16,
    /**
     * If an error is returned by an access port transaction, this bit is set to 1, read only
     */
    STICKYERR = 32,
    /**
     * Whether the response to the previous access port read or RDBUFF read was OK, read only
     */
    READOK = 64,
    /**
     * If a Write Data Error occurs, read only
     */
    WDATAERR = 128,
    /**
     * Debug reset request, the reset value is 0
     */
    CDBGRSTREQ = 67108864,
    /**
     * Debug reset acknowledge, read only
     */
    CDBGRSTACK = 134217728,
    /**
     * Debug powerup request, the reset value is 0
     */
    CDBGPWRUPREQ = 268435456,
    /**
     * Debug powerup acknowledge, read only
     */
    CDBGPWRUPACK = 536870912,
    /**
     * System powerup request, the reset value is 0
     */
    CSYSPWRUPREQ = 1073741824,
    /**
     * System powerup acknowledge, read only
     */
    CSYSPWRUPACK = -2147483648
}
/**
 * Control/Status Word Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.100165_0201_00_en/Chunk2061626261.html#ric1417175948266
 * @hidden
 */
export declare const enum CSWMask {
    /**
     * 8 bits
     */
    SIZE_8 = 0,
    /**
     * 16 bits
     */
    SIZE_16 = 1,
    /**
     * 32 bits
     */
    SIZE_32 = 2,
    /**
     * Auto address increment single
     */
    ADDRINC_SINGLE = 16,
    /**
     * Auto address increment packed
     */
    ADDRINC_PACKED = 32,
    /**
     * Indicates the status of the DAPEN port - AHB transfers permitted
     */
    DBGSTATUS = 64,
    /**
     * Indicates if a transfer is in progress
     */
    TRANSINPROG = 128,
    /**
     * Reserved
     */
    RESERVED = 16777216,
    /**
     * User and Privilege control
     */
    HPROT1 = 33554432,
    /**
     * Set to 1 for master type debug
     */
    MASTERTYPE = 536870912,
    /**
     * Common mask value
     * @hidden
     */
    VALUE = 587202640
}
/**
 * Debug Port Bank Select
 * @hidden
 */
export declare const enum DPBankSelect {
    /**
     * CTRL/STAT
     */
    CTRL_STAT = 0,
    /**
     * DLCR
     */
    DLCR = 1,
    /**
     * TARGETID
     */
    TARGETID = 2,
    /**
     * DLPIDR
     */
    DLPIDR = 3,
    /**
     * EVENTSTAT
     */
    EVENTSTAT = 4
}
/**
 * Bank Select Mask
 * @hidden
 */
export declare const enum BankSelectMask {
    /**
     * Selects the current access port
     */
    APSEL = 4278190080,
    /**
     * Selects the active 4-word register window on the current access port
     */
    APBANKSEL = 240,
    /**
     * Selects the register that appears at DP register 0x4
     */
    DPBANKSEL = 15
}
/**
 * Event Status Mask
 * @hidden
 */
export declare const enum EventStatMask {
    /**
     * Event status flag, indicates that the processor is halted when set to 0
     */
    EA = 1
}
