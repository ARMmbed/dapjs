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

    console.log('Select a device to read registers:');
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

// Read device registers
const readRegisters = async transport => {
    const processor = new DAPjs.CortexM(transport);

    await processor.connect();
    await processor.halt();
    const registers = await processor.readCoreRegisters([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

    registers.forEach((register, index) => {
        console.log(`R${index}: ${('00000000' + register.toString(16)).slice(-8)}`);
    });

    await processor.resume();
    await processor.disconnect();
}

module.exports = {
    DAPLINK_VENDOR: 0xD28,
    selectDevice,
    readRegisters
};
