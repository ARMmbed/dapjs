import {ApReg, DapRegisters, DapVal, Reg} from "./constants";
import {PreparedDapCommand} from "./prepared";

import {CMSISDAP, DapCmd} from "../transport/cmsis_dap";
import {IHID} from "../transport/hid";
import {addInt32, apReg, assert, bank, delay, readUInt32LE, regRequest} from "../util";

export class DAP {
    public dap: CMSISDAP;

    private dpSelect: number;
    private csw: number;
    private idcode: number;

    constructor(private device: IHID) {
        this.dap = new CMSISDAP(device);
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

        let prep = this.prepareCommand();
        prep.writeReg(Reg.DP_0x0, 1 << 2); // clear sticky error
        prep.writeDp(Reg.SELECT, 0);
        prep.writeDp(Reg.CTRL_STAT, DapRegisters.CSYSPWRUPREQ | DapRegisters.CDBGPWRUPREQ);

        const m = DapRegisters.CDBGPWRUPACK | DapRegisters.CSYSPWRUPACK;
        prep.readDp(Reg.CTRL_STAT);
        let v = (await prep.go())[0];

        while ((v & m) !== m) {
            v = await this.readDp(Reg.CTRL_STAT);
        }

        prep = this.prepareCommand();
        prep.writeDp(
            Reg.CTRL_STAT,
            (DapRegisters.CSYSPWRUPREQ |
            DapRegisters.CDBGPWRUPREQ |
            DapRegisters.TRNNORMAL |
            DapRegisters.MASKLANE),
        );
        prep.writeDp(Reg.SELECT, 0);
        prep.readAp(ApReg.IDR);

        await prep.go();
    }

    public async writeReg(regId: Reg, val: number) {
        return this.regOp(regId, val);
    }

    public async readReg(regId: Reg) {
        const buf = await this.regOp(regId, null);
        const v = readUInt32LE(buf, 3);

        return v;
    }

    public prepareCommand() {
        return new PreparedDapCommand(this.dap);
    }

    public async readDp(addr: Reg) {
        return this.readReg(addr);
    }

    public async readAp(addr: ApReg) {
        const prep = this.prepareCommand();
        prep.writeDp(Reg.SELECT, bank(addr));
        prep.readReg(apReg(addr, DapVal.READ));

        return (await prep.go())[0];
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
        if (addr === ApReg.CSW) {
            if (data === this.csw) {
                return Promise.resolve();
            }

            this.csw = data;
        }

        const prep = this.prepareCommand();
        prep.writeDp(Reg.SELECT, bank(addr));
        prep.writeReg(apReg(addr, DapVal.WRITE), data);

        await prep.go();
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

        return buf.subarray(3, 3 + cnt * 4);
    }

    public async writeRegRepeat(regId: Reg, data: Uint32Array) {
        const remainingLength = 64 - 1 - 1 - 2 - 1; // 14
        assert(data.length <= remainingLength / 4);

        /*
            BYTE | BYTE *****| SHORT**********| BYTE *************| WORD *********|
          > 0x06 | DAP Index | Transfer Count | Transfer Request  | Transfer Data |
                 |***********|****************|*******************|+++++++++++++++|
        */

        const request = regRequest(regId, true);
        const sendargs = [0, data.length, 0, request];

        data.forEach((d) => {
            // separate d into bytes
            addInt32(sendargs, d);
        });

        const buf = await this.dap.cmdNums(DapCmd.DAP_TRANSFER_BLOCK, sendargs);

        if (buf[3] !== 1) {
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
