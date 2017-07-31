/**
 * Specifies all of the parameters associated with a flashing algorithm for a particular device. These
 * can be found in the pyOCD or DAPLink sources, or compiled from the source that can be found here:
 * https://github.com/mbedmicro/FlashAlgo.
 */
export interface IFlashAlgo {
    analyzerAddress: number;
    analyzerSupported: boolean;

    loadAddress: number;

    pcInit: number;
    pcEraseAll: number;
    pcEraseSector: number;
    pcProgramPage: number;

    flashStart: number;
    stackPointer: number;
    staticBase: number;

    instructions: Uint32Array;

    pageSize: number;
    pageBuffers: number[];
}

export interface IPlatform {
    flashAlgo: IFlashAlgo;

    overrideSecurityBits(address: number, data: Uint32Array): void;
}
