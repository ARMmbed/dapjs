/// <reference path="../typings/main.d.ts" />

import * as Promise from "bluebird"

const enum DapCmd {
    DAP_INFO = 0x00,
    DAP_LED = 0x01,
    DAP_CONNECT = 0x02,
    DAP_DISCONNECT = 0x03,
    DAP_TRANSFER_CONFIGURE = 0x04,
    DAP_TRANSFER = 0x05,
    DAP_TRANSFER_BLOCK = 0x06,
    DAP_TRANSFER_ABORT = 0x07,
    DAP_WRITE_ABORT = 0x08,
    DAP_DELAY = 0x09,
    DAP_RESET_TARGET = 0x0a,
    DAP_SWJ_PINS = 0x10,
    DAP_SWJ_CLOCK = 0x11,
    DAP_SWJ_SEQUENCE = 0x12,
    DAP_SWD_CONFIGURE = 0x13,
    DAP_JTAG_SEQUENCE = 0x14,
    DAP_JTAG_CONFIGURE = 0x15,
    DAP_JTAG_IDCODE = 0x16,
    DAP_VENDOR0 = 0x80,
}

const enum Csw {
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

    CSW_VALUE = (CSW_RESERVED | CSW_MSTRDBG | CSW_HPROT | CSW_DBGSTAT | CSW_SADDRINC)
}

const enum DapVal {
    AP_ACC = 1 << 0,
    DP_ACC = 0 << 0,
    READ = 1 << 1,
    WRITE = 0 << 1,
    VALUE_MATCH = 1 << 4,
    MATCH_MASK = 1 << 5
}

const enum Info {
    VENDOR_ID = 0x01,
    PRODUCT_ID = 0x02,
    SERIAL_NUMBER = 0x03,
    CMSIS_DAP_FW_VERSION = 0x04,
    TARGET_DEVICE_VENDOR = 0x05,
    TARGET_DEVICE_NAME = 0x06,
    CAPABILITIES = 0xf0,
    PACKET_COUNT = 0xfe,
    PACKET_SIZE = 0xff
}

const enum Reg {
    DP_0x0 = 0,
    DP_0x4 = 1,
    DP_0x8 = 2,
    DP_0xC = 3,
    AP_0x0 = 4,
    AP_0x4 = 5,
    AP_0x8 = 6,
    AP_0xC = 7,

    IDCODE = Reg.DP_0x0,
    ABORT = Reg.DP_0x0,
    CTRL_STAT = Reg.DP_0x4,
    SELECT = Reg.DP_0x8,

    CSW = 0x00,
    TAR = 0x04,
    DRW = 0x0C,
    IDR = 0xFC
}

function bank(addr: Reg) {
    const APBANKSEL = 0x000000f0
    return (addr & APBANKSEL) | (addr & 0xff000000)
}

let HID = require('node-hid');
let devices = HID.devices()

function error(msg: string): any {
    throw new Error(msg);
}

function info(msg: string) {
    console.log(msg)
}

function addInt32(arr: number[], val: number) {
    if (!arr) arr = []
    arr.push(val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff)
    return arr
}

function hex(v: number) {
    return "0x" + v.toString(16)
}

function rid(v: number) {
    let m = [
        "DP_0x0",
        "DP_0x4",
        "DP_0x8",
        "DP_0xC",
        "AP_0x0",
        "AP_0x4",
        "AP_0x8",
        "AP_0xC",
    ]

    return m[v] || "?"
}

export class Device {
    dev: any;
    private dataCb: (v: Buffer) => void;

    constructor(path: string) {
        this.dev = new HID.HID(path)

        this.dev.on("data", (buf: Buffer) => {
            let f = this.dataCb
            this.dataCb = null
            if (f) {
                f(buf)
            } else {
                console.log("DROP", buf)
            }
        })

        this.dev.on("error", (err: Error) => {
            console.log(err.message)
        })
    }

    sendNums(lst: number[]) {
        lst.unshift(0)
        while (lst.length < 64)
            lst.push(0)
        this.dev.write(lst)
    }

    readAsync() {
        if (this.dataCb) error("Race in readAsync")
        return new Promise<Buffer>((resolve, reject) => {
            this.dataCb = resolve
        })
    }

    cmd(op: DapCmd, ...args: number[]) {
        args.unshift(op)
        this.sendNums(args)
    }

    cmdNumsAsync(op: DapCmd, args: number[]) {
        args.unshift(op)
        this.sendNums(args)
        return this.readAsync()
            .then(buf => {
                if (buf[0] != op) error(`Bad response for ${op} -> ${buf[0]}`)
                switch (op) {
                    case DapCmd.DAP_CONNECT:
                    case DapCmd.DAP_INFO:
                    case DapCmd.DAP_TRANSFER:
                        break;
                    default:
                        if (buf[1] != 0)
                            error(`Bad status for ${op} -> ${buf[1]}`)
                }
                return buf
            })
    }

    // seems useless
    infoAsync(id: Info) {
        return this.cmdNumsAsync(DapCmd.DAP_INFO, [id])
            .then(buf => {
                if (buf[1] == 0) return null
                switch (id) {
                    case Info.CAPABILITIES:
                    case Info.PACKET_COUNT:
                    case Info.PACKET_SIZE:
                        if (buf[1] == 1) return buf[2]
                        if (buf[1] == 2) return buf[3] << 8 | buf[2]
                }
                return buf.slice(2, buf[1] + 2 - 1).toString("utf8")
            })
    }

    resetTargetAsync() {
        return this.cmdNumsAsync(DapCmd.DAP_RESET_TARGET, [])
    }

    writeRegAsync(regId: Reg, val: number) {
        if (val === null) error("bad val")
        info(`writeReg(${rid(regId)}, ${hex(val)})`)
        return this.regOpAsync(regId, val)
            .then(() => {
            })
    }

    readRegAsync(regId: Reg) {
        return this.regOpAsync(regId, null)
            .then(buf => {
                let v = buf.readUInt32LE(3)
                info(`readReg(${rid(regId)}) = ${hex(v)}`)
                return v
            })
    }

    private dpSelect: number;
    private csw: number;

    writeDpAsync(addr: Reg, data: number) {
        if (addr == Reg.SELECT) {
            if (data === this.dpSelect) return Promise.resolve()
            this.dpSelect = data
        }
        return this.writeRegAsync(addr, data)
    }

    writeApAsync(addr: Reg, data: number) {
        return this.writeDpAsync(Reg.SELECT, bank(addr))
            .then(() => {
                if (addr == Reg.CSW) {
                    if (data === this.csw) return Promise.resolve()
                    this.csw = data
                }
                let v = DapVal.WRITE | DapVal.AP_ACC | (addr & 0x0c)
                return this.writeRegAsync(v, data)
            })
    }

    readMemAsync(addr: number) {
        return this.writeApAsync(Reg.CSW, Csw.CSW_VALUE | Csw.CSW_SIZE32)
            .then(() => this.writeRegAsync(DapVal.WRITE | DapVal.AP_ACC | Reg.TAR, addr))
            .then(() => this.readRegAsync(DapVal.READ | DapVal.AP_ACC | Reg.DRW))
    }

    private regOpAsync(regId: Reg, val: number) {
        let request = val === null ? DapVal.READ : DapVal.WRITE
        if (regId < 4)
            request |= DapVal.DP_ACC
        else
            request |= DapVal.AP_ACC
        request |= (regId & 3) << 2
        let sendargs = [0, 1, request]
        addInt32(sendargs, val)
        return this.cmdNumsAsync(DapCmd.DAP_TRANSFER, sendargs)
            .then(buf => {
                if (buf[1] != 1) error("Bad #trans " + buf[1])
                if (buf[2] != 1) error("Bad transfer status " + buf[2])
                return buf
            })
    }

    connectAsync() {
        info("Connecting...")
        return this.cmdNumsAsync(DapCmd.DAP_CONNECT, [1])
            .then(buf => {
                if (buf[1] != 1) error("Non SWD")
                // 1MHz
                return this.cmdNumsAsync(DapCmd.DAP_SWJ_CLOCK, addInt32(null, 1000000))
            })
            .then(() => this.cmdNumsAsync(DapCmd.DAP_TRANSFER_CONFIGURE, [0, 0x50, 0, 0, 0]))
            .then(() => this.cmdNumsAsync(DapCmd.DAP_SWD_CONFIGURE, [0]))
            .then(() => this.writeRegAsync(Reg.DP_0x0, 1 << 2)) // clear sticky error
            .then(() => info("Connected."))
    }
}

let mbedId = devices.filter((d: any) => /MBED CMSIS-DAP/.test(d.product))[0]
let d = new Device(mbedId.path)
d.connectAsync()
    .then(() => d.writeRegAsync(Reg.DP_0x0, 4))
    .then(() => d.readMemAsync(0x50000000))
    .then(v => console.log(v))
