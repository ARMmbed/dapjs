import {ApReg, DapVal, Reg} from "./dap/constants";

export const readUInt32LE = (b: Uint8Array, idx: number) => {
    return (b[idx] |
        (b[idx + 1] << 8) |
        (b[idx + 2] << 16) |
        (b[idx + 3] << 24)) >>> 0;
};

export const bufferConcat = (bufs: Uint8Array[]) => {
    let len = 0;
    for (const b of bufs) {
        len += b.length;
    }
    const r = new Uint8Array(len);
    len = 0;
    for (const b of bufs) {
        r.set(b, len);
        len += b.length;
    }
    return r;
};

export const delay = async (t: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, t);
    });
};

export const addInt32 = (arr: number[], val: number) => {
    if (!arr) {
        arr = [];
    }
    arr.push(val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff);
    return arr;
};

export const hex = (v: number) => {
    return "0x" + v.toString(16);
};

export const rid = (v: number) => {
    const m = [
        "DP_0x0",
        "DP_0x4",
        "DP_0x8",
        "DP_0xC",
        "AP_0x0",
        "AP_0x4",
        "AP_0x8",
        "AP_0xC",
    ];

    return m[v] || "?";
};

export const bank = (addr: number) => {
    const APBANKSEL = 0x000000f0;
    return (addr & APBANKSEL) | (addr & 0xff000000);
};

export const apReg = (r: ApReg, mode: DapVal) => {
    const v = r | mode | DapVal.AP_ACC;
    return (4 + ((v & 0x0c) >> 2)) as Reg;
};

export const toArrayOfNumbers = (buf: Uint8Array) => {
    const r: number[] = [];
    for (let i = 0; i < buf.length; ++i) {
        r[i] = buf[i];
    }
    return r;
};

export const assert = (cond: any) => {
    if (!cond) {
        throw new Error("assertion failed");
    }
};

export const regRequest = (regId: number, isWrite = false) => {
    let request = !isWrite ? DapVal.READ : DapVal.WRITE;

    if (regId < 4) {
        request |= DapVal.DP_ACC;
    } else {
        request |= DapVal.AP_ACC;
    }

    request |= (regId & 3) << 2;

    return request;
};

export const hexBytes = (bytes: number[]) => {
    let chk = 0;
    let r = ":";

    bytes.forEach(b => chk += b);
    bytes.push((-chk) & 0xff);
    bytes.forEach(b => r += ("0" + b.toString(16)).slice(-2));

    return r.toUpperCase();
};

export const isBufferBinary = (buffer: ArrayBuffer): boolean => {
    // detect if buffer contains text or binary data
    const lengthToCheck = buffer.byteLength > 50 ? 50 : buffer.byteLength;
    const bufferString = Buffer.from(buffer).toString("utf8");
    for (let i = 0; i < lengthToCheck; i++) {
        const charCode = bufferString.charCodeAt(i);
        // 65533 is a code for unknown character
        // 0-8 are codes for control characters
        if (charCode === 65533 || charCode <= 8) {
            return true;
        }
    }
    return false;
};
