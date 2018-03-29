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
                serialData = serialData.subarray(1);
                const emptyResponse = serialData.every((c: any) => {
                    return c === 0;
                });
                if (!emptyResponse) {
                    const data = Buffer.from(serialData.buffer).toString("utf8").substring(1);
                    responseCallback(data);
                }
            }
        }, this.delay);
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
        }
        return await this.dap.writeSerial(arrayData);
    }
}
