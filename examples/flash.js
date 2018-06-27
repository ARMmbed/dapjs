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

const fs = require("fs");
const http = require("http");
const https = require("https");
const readline = require("readline");
const progress = require("progress");
const USB = require("webusb").USB;
const DAPjs = require("../");

process.stdin.setEncoding("utf8");

// Determine package URL or file path
function getFileName() {
    return new Promise((resolve) => {
        if (process.argv[2]) {
            return resolve(process.argv[2]);
        }

        let rl = readline.createInterface(process.stdin, process.stdout);
        rl.question("Enter a URL or file path for the firmware package: ", answer => {
            rl.close();
            resolve(answer);
        });
        rl.write("binaries/k64f-blinky-green.bin");
    });
}

// Load a file
function loadFile(fileName, isJson=false) {
    let file = fs.readFileSync(fileName);
    return isJson ? JSON.parse(file) : new Uint8Array(file).buffer;
}

// Download a file
function downloadFile(url, isJson=false) {
    return new Promise((resolve, reject) => {
        console.log("Downloading file...");
        let scheme = (url.indexOf("https") === 0) ? https : http;

        scheme.get(url, response => {
            let data = [];
            response.on("data", chunk => {
                data.push(chunk);
            });
            response.on("end", () => {
                if (response.statusCode !== 200) return reject(response.statusMessage);

                let download = Buffer.concat(data);
                if (isJson) {
                    resolve(JSON.parse(data));
                }
                else {
                    resolve(new Uint8Array(download).buffer);
                }
            });
        })
        .on("error", error => {
            reject(error);
        });
    });
}

// Allow user to select a device
function handleDevicesFound(devices, selectFn) {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
        let input = process.stdin.read();
        if (input === "\u0003") {
            process.exit();
        } else {
            let index = parseInt(input);
            if (index && index <= devices.length) {
                process.stdin.setRawMode(false);
                selectFn(devices[index - 1]);
            }
        }
    });

    console.log("Select a device to flash:");
    devices.forEach((device, index) => {
        console.log(`${index + 1}: ${device.productName || device.serialNumber}`);
    });
}

// Update device using image buffer
function flash(device, program) {

    console.log(`Using binary file ${program.byteLength} words long`);
    let transport = new DAPjs.WebUSB(device);
    let target = new DAPjs.DapLink(transport);

    // Set up progressbar
    let progressBar = new progress("Updating firmware [:bar] :percent :etas", {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: program.byteLength
    });

    target.on(DAPjs.DapLink.EVENT_PROGRESS, progress => {
        progressBar.update(progress);
    });

    // Push binary to board
    return target.connect()
    .then(() => {
        return target.flash(program);
    })
    .then(() => {
        return target.disconnect();
    });
}

let usb = new USB({
    devicesFound: handleDevicesFound
});

getFileName()
.then(fileName => {
    if (!fileName) throw new Error("No file name specified");
    if (fileName.indexOf("http") === 0) return downloadFile(fileName);
    return loadFile(fileName);
})
.then(program => {
    return usb.requestDevice({
        filters: [{vendorId: 0x0d28}]
    })
    .then(device => {
        return flash(device, program);
    });
})
.then(() => {
    process.exit();
})
.catch(error => {
    console.log(error.message || error);
    process.exit();
});
