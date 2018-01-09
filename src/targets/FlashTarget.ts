import {CortexReg} from "../cortex/constants";
import {CortexM} from "../cortex/cortex";
import {DAP} from "../dap/dap";
import {IPlatform} from "./platform";

import {FlashProgram} from "./FlashProgram";

import {K64F} from "./K64F";
import {NRF51} from "./NRF51";

/**
 * Analyzer code blob, from PyOCD. This can be used to compute a table of CRC
 * values. See https://github.com/mbedmicro/pyOCD/tree/master/src/analyzer.
 */
const analyzer = new Uint32Array([
    0x2180468c, 0x2600b5f0, 0x4f2c2501, 0x447f4c2c, 0x1c2b0049, 0x425b4033, 0x40230872, 0x085a4053,
    0x425b402b, 0x40534023, 0x402b085a, 0x4023425b, 0x085a4053, 0x425b402b, 0x40534023, 0x402b085a,
    0x4023425b, 0x085a4053, 0x425b402b, 0x40534023, 0x402b085a, 0x4023425b, 0x085a4053, 0x425b402b,
    0x40534023, 0xc7083601, 0xd1d2428e, 0x2b004663, 0x4663d01f, 0x46b4009e, 0x24ff2701, 0x44844d11,
    0x1c3a447d, 0x88418803, 0x4351409a, 0xd0122a00, 0x22011856, 0x780b4252, 0x40533101, 0x009b4023,
    0x0a12595b, 0x42b1405a, 0x43d2d1f5, 0x4560c004, 0x2000d1e7, 0x2200bdf0, 0x46c0e7f8, 0x000000b6,
    0xedb88320, 0x00000044,
]);

/**
 * # Flash Target
 *
 * Represents a target device containing a flash region. In rare cases that a
 * target chip only has RAM, uploading a program is as simple as writing a
 * block of data to memory.
 *
 * ## Usage
 *
 * Initialising the `FlashTarget` object is the same as configuring a Cortex-M
 * object, but with an additional parameter for the platform (contains the
 * flashing algorithm and memory layout).
 *
 * ```typescript
 * import {K64F, DAP, FlashTarget} from "dapjs";
 *
 * // make sure hid is an object implementing the `IHID` interface.
 * const dap = new DAP(hid);
 * const device = new FlashTarget(dap, K64F);
 * ```
 *
 * Now, we can do all of the operations you'd expect. As usual, these examples
 * work in a function marked `async`. Alternatively, they can be implemented
 * using Promises directly.
 *
 * ```typescript
 * await device.eraseChip();
 *
 * // flash a hex program
 *
 * ```
 */
export class FlashTarget extends CortexM {
    protected platform: IPlatform;
    private inited: boolean;

    constructor(device: DAP, platform: IPlatform) {
        super(device);

        this.platform = platform;
        this.inited = false;
    }

    /**
     * Initialise the flash driver on the chip. Must be called before any of the other
     * flash-related methods.
     */
    public async flashInit() {
        if (this.inited) {
            return;
        }

        // reset and halt
        await this.reset(true);

        // make sure we're in Thumb mode.
        await this.writeCoreRegister(CortexReg.XPSR, 1 << 24);
        await this.writeCoreRegister(CortexReg.R9, this.platform.flashAlgo.staticBase);

        // upload analyzer
        if (this.platform.flashAlgo.analyzerSupported) {
            await this.memory.writeBlock(this.platform.flashAlgo.analyzerAddress, analyzer);
        }

        const result = await this.runCode(
            this.platform.flashAlgo.instructions,
            this.platform.flashAlgo.loadAddress,
            this.platform.flashAlgo.pcInit,
            this.platform.flashAlgo.loadAddress + 1,
            this.platform.flashAlgo.stackPointer,
            true,
            0, 0, 0, 0,
        );

        this.inited = true;
        return result;
    }

    /**
     * Erase _all_ data stored in flash on the chip.
     */
    public async eraseChip() {
        if (!this.inited) {
            await this.flashInit();
        }

        const result = await this.runCode(
            this.platform.flashAlgo.instructions,
            this.platform.flashAlgo.loadAddress,
            this.platform.flashAlgo.pcEraseAll,
            this.platform.flashAlgo.loadAddress + 1,
            this.platform.flashAlgo.stackPointer,
            false,
            0, 0, 0,
        );

        return result;
    }

    /**
     * Flash a contiguous block of data to flash at a specified address.
     *
     * @param data Array of 32-bit integers to write to flash.
     * @param address Memory address in flash to write to.
     * @param progressCb Callback to keep track of progress through upload (from 0.0 to 1.0)
     */
    public async flash(data: Uint32Array, address?: number, progressCb?: (progress: number) => void) {
        if (!this.inited) {
            await this.flashInit();
        }

        const pageSizeWords = this.platform.flashAlgo.pageSize / 4;
        const bufferAddress = this.platform.flashAlgo.pageBuffers[0];
        const flashStart = address || this.platform.flashAlgo.flashStart;

        // How far through `data` are we (in bytes)
        let ptr = 0;

        while (ptr < data.byteLength) {
            const wordPtr = ptr / 4;

            const pageData = data.subarray(wordPtr, wordPtr + pageSizeWords);
            const flashAddress = flashStart + ptr;

            await this.memory.writeBlock(bufferAddress, pageData);
            await this.runCode(
                this.platform.flashAlgo.instructions,
                this.platform.flashAlgo.loadAddress,
                this.platform.flashAlgo.pcProgramPage, // pc
                this.platform.flashAlgo.loadAddress + 1, // lr
                this.platform.flashAlgo.stackPointer, // sp
                /* upload? */
                false,
                /* args */
                flashAddress, this.platform.flashAlgo.pageSize, bufferAddress,
            );

            if (progressCb) {
                progressCb(ptr / data.byteLength);
            }
            ptr += pageData.byteLength;
        }

        if (progressCb) {
            progressCb(1.0);
        }
    }

    /**
     * Upload a program consisting of one or more disjoint sections to flash.
     *
     * @param program Program to be uploaded
     * @param progressCb Callback to receive progress updates (from 0.0 to 1.0)
     */
    public async program(program: FlashProgram, progressCb: (progress: number) => void) {
        await this.flashInit();
        await this.eraseChip();

        const totalBytes = program.totalByteLength();
        let cumulativeBytes = 0;

        // const startTime = Date.now();

        for (const section of program.sections) {
            await this.flash(section.data, section.address, progress => {
                const sectionBytes = section.data.byteLength * progress;
                progressCb((cumulativeBytes + sectionBytes) / totalBytes);
            });

            cumulativeBytes += section.data.byteLength;
        }

        // const endTime = Date.now();
        // const elapsedTime = endTime - startTime;

        // const transferRate = totalBytes / elapsedTime; // B/ms == kB/s

        await this.flashUnInit();
        progressCb(1.0);
    }

    /**
     * Un-init the flash algorithm. Commonly, we use this to ensure that the flashing
     * algorithms are re-uploaded after resets.
     */
    public flashUnInit() {
        this.inited = false;
    }
}

/**
 * Map of mbed device codes to platform objects. Can be used by applications
 * to dynamically select flashing algorithm based on the devices connected to
 * the computer.
 *
 * > *TODO:* extend the mbed devices API to include data stored here, so that we can
 * > expand to cover all devices without needing to update DAP.js.
 */
export let FlashTargets = new Map<string, IPlatform>();
FlashTargets.set("0240", new K64F());
FlashTargets.set("9900", new NRF51());
