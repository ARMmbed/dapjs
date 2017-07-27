/*
 Flash OS Routines (Automagically Generated)
 Copyright (c) 2017-2017 ARM Limited

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

export const MICROBIT_FLASH_ALGO = {
    // Flash algorithm as a hex string
    instructions: new Uint32Array([
        0x47702000, 0x47702000, 0x4c34b4f0, 0x60602002, 0x60e02001, 0x4e334d32, 0x4b344f33, 0x07c06828,
        0x2000d003, 0xbcf06060, 0x68704770, 0x0e000600, 0x6879d0f4, 0xd0f12900, 0x07c2492d, 0x600bd000,
        0x08401d09, 0xe7e9d1f9, 0x4c24b4f0, 0x60612102, 0x42884928, 0x2001d302, 0xe0006160, 0x4e2160a0,
        0x4d234f21, 0x68704b21, 0x0e000600, 0x6879d009, 0xd0062900, 0x07c24629, 0x600bd000, 0x08401d09,
        0x4817d1f9, 0x07c06800, 0x2000d0ed, 0xbcf06060, 0xb4f04770, 0x4911088e, 0x604b2301, 0x4d134f11,
        0xc002ca02, 0x6809490e, 0xd00707c9, 0xd1f71e76, 0x2100480a, 0xbcf06041, 0x47704608, 0x06096879,
        0xd0ef0e09, 0x685b4b08, 0xd0eb2b00, 0x07cc4b08, 0x601dd000, 0x08491d1b, 0xe7e3d1f9, 0x4001e500,
        0x4001e400, 0x40010400, 0x40010500, 0x6e524635, 0x40010600, 0x10001000, 0x00000000
    ]),

    // Relative function addresses
    pcInit: 0x1,
    pcUnInit: 0x5,
    pcProgramPage: 0x93,
    pcEraseSector: 0x49,
    pcEraseAll: 0x9,

    // Relative region addresses and sizes
    roStart: 0x0,
    roSize: 0xf8,
    rwStart: 0xf8,
    rwSize: 0x4,
    ziStart: 0xfc,
    ziSize: 0x0,

    // Flash information
    flashStart: 0x0,
    flashSize: 0x40000,
    pageSize: 0x4,
    sectorSizes: [
        [0x0, 0x400],
    ],

    breakpointLocation: 0x20000001,
    staticBase: 0x20000118,
    stackPointer: 0x20000800,
    loadAddress: 0x20000000
};
    