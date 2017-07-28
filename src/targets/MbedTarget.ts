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

const analyzer = new Uint32Array([
    0x2180468c, 0x2600b5f0, 0x4f2c2501, 0x447f4c2c, 0x1c2b0049, 0x425b4033, 0x40230872, 0x085a4053,
    0x425b402b, 0x40534023, 0x402b085a, 0x4023425b, 0x085a4053, 0x425b402b, 0x40534023, 0x402b085a,
    0x4023425b, 0x085a4053, 0x425b402b, 0x40534023, 0x402b085a, 0x4023425b, 0x085a4053, 0x425b402b,
    0x40534023, 0xc7083601, 0xd1d2428e, 0x2b004663, 0x4663d01f, 0x46b4009e, 0x24ff2701, 0x44844d11,
    0x1c3a447d, 0x88418803, 0x4351409a, 0xd0122a00, 0x22011856, 0x780b4252, 0x40533101, 0x009b4023,
    0x0a12595b, 0x42b1405a, 0x43d2d1f5, 0x4560c004, 0x2000d1e7, 0x2200bdf0, 0x46c0e7f8, 0x000000b6,
    0xedb88320, 0x00000044,
]);

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
        console.log("Uploading anaylyzer");
        await this.memory.writeBlock(0x1ffff000, analyzer);

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
}

export let FlashAlgos = new Map<string, IFlashAlgo>();
FlashAlgos.set("0240", K64F_FLASH_ALGO);
FlashAlgos.set("9900", MICROBIT_FLASH_ALGO);
