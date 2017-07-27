import {CortexM} from "../cortex_m";

export abstract class FlashTarget extends CortexM {
    public abstract flashInit(): Promise<number>;
    public abstract eraseChip(): Promise<number>;
    public abstract flash(data: Uint32Array): Promise<void>;
}
