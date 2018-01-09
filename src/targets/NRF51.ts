import {IFlashAlgo, IPlatform} from "./platform";

const NRF51_FLASH_ALGO = {
    analyzerAddress: 0x20003000,  // Analyzer 0x20003000..0x20003600
    analyzerSupported: true,

    beginData: 0x20002000, // Analyzer uses a max of 1 KB data (256 pages * 4 bytes / page)

    flashSize: 0x40000,
    flashStart: 0x0,

    instructions: new Uint32Array([
        0xE00ABE00, 0x062D780D, 0x24084068, 0xD3000040, 0x1E644058, 0x1C49D1FA, 0x2A001E52, 0x4770D1F2,
        0x47702000, 0x47702000, 0x4c26b570, 0x60602002, 0x60e02001, 0x68284d24, 0xd00207c0, 0x60602000,
        0xf000bd70, 0xe7f6f82c, 0x4c1eb570, 0x60612102, 0x4288491e, 0x2001d302, 0xe0006160, 0x4d1a60a0,
        0xf81df000, 0x07c06828, 0x2000d0fa, 0xbd706060, 0x4605b5f8, 0x4813088e, 0x46142101, 0x4f126041,
        0xc501cc01, 0x07c06838, 0x1e76d006, 0x480dd1f8, 0x60412100, 0xbdf84608, 0xf801f000, 0x480ce7f2,
        0x06006840, 0xd00b0e00, 0x6849490a, 0xd0072900, 0x4a0a4909, 0xd00007c3, 0x1d09600a, 0xd1f90840,
        0x00004770, 0x4001e500, 0x4001e400, 0x10001000, 0x40010400, 0x40010500, 0x40010600, 0x6e524635,
        0x00000000,
    ]),

    loadAddress: 0x20000000,
    minProgramLength: 4,

    pageBuffers: [0x20002000, 0x20002400],   // Enable double buffering
    pageSize: 0x400,

    pcEraseAll: 0x20000029,
    pcEraseSector: 0x20000049,
    pcInit: 0x20000021,
    pcProgramPage: 0x20000071,

    stackPointer: 0x20001000,
    staticBase: 0x20000170,
};

export class NRF51 implements IPlatform {
    public flashAlgo: IFlashAlgo;

    constructor() {
        this.flashAlgo = NRF51_FLASH_ALGO;
    }

    public overrideSecurityBits(_address: number, _data: Uint32Array) {
        /* empty */
    }
}
