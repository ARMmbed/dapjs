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
 * Debug Port Registers
 * http://infocenter.arm.com/help/topic/com.arm.doc.100230_0004_00_en/Chunk310569109.html#smr1439293850345
 */
export const enum DPRegister {
    /**
     * AP Abort register, write only
     */
    ABORT = 0x0,
    /**
     * Debug Port Identification register, read only
     */
    DPIDR = 0x0,
    /**
     * Control/Status register, SELECT.DPBANKSEL 0x0
     */
    CTRL_STAT = 0x4,
    /**
     * Data Link Control Register, SELECT.DPBANKSEL 0x1
     */
    DLCR = 0x4,
    /**
     * Read Resend register, read only
     */
    RESEND = 0x8,
    /**
     * AP Select register, write only
     */
    SELECT = 0x8,
    /**
     * Read Buffer register, read only
     */
    RDBUFF = 0xC,
    // Version 2
    /**
     * Target Identification register, read only, SELECT.DPBANKSEL 0x2
     */
    TARGETID = 0x4,
    /**
     * Data Link Protocol Identification Register, read only, SELECT.DPBANKSEL 0x3
     */
    DLPIDR = 0x4,
    /**
     * Event Status register, read only, SELECT.DPBANKSEL 0x4
     */
    EVENTSTAT = 0x4,
    /**
     * Target Selection, write only
     */
    TARGETSEL = 0xC
}

/**
 * Access Port Registers
 * http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.100230_0004_00_en/smr1439293381481.html
 */
export const enum APRegister {
    /**
     * Control/Status Word register
     */
    CSW = 0x00,
    /**
     * Transfer Address Register
     */
    TAR = 0x04,
    /**
     * Data Read/Write register
     */
    DRW = 0x0C,
    /**
     * Banked Data register
     */
    BD0 = 0x10,
    /**
     * Banked Data register
     */
    BD1 = 0x14,
    /**
     * Banked Data register
     */
    BD2 = 0x18,
    /**
     * Banked Data register
     */
    BD3 = 0x1C,
    /**
     * Configuration register
     */
    CFG = 0xF4,
    /**
     * Debug Base Address register
     */
    ROM = 0xF8,
    /**
     * Identification Register
     */
    IDR = 0xFC
}

/**
 * Abort Register Mask
 * @hidden
 */
export const enum AbortMask {
    /**
     * Generates a DAP abort, that aborts the current AP transaction
     */
    DAPABORT = (1 << 0),
    /**
     * Reserved
     */
    STKCMPCLR = (1 << 1),
    /**
     * Sets the STICKYERR sticky error flag to 0
     */
    STKERRCLR = (1 << 2),
    /**
     * Sets the WDATAERR write data error flag to 0
     */
    WDERRCLR = (1 << 3),
    /**
     * Sets the STICKYORUN overrun error flag to 0
     */
    ORUNERRCLR = (1 << 4)
}

/**
 * Control/Status Register Mask
 * @hidden
 */
export const enum CtrlStatMask {
    /**
     * This bit is set to 1 to enable overrun detection. The reset value is 0
     */
    ORUNDETECT = (1 << 0),
    /**
     * This bit is set to 1 when an overrun occurs, read only
     */
    STICKYORUN = (1 << 1),
    /**
     * Reserved
     */
    STICKYCMP = (1 << 4),
    /**
     * If an error is returned by an access port transaction, this bit is set to 1, read only
     */
    STICKYERR = (1 << 5),
    /**
     * Whether the response to the previous access port read or RDBUFF read was OK, read only
     */
    READOK = (1 << 6),
    /**
     * If a Write Data Error occurs, read only
     */
    WDATAERR = (1 << 7),
    /**
     * Debug reset request, the reset value is 0
     */
    CDBGRSTREQ = (1 << 26),
    /**
     * Debug reset acknowledge, read only
     */
    CDBGRSTACK = (1 << 27),
    /**
     * Debug powerup request, the reset value is 0
     */
    CDBGPWRUPREQ = (1 << 28),
    /**
     * Debug powerup acknowledge, read only
     */
    CDBGPWRUPACK = (1 << 29),
    /**
     * System powerup request, the reset value is 0
     */
    CSYSPWRUPREQ = (1 << 30),
    /**
     * System powerup acknowledge, read only
     */
    CSYSPWRUPACK = (1 << 31)
}

/**
 * Control/Status Word Register Mask
 * http://infocenter.arm.com/help/topic/com.arm.doc.100165_0201_00_en/Chunk2061626261.html#ric1417175948266
 * @hidden
 */
export const enum CSWMask {
    /**
     * 8 bits
     */
    SIZE_8 = (0 << 0),
    /**
     * 16 bits
     */
    SIZE_16 = (1 << 0),
    /**
     * 32 bits
     */
    SIZE_32 = (1 << 1),
    /**
     * Auto address increment single
     */
    ADDRINC_SINGLE = (1 << 4),
    /**
     * Auto address increment packed
     */
    ADDRINC_PACKED = (1 << 5),
    /**
     * Indicates the status of the DAPEN port - AHB transfers permitted
     */
    DBGSTATUS = (1 << 6),
    /**
     * Indicates if a transfer is in progress
     */
    TRANSINPROG = (1 << 7),
    /**
     * Reserved
     */
    RESERVED = (1 << 24),
    /**
     * User and Privilege control
     */
    HPROT1 = (1 << 25),
    /**
     * Set to 1 for master type debug
     */
    MASTERTYPE = (1 << 29),
    /**
     * Common mask value
     * @hidden
     */
    VALUE = ( ADDRINC_SINGLE | DBGSTATUS | RESERVED | HPROT1 | MASTERTYPE ),
}

/**
 * Debug Port Bank Select
 * @hidden
 */
export const enum DPBankSelect {
    /**
     * CTRL/STAT
     */
    CTRL_STAT = 0x00,
    /**
     * DLCR
     */
    DLCR = 0x01,
    /**
     * TARGETID
     */
    TARGETID = 0x02,
    /**
     * DLPIDR
     */
    DLPIDR = 0x03,
    /**
     * EVENTSTAT
     */
    EVENTSTAT = 0x04
}

/**
 * Bank Select Mask
 * @hidden
 */
export const enum BankSelectMask {
    /**
     * Selects the current access port
     */
    APSEL = 0xFF000000,
    /**
     * Selects the active 4-word register window on the current access port
     */
    APBANKSEL = 0x000000F0,
    /**
     * Selects the register that appears at DP register 0x4
     */
    DPBANKSEL = 0x0000000F
}

/**
 * Event Status Mask
 * @hidden
 */
export const enum EventStatMask {
    /**
     * Event status flag, indicates that the processor is halted when set to 0
     */
    EA = 0x01
}
