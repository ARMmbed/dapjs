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

import { stdin } from 'process';
import { USB } from 'webusb';
import { Registers } from './registers';

// Handle single character input from the user
const readHandler = <T>(inputHandler: (input: string, onResolve: (result: T) => void) => void, stream: NodeJS.ReadStream = stdin): Promise<T> => {
    return new Promise(resolve => {
        stream.setRawMode!(true);
        stream.setEncoding('utf8');

        const onResolve = (result: T) => {
            stream.removeListener('readable', read);
            stream.setRawMode!(false);
            resolve(result);
        };

        const read = () => {
            let input: string | Buffer;
            while (input = stream.read()) {
                if (input) {
                    inputHandler(input.toString(), onResolve);
                }
            }
        };

        stream.addListener('readable', read);
    });
};

// Select a device from the list
const devicesFound = async (devices: USBDevice[]): Promise<USBDevice | undefined> => {
    if (devices.length === 0) {
        throw new Error('No devices found');
    }

    console.log('Select a device to read registers:');
    devices.forEach((device, index) => {
        console.log(`${index + 1}: ${device.productName || device.serialNumber}`);
    });

    const device = await readHandler<USBDevice>((input, resolve) => {
        if (input === '\u0003') {
            process.exit();
        } else {
            const index = parseInt(input);
            if (index && index <= devices.length) {
                resolve(devices[index - 1]);
            }
        }
    });

    return device;
};

const usb = new USB({ devicesFound });
const registers = new Registers(usb);

(async () => {
    try {
        const values = await registers.read(16);
        values.forEach((register, index) => {
            console.log(`R${index}: ${register}`);
        });
    } catch(error) {
        console.error(error.message || error);
    }
    process.exit();
})();
