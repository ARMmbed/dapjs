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

var fs = require("fs");
var http = require("http");
var https = require("https");
var readline = require("readline");
var progress = require("progress");
var USB = require("webusb").USB;
var DAPjs = require("../");

process.stdin.setEncoding("utf8");

// Determine package URL or file path
function getFileName() {
    return new Promise((resolve) => {
        if (process.argv[2]) {
            return resolve(process.argv[2]);
        }

        var rl = readline.createInterface(process.stdin, process.stdout);
        rl.question("Enter a URL or file path for the firmware package: ", answer => {
            rl.close();
            resolve(answer);
        });
        rl.write("binaries/k64f-blinky-green.bin");
    });
}

// Load a file, returning a buffer
function loadFile(fileName) {
    var file = fs.readFileSync(fileName);
    return new Uint8Array(file).buffer;
}

// Download a file, returning a buffer
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        console.log("Downloading file...");
        var scheme = (url.indexOf("https") === 0) ? https : http;

        scheme.get(url, response => {
            var data = [];
            response.on("data", chunk => {
                data.push(chunk);
            });
            response.on("end", () => {
                if (response.statusCode !== 200) return reject(response.statusMessage);

                var download = Buffer.concat(data);
                resolve(new Uint8Array(download).buffer);
            });
        })
        .on("error", error => {
            reject(error);
        });
    });
}

// Allow user to select a device
function handleDevicesFound(devices, selectFn) {
    //return devices[0];
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
        var input = process.stdin.read();
        if (input === "\u0003") {
            process.exit();
        } else {
            var index = parseInt(input);
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

// Connect to a device, halt it and return a target to use
function getTarget(device) {
    var target = null;
    var deviceCode = device.serialNumber.slice(0, 4);
    var hid = new DAPjs.HID(device);

    // Open hid device
    return hid.open()
    .then(() => {
        console.log("Device opened");

        var dapDevice = new DAPjs.DAP(hid);
        target = new DAPjs.FlashTarget(dapDevice, DAPjs.FlashTargets.get(deviceCode));
        return target.init();
    })
    .then(() => {
        console.log("Target initialised");
        return target.halt();
    })
    .then(() => {
        console.log("Target halted");
        return target;
    })
}

// Update device using image buffer
function flash(target, buffer) {

    var progressBar = new progress("Updating firmware [:bar] :percent :etas", {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: buffer.byteLength
    });
    const program = DAPjs.FlashProgram.fromArrayBuffer(buffer);

    console.log(`Using binary file ${buffer.byteLength} words long`);

    // Push binary to board
    return target.program(program, (progress) => {
        progressBar.update(progress);
    })
    .then(() => {
        return target.reset();
    })
    .then(() => {
        console.log("Target reset");
        // Make sure we don't have any issues flashing twice in the same session.
        return target.flashUnInit();
    });
}

var usb = new USB({
    devicesFound: handleDevicesFound
});

getFileName()
.then(fileName => {
    if (!fileName) throw new Error("No file name specified");
    if (fileName.indexOf("http") === 0) return downloadFile(fileName);
    return loadFile(fileName);
})
.then(buffer => {
    return usb.requestDevice({
        filters: [{vendorId: 0x0d28}]
    })
    .then(device => {
        return getTarget(device);
    })
    .then(target => {
        return flash(target, buffer);
    });
})
.then(() => {
    process.exit();
})
.catch(error => {
    console.log(error.message || error);
    process.exit();
});
