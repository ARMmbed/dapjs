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
    stackPointer: number;
    staticBase: number;
    instructions: Uint32Array;
    pageBuffers: number[];
}

export interface IMemoryRegion {
    blocksize: number;
    end: number;
    length: number;
    name: string;
    start: number;
    type: string;
}

export class FlashAlgorithm {
    public flashAlgo: IFlashAlgo;
    public memoryMap: IMemoryRegion[];

    public constructor(flashAlgorithmsData: any, deviceCode: string) {
        if (deviceCode in flashAlgorithmsData) {
            this.setFlashingAlgo(flashAlgorithmsData[deviceCode]);
            this.setMemoryMap(flashAlgorithmsData[deviceCode]);
        }
    }

    private setFlashingAlgo(flashAlgorithm: any) {
        const instructions = flashAlgorithm.flash_algo.instructions.map((instruction: string) => {
            return parseInt(instruction, 16);
        });
        const pageBuffers = flashAlgorithm.flash_algo.page_buffers.map((pageBuffer: string) => {
            return parseInt(pageBuffer, 16);
        });
        this.flashAlgo = {
            analyzerAddress: parseInt(flashAlgorithm.flash_algo.analyzer_address, 16),
            analyzerSupported: flashAlgorithm.flash_algo.analyzer_supported,
            loadAddress: parseInt(flashAlgorithm.flash_algo.load_address, 16),
            pcInit: parseInt(flashAlgorithm.flash_algo.pc_init, 16),
            pcEraseAll: parseInt(flashAlgorithm.flash_algo.pc_eraseAll, 16),
            pcEraseSector: parseInt(flashAlgorithm.flash_algo.pc_erase_sector, 16),
            pcProgramPage: parseInt(flashAlgorithm.flash_algo.pc_program_page, 16),
            stackPointer: parseInt(flashAlgorithm.flash_algo.begin_stack, 16),
            staticBase: parseInt(flashAlgorithm.flash_algo.static_base, 16),
            instructions: new Uint32Array(instructions),
            pageBuffers: pageBuffers
        };
    }

    private setMemoryMap(flashAlgorithm: any) {
        this.memoryMap = flashAlgorithm.memory_map.map((region: any) => {
            return {
                blocksize: parseInt(region.blocksize, 16),
                end: parseInt(region.end, 16),
                length: parseInt(region.length, 16),
                name: region.name,
                start: parseInt(region.start, 16),
                type: region.type
            };
        });
    }
}
