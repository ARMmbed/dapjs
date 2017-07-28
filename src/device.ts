import {CortexSpecialReg} from "./cortex_m";
import {ApReg, Dap, DapCmd, DapVal, IHID, Reg} from "./dap";
import {addInt32, apReg, assert, bank, delay, readUInt32LE, regRequest} from "./util";

export class Device {
    private dap: Dap;

    private dpSelect: number;
    private csw: number;
    private idcode: number;

    constructor(private device: IHID) {
        this.dap = new Dap(device);
    }

    public async reconnect() {
        await this.dap.disconnect();
        await delay(100);
        await this.init();
    }

    public async init() {
        await this.dap.connect();

        const n = await this.readDp(Reg.IDCODE);
        this.idcode = n;

        await this.writeReg(Reg.DP_0x0, 1 << 2); // clear sticky error
        await this.writeDp(Reg.SELECT, 0);
        await this.writeDp(Reg.CTRL_STAT, CortexSpecialReg.CSYSPWRUPREQ | CortexSpecialReg.CDBGPWRUPREQ);

        const m = CortexSpecialReg.CDBGPWRUPACK | CortexSpecialReg.CSYSPWRUPACK;
        let v = await this.readDp(Reg.CTRL_STAT);

        while ((v & m) !== m) {
            v = await this.readDp(Reg.CTRL_STAT);
        }

        await this.writeDp(
            Reg.CTRL_STAT,
            (CortexSpecialReg.CSYSPWRUPREQ |
            CortexSpecialReg.CDBGPWRUPREQ |
            CortexSpecialReg.TRNNORMAL |
            CortexSpecialReg.MASKLANE),
        );
        await this.writeDp(Reg.SELECT, 0);
        await this.readAp(ApReg.IDR);
    }

    public async writeReg(regId: Reg, val: number) {
        return this.regOp(regId, val);
    }

    public async readReg(regId: Reg) {
        const buf = await this.regOp(regId, null);
        const v = readUInt32LE(buf, 3);

        return v;
    }

    public async readDp(addr: Reg) {
        return this.readReg(addr);
    }

    public async readAp(addr: ApReg) {
        await this.writeDp(Reg.SELECT, bank(addr));
        return await this.readReg(apReg(addr, DapVal.READ));
    }

    public writeDp(addr: Reg, data: number) {
        if (addr === Reg.SELECT) {
            if (data === this.dpSelect) {
                return Promise.resolve();
            }

            this.dpSelect = data;
        }

        return this.writeReg(addr, data);
    }

    public async writeAp(addr: ApReg, data: number) {
        await this.writeDp(Reg.SELECT, bank(addr));

        if (addr === ApReg.CSW) {
            if (data === this.csw) {
                return Promise.resolve();
            }

            this.csw = data;
        }

        await this.writeReg(apReg(addr, DapVal.WRITE), data);
    }

    public async close() {
        return this.device.close();
    }

    public async readRegRepeat(regId: Reg, cnt: number) {
        assert(cnt <= 15);

        const request = regRequest(regId);
        const sendargs = [0, cnt];

        for (let i = 0; i < cnt; ++i) {
            sendargs.push(request);
        }

        const buf = await this.dap.cmdNums(DapCmd.DAP_TRANSFER, sendargs);

        if (buf[1] !== cnt) {
            throw new Error(("(many) Bad #trans " + buf[1]));
        } else if (buf[2] !== 1) {
            throw new Error(("(many) Bad transfer status " + buf[2]));
        }

        return buf.slice(3, 3 + cnt * 4);
    }

    public async writeRegRepeat(regId: Reg, data: Uint32Array) {
        assert(data.length <= 15);

        const request = regRequest(regId, true);
        const sendargs = [0, data.length];

        data.forEach((d) => {
            sendargs.push(request);
            addInt32(sendargs, d);
        });

        const buf = await this.dap.cmdNums(DapCmd.DAP_TRANSFER, sendargs);

        if (buf[2] !== 1) {
            throw new Error(("(many-wr) Bad transfer status " + buf[2]));
        }
    }

    private async regOp(regId: Reg, val: number) {
        const request = regRequest(regId, val !== null);
        const sendargs = [0, 1, request];

        if (val !== null) {
            addInt32(sendargs, val);
        }

        const buf = await this.dap.cmdNums(DapCmd.DAP_TRANSFER, sendargs);

        if (buf[1] !== 1) {
            console.error("Make sure you have initialised the DAP connection.");
            throw new Error(("Bad #trans " + buf[1]));
        } else if (buf[2] !== 1) {
            if (buf[2] === 2) {
                throw new Error(("Transfer wait"));
            }
            throw new Error(("Bad transfer status " + buf[2]));
        }

        return buf;
    }
}
