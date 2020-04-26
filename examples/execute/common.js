/*
* The MIT License (MIT)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

const crypto = require('crypto');
const DAPjs = require('../../');

// Handle single character input from the user
const readHandler = (inputHandler, stream = process.stdin) => {
    return new Promise(resolve => {
        stream.setRawMode(true);
        stream.setEncoding('utf8');

        const onResolve = result => {
            stream.off('readable', read);
            stream.setRawMode(false);
            resolve(result);
        }

        const read = () => {
            let input;
            while (input = stream.read()) {
                inputHandler(input, onResolve);
            }
        }

        stream.on('readable', read);
    });
}

// Select a device from the list
const selectDevice = async (devices) => {
    if (devices.length === 0) {
        throw new Error('No devices found');
    }

    console.log('Select a device to execute on:');
    devices.forEach((device, index) => {
        console.log(`${index + 1}: ${device.name}`);
    });

    const device = await readHandler((input, resolve) => {
        if (input === '\u0003') {
            process.exit();
        } else if (input !== null) {
            const index = parseInt(input);
            if (index <= devices.length) {
                resolve(devices[index - 1]);
            }
        }
    });

    return device;
}

const nodeHash = data => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

const deviceHash = async (transport, data) => {
    const processor = new DAPjs.CortexM(transport);
    await processor.connect()
    await processor.halt();
    await processor.setTargetResetState(true);
    const hashdata = await calculateHash(processor, Buffer.from(data));
    let bufferdata = Buffer.alloc(32);
    for (let i = 0; i < hashdata.length; i++) {
        bufferdata.writeUInt32LE(hashdata[i], i*4);
    }
    await processor.reset();
    await processor.disconnect();
    return bufferdata.toString('hex');
};

const calculateHash = async (processor, data) => {
    const RAM_address = 0x20000000;
    const address = RAM_address;
    const pc      = RAM_address + 0x0000033D;
    const r9      = RAM_address + 0x00000474;
    const r0      = RAM_address + 0x00001000;
    const r1      = data.length;
    const r2      = RAM_address + 0x00002000;
    const stack   = RAM_address + 0x00004000;

    const code = new Uint32Array([
        0x4605b570, 0x4616460c, 0xcc0fe002, 0x3e10c50f, 0xd2fa2e10, 0xd3022e08, 0xc503cc03, 0x2e043e08,
        0xcc01d307, 0x1f36c501, 0x7821e003, 0x1c647029, 0x1e761c6d, 0xbd70d2f9, 0x2a04b5f8, 0x0783d32c,
        0x780bd012, 0x70031c49, 0x1e521c40, 0xd00b0783, 0x1c49780b, 0x1c407003, 0x07831e52, 0x780bd004,
        0x70031c49, 0x1e521c40, 0x0f9b078b, 0x1ac9d005, 0x232000df, 0xc9081bde, 0xf7ffe00a, 0xbdf8ffc1,
        0xc908461d, 0x461c40fd, 0x432c40b4, 0x1f12c010, 0xd2f52a04, 0x1ac908f3, 0xd4f01e52, 0x1c49780b,
        0x1c407003, 0xd4ea1e52, 0x1c49780b, 0x1c407003, 0xd4e42a01, 0x70017809, 0xe001bdf8, 0x1f09c004,
        0xd2fb2904, 0xd501078b, 0x1c808002, 0xd00007c9, 0x47707002, 0xd00b2900, 0xd00207c3, 0x1c407002,
        0x29021e49, 0x0783d304, 0x8002d502, 0x1e891c80, 0x2200e7e3, 0x2200e7ee, 0x7803e7df, 0x461978c2,
        0x06127843, 0x4319021b, 0x78c07883, 0x4319041b, 0x02094311, 0x06000a09, 0x47704308, 0x4605b5f8,
        0x460c6908, 0xd0012800, 0xbdf82000, 0x68216862, 0xd30a2a40, 0x46282240, 0xff7ef7ff, 0x30406820,
        0x68606020, 0x60603840, 0x4628e02c, 0xff74f7ff, 0x20406862, 0x68201a81, 0x18801955, 0x20006020,
        0x68e06060, 0xd1052800, 0x70282080, 0x1e492001, 0x60e01c6d, 0xd3122908, 0x3e08460e, 0x46284631,
        0xf7ff68a7, 0x19aaffb6, 0x71d000f8, 0x20060979, 0x0a095411, 0xd5fb1e40, 0x61202001, 0x4628e002,
        0xffa7f7ff, 0xbdf82001, 0x460db5f0, 0xb0eb4961, 0x46044616, 0x44792220, 0xf7ffa853, 0x2000ff21,
        0x90039601, 0x95009602, 0xe0939004, 0xaf5b21ff, 0xa8133101, 0xff8ff7ff, 0xae132500, 0xf7ff4638,
        0xba00ff8c, 0x78f90a00, 0x43080200, 0x1c6d00a9, 0x50701d3f, 0xdbf12d10, 0x00a82510, 0x1846a913,
        0x3e804684, 0x22076c70, 0x41d14601, 0x46032212, 0x405941d3, 0x404108c0, 0x27116fb0, 0x41fa4602,
        0x46032713, 0x405a41fb, 0x40420a80, 0x6c306e73, 0x18c01889, 0x46601842, 0x1c6da913, 0x2d40500a,
        0x2000dbdb, 0x0082a953, 0xab09588d, 0x509d1c40, 0xdbf82808, 0x980d2200, 0x41d82306, 0x250b9b0d,
        0x405841eb, 0x25199b0d, 0x405841eb, 0x9b0d9d0e, 0x402b9e0d, 0x43b59d0f, 0x4e2f406b, 0x447e0095,
        0x9f105976, 0x19be18c0, 0xa8131833, 0x260d5940, 0x9809181d, 0x41d82302, 0x9f0b9b09, 0x405841f3,
        0x26169b09, 0x405841f3, 0x9b0a9e0b, 0x40731c52, 0x40339e09, 0x403e9e0a, 0x18c04073, 0x93109b0f,
        0x930f9b0e, 0x930e9b0d, 0x18289b0c, 0x930d195b, 0x930b9b0a, 0x970c9b09, 0x9009930a, 0xdbba2a40,
        0xab092000, 0x588d0082, 0x1c40589e, 0x508d19ad, 0xdbf72808, 0xa85b4669, 0xff10f7ff, 0xd0002800,
        0x2200e764, 0xa9534610, 0x58cd0093, 0x0e2d1c52, 0x58cd5425, 0x0c2d1c40, 0x5acd5425, 0x0a2d1c40,
        0x5ccb5425, 0x54231c40, 0x2a081c40, 0xb06bdbec, 0x0000bdf0, 0x0000029a, 0x000000d2, 0x460a4613,
        0x4601b510, 0xf7ff4618, 0xb672ff2f, 0x2000be00, 0x0000bd10, 0x428a2f98, 0x71374491, 0xb5c0fbcf,
        0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
        0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6,
        0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
        0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70,
        0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c,
        0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814,
        0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2, 0x6a09e667, 0xbb67ae85, 0x3c6ef372,
        0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19, 0x00000000, 0xBE2A
    ]);

    len = ((data.length % 4) != 0) ? Math.floor(data.length / 4) + 1 : Math.floor(data.length / 4);
    let newdatabuffer = Buffer.alloc(len * 4);
    data.copy(newdatabuffer);
    let newstring = new Uint32Array(len);
    for (let i = 0 ; i < len; i++) {
        newstring[i] = newdatabuffer.readUInt32LE(i*4);
    }
    await processor.writeBlock(r0, newstring);
    await processor.execute(address, code, stack, pc, pc, r0, r1, r2, 0, 0, 0, 0, 0, 0, r9);
    return await processor.readBlock(r2, 8);
};

module.exports = {
    DAPLINK_VENDOR: 0xD28,
    selectDevice,
    nodeHash,
    deviceHash
};
