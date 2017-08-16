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
    return new Promise((resolve) => {
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

export const bufToUint32Array = (buf: Uint8Array) => {
    assert((buf.length & 3) === 0);

    const r: number[] = [];

    if (!buf.length) {
        return r;
    }

    r[buf.length / 4 - 1] = 0;

    for (let i = 0; i < r.length; ++i) {
        r[i] = readUInt32LE(buf, i << 2);
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

    bytes.forEach((b) => chk += b);
    bytes.push((-chk) & 0xff);
    bytes.forEach((b) => r += ("0" + b.toString(16)).slice(-2));

    return r.toUpperCase();
};

export const hex2bin = (hexstr: string) => {
    const array = new Uint8Array(hexstr.length / 2);

    for (let i = 0; i < hexstr.length / 2; i++) {
        array[i] = parseInt(hexstr.substr(2 * i, 2), 16);
    }

    return array;
}
