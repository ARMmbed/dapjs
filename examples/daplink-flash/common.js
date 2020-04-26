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

const fs = require('fs');
const http = require('http');
const https = require('https');
const readline = require('readline');
const progress = require('progress');
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

// Determine file to grab
const getFile = async () => {
    const fileName = await getFileName();
    if (!fileName) {
        throw new Error('No file name specified');
    }

    if (fileName.indexOf('http') === 0) {
        return downloadFile(fileName);
    }

    return loadFile(fileName);
}

// Load a file
const loadFile = (fileName, isJson = false) => {
    let file = fs.readFileSync(fileName);
    return isJson ? JSON.parse(file) : new Uint8Array(file).buffer;
}

// Download a file
const downloadFile = async (url, isJson = false) => {
    console.log('Downloading file...');
    let scheme = (url.indexOf('https') === 0) ? https : http;

    const data = await new Promise((resolve, reject) => {
        scheme.get(url, response => {
            let data = [];
            response.on('data', chunk => {
                data.push(chunk);
            });
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject(new Error(response.statusMessage));
                } else {
                    resolve(data);
                }
            });
        })
        .on('error', error => {
            reject(error);
        });
    });

    if (isJson) {
        return JSON.parse(data);
    } else {
        let download = Buffer.concat(data);
        return new Uint8Array(download).buffer;
    }
}

// Determine package URL or file path
const getFileName = async () => {
    if (process.argv[2]) {
        return process.argv[2];
    }

    const rl = readline.createInterface(process.stdin, process.stdout);
    const fileName = await new Promise(resolve => {
        rl.question('Enter a URL or file path for the firmware package: ', answer => {
            rl.close();
            resolve(answer);
        });
        rl.write('binaries/k64f-green.bin');
    });

    return fileName;
}

// Select a device from the list
const selectDevice = async (devices) => {
    if (devices.length === 0) {
        throw new Error('No devices found');
    }

    console.log('Select a device to flash:');
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

// Update device using image buffer
const flash = async (transport, program) => {
    console.log(`Using binary file ${program.byteLength} words long`);
    const target = new DAPjs.DAPLink(transport);

    // Set up progressbar
    const progressBar = new progress('Updating firmware [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: program.byteLength
    });

    target.on(DAPjs.DAPLink.EVENT_PROGRESS, progress => {
        progressBar.update(progress);
    });

    // Push binary to board
    await target.connect();
    await target.flash(program);
    await target.disconnect();
}

module.exports = {
    DAPLINK_VENDOR: 0xD28,
    getFile,
    selectDevice,
    flash
};
