import {CortexM, CortexSpecialReg} from "./cortex_m";
import {Device} from "./device";

export class Breakpoint {
    public lastWritten: number;

    constructor(public parent: CortexM, public index: number) { }

    public async read() {
        return this.parent.readMem(CortexSpecialReg.FP_COMP0 + this.index * 4)
            .then((n) => {
                console.log(`idx=${this.index}, CURR=${n}, LAST=${this.lastWritten}`);
            });
    }

    public async write(num: number) {
        this.lastWritten = num;

        return this.parent.writeMem(CortexSpecialReg.FP_COMP0 + this.index * 4, num);
    }
}
