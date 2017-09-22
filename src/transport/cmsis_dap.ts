import {addInt32} from "../util";
import {IHID} from "./hid";

export const enum DapCmd {
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

const enum Info {
    VENDOR_ID = 0x01,
    PRODUCT_ID = 0x02,
    SERIAL_NUMBER = 0x03,
    CMSIS_DAP_FW_VERSION = 0x04,
    TARGET_DEVICE_VENDOR = 0x05,
    TARGET_DEVICE_NAME = 0x06,
    CAPABILITIES = 0xf0,
    PACKET_COUNT = 0xfe,
    PACKET_SIZE = 0xff,
}

export class CMSISDAP {
    private hid: IHID;
    private maxSent = 1;

    constructor(hid: IHID) {
        this.hid = hid;
    }

    public async resetTarget() {
        return this.cmdNums(DapCmd.DAP_RESET_TARGET, []);
    }

    public async disconnect() {
        return this.cmdNums(DapCmd.DAP_DISCONNECT, []);
    }

    public async cmdNums(op: DapCmd, data: number[]) {
        data.unshift(op);

        const buf = await this.send(data);

        if (buf[0] !== op) {
            throw new Error(`Bad response for ${op} -> ${buf[0]}`);
        }

        switch (op) {
            case DapCmd.DAP_CONNECT:
            case DapCmd.DAP_INFO:
            case DapCmd.DAP_TRANSFER:
            case DapCmd.DAP_TRANSFER_BLOCK:
                break;
            default:
                if (buf[1] !== 0) {
                    throw new Error(`Bad status for ${op} -> ${buf[1]}`);
                }
        }

        return buf;
    }

    public async connect() {
        console.log("Connecting...");

        const v = await this.info(Info.PACKET_COUNT);

        if (v as number) {
            this.maxSent = v as number;
        } else {
            throw new Error("DAP_INFO returned invalid packet count.");
        }

        await this.cmdNums(DapCmd.DAP_SWJ_CLOCK, addInt32(null, 10000000));

        const buf = await this.cmdNums(DapCmd.DAP_CONNECT, [0]);
        if (buf[1] !== 1) {
            throw new Error("SWD mode not enabled.");
        }

        await this.cmdNums(DapCmd.DAP_SWJ_CLOCK, addInt32(null, 10000000));
        await this.cmdNums(DapCmd.DAP_TRANSFER_CONFIGURE, [0, 0x50, 0, 0, 0]);
        await this.cmdNums(DapCmd.DAP_SWD_CONFIGURE, [0]);
        await this.jtagToSwd();

        console.log("Connected");
    }

    private async jtagToSwd() {
        const arrs = [
            [56, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
            [16, 0x9e, 0xe7],
            [56, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
            [8, 0x00],
        ];

        for (const arr of arrs) {
            await this.swjSequence(arr);
        }
    }

    private async swjSequence(data: number[]) {
        return this.cmdNums(DapCmd.DAP_SWJ_SEQUENCE, data);
    }

    private async info(id: Info) {
        const buf = await this.cmdNums(DapCmd.DAP_INFO, [id]);

        if (buf[1] === 0) {
            return null;
        }

        switch (id) {
            case Info.CAPABILITIES:
            case Info.PACKET_COUNT:
            case Info.PACKET_SIZE:
                if (buf[1] === 1) {
                    return buf[2];
                } else if (buf[1] === 2) {
                    return buf[3] << 8 | buf[2];
                }
        }
        return buf.subarray(2, buf[1] + 2 - 1); // .toString("utf8")
    }

    private async send(command: number[]) {
        const array = Uint8Array.from(command);
        console.log(command.map((v) => v.toString(16)));
        await this.hid.write(array.buffer);
        const response = await this.hid.read();
        console.log(new Uint8Array(response.buffer));
        return new Uint8Array(response.buffer);
    }
}
