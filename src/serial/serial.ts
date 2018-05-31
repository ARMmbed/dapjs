import {DAP} from "../dap/dap";
import {addInt32} from "../util";

export class Serial {
    private dap: DAP;
    private timer: any;
    private delay: number;

    constructor(dap: DAP) {
        this.dap = dap;
    }

    public async initialize(baudRate: number, delay = 200) {
        this.delay = delay;
        const serialConfig: number[] = [];
        addInt32(serialConfig, baudRate);
        await this.dap.initializeSerial(serialConfig);
    }

    public async start(responseCallback?: (serialData: string) => void) {
        this.timer = setInterval(async () => {
            let serialData = await this.dap.readSerial();
            if (serialData.byteLength > 0) {
                // check if there is any data returned from the device
                if (serialData[0] !== 0x0) {
                    // remove information about data length
                    serialData = serialData.subarray(1);
                    const data = String.fromCharCode.apply(null, new Uint16Array(serialData));
                    responseCallback(data);
                }
            }
        }, this.delay);
    }

    public async getSerialSettings() {
        return this.dap.readSerialSettings();
    }

    public async stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    public async write(data: string) {
        let arrayData = [];
        if (data || data !== "") {
            arrayData = data.split("").map((e: any) => e.charCodeAt());
            arrayData.unshift(arrayData.length);
        }
        return await this.dap.writeSerial(arrayData);
    }
}
