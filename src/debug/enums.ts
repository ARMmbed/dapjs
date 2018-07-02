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

export const enum DPRegister {
    ABORT = 0x0,        // write only
    DPIDR = 0x0,        // read only
    CTRL_STAT = 0x4,    // SELECT.DPBANKSEL 0x0
    DLCR = 0x4,         // SELECT.DPBANKSEL 0x1
    RESEND = 0x8,       // read only
    SELECT = 0x8,       // write only
    RDBUFF = 0xC,       // read only
    // Version 2
    TARGETID = 0x4,     // read only, SELECT.DPBANKSEL 0x2
    DLPIDR = 0x4,       // read only, SELECT.DPBANKSEL 0x3
    EVENTSTAT = 0x4,    // read only, SELECT.DPBANKSEL 0x4
    TARGETSEL = 0xC,    // write only
}

export const enum ApRegister {
    CSW = 0x00,
    TAR = 0x04,
    DRW = 0x0C,
    BD0 = 0x10,
    BD1 = 0x14,
    BD2 = 0x18,
    BD3 = 0x1C,
    ROM = 0xF0,
    CFG = 0xF4,
    IDR = 0xFC,
}

export const enum CSW {
    CSW_SIZE = 0x00000007,
    CSW_SIZE8 = 0x00000000,
    CSW_SIZE16 = 0x00000001,
    CSW_SIZE32 = 0x00000002,
    CSW_ADDRINC = 0x00000030,
    CSW_NADDRINC = 0x00000000,
    CSW_SADDRINC = 0x00000010,
    CSW_PADDRINC = 0x00000020,
    CSW_DBGSTAT = 0x00000040,
    CSW_TINPROG = 0x00000080,
    CSW_HPROT = 0x02000000,
    CSW_MSTRTYPE = 0x20000000,
    CSW_MSTRCORE = 0x00000000,
    CSW_MSTRDBG = 0x20000000,
    CSW_RESERVED = 0x01000000,
    CSW_VALUE = (CSW_RESERVED | CSW_MSTRDBG | CSW_HPROT | CSW_DBGSTAT | CSW_SADDRINC),
}

export const enum AbortBits {
    DAPABORT = 0x01,
    STKCMPCLR = 0x02,
    STKERRCLR = 0x04,
    WDERRCLR = 0x08,
    ORUNERRCLR = 0x10
}

export const enum CtrlStatBits {
    ORUNDETECT = 0x01,
    STICKYORUN = 0x02,
    STICKYCMP = 0x10,
    STICKYERR = 0x20,
    READOK = 0x40,
    WDATAERR = 0x80,
    CDBGRSTREQ = 0x4000000,
    CDBGRSTACK = 0x8000000,
    CDBGPWRUPREQ = 0x10000000,
    CDBGPWRUPACK = 0x20000000,
    CSYSPWRUPREQ = 0x40000000,
    CSYSPWRUPACK = 0x80000000
}

export const enum EventStatBits {
    EA = 0x01
}

export const enum DPBankSelect {
    CTRL_STAT = 0x00,
    DLCR = 0x01,
    TARGETID = 0x02,
    DLPIDR = 0x03,
    EVENTSTAT = 0x04
}

export const enum SelectMask {
    APSEL = 0xFF000000,
    APBANKSEL = 0x000000F0,
    DPBANKSEL = 0x0000000F
}
