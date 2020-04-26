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

    console.log('Select a device to listen to serial output:');
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

// Listen to serial output from the device
const listen = async transport => {
    const target = new DAPjs.DAPLink(transport);

    await target.connect();
    const baud = await target.getSerialBaudrate();
    console.log(`Listening at ${baud} baud...`);

    target.on(DAPjs.DAPLink.EVENT_SERIAL_DATA, data => {
        process.stdout.write(data);
    });
    target.startSerialRead();

    await readHandler((input, resolve) => {
        if (input === '\u0003') {
            resolve();
        } else if (input !== null) {
            target.serialWrite(input);
        }
    });

    target.stopSerialRead();
    await target.disconnect();
}

module.exports = {
    DAPLINK_VENDOR: 0xD28,
    selectDevice,
    listen
};
