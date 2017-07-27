import {CoreState, CortexM, CortexReg, CortexSpecialReg} from "../cortex_m";
import {Device} from "../device";
import {FlashTarget} from "./FlashTarget";

import {K64F_FLASH_ALGO} from "./K64F";
import {MICROBIT_FLASH_ALGO} from "./microbit";

/**
 * Specifies all of the parameters associated with a flashing algorithm for a particular device. These
 * can be found in the pyOCD or DAPLink sources, or compiled from the source that can be found here:
 * https://github.com/mbedmicro/FlashAlgo.
 */
export interface IFlashAlgo {
    loadAddress: number;
    pcInit: number;
    pcEraseAll: number;
    pcEraseSector: number;
    pcProgramPage: number;
    stackPointer: number;
    staticBase: number;
    instructions: Uint32Array;
    breakpointLocation: number;
    pageSize: number;
    flashStart: number;
}

export class MbedTarget extends FlashTarget {
    private flashAlgo: IFlashAlgo;

    constructor(device: Device, flashAlgo: IFlashAlgo) {
        super(device);

        this.flashAlgo = flashAlgo;
    }

    /**
     * Initialise the flash driver on the chip. Must be called before any of the other
     * flash-related methods.
     *
     * **TODO**: check that this has been called before calling other flash methods.
     */
    public async flashInit() {
        await this.halt();

        await this.writeCoreRegister(CortexReg.R9, this.flashAlgo.staticBase);

        const result = await this.runCode(
            this.flashAlgo.instructions,
            this.flashAlgo.loadAddress,
            this.flashAlgo.loadAddress + 1,
            this.flashAlgo.breakpointLocation,
            this.flashAlgo.stackPointer,
            true,
            0, 0, 0,
        );

        // the board should be reset etc. afterwards
        // we should also probably run the flash unInit routine

        return result;
    }

    /**
     * Erase _all_ data stored in flash on the chip.
     */
    public async eraseChip() {
        await this.halt();
        await this.writeCoreRegister(CortexReg.R9, this.flashAlgo.staticBase);

        const result = await this.runCode(
            this.flashAlgo.instructions,
            this.flashAlgo.loadAddress,
            this.flashAlgo.pcEraseAll + this.flashAlgo.loadAddress + 0x20,
            this.flashAlgo.breakpointLocation,
            this.flashAlgo.stackPointer,
            false,
            0, 0, 0,
        );

        return result;
    }

    /**
     * Upload a program to flash memory on the chip.
     *
     * @param data Array of 32-bit integers to write to flash.
     */
    public async flash(data: Uint32Array) {
        await this.halt();
        await this.writeCoreRegister(CortexReg.R9, this.flashAlgo.staticBase);

        for (let ptr = 0; ptr < data.length; ptr += this.flashAlgo.pageSize) {
            const writeLength = Math.min(data.length - ptr, this.flashAlgo.pageSize);
            const startAddress = this.flashAlgo.flashStart + ptr;
            const bufferAddress = this.flashAlgo.staticBase;

            console.log(`Writing program to memory: ${bufferAddress} ${data.length}`)
            await this.memory.writeBlock(bufferAddress, data.slice(ptr, ptr + this.flashAlgo.pageSize));

            console.log("Running flashing algorithm");
            const result = await this.runCode(
                this.flashAlgo.instructions,
                this.flashAlgo.loadAddress,
                this.flashAlgo.pcProgramPage + this.flashAlgo.loadAddress + 0x20, // pc
                this.flashAlgo.breakpointLocation, // lr
                this.flashAlgo.stackPointer, // sp
                /* upload? */
                ptr === 0,
                /* args */
                startAddress, writeLength, bufferAddress,
            );

            console.log("Flashed first block.");
        }
    }

    private async resetStopOnReset() {
        console.log("reset stop on Reset");

        await this.halt();

        const demcr = await this.memory.read32(CortexSpecialReg.DEMCR);

        await this.memory.write32(CortexSpecialReg.DEMCR, demcr | CortexSpecialReg.DEMCR_VC_CORERESET);
        await this.reset();

        await this.waitForHalt();

        await this.memory.write32(CortexSpecialReg.DEMCR, demcr);
    }
}

export let FlashAlgos = new Map<string, IFlashAlgo>();
FlashAlgos.set('0240', K64F_FLASH_ALGO);
FlashAlgos.set('9900', MICROBIT_FLASH_ALGO);
