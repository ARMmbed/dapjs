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
var usb = require("webusb");
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
        rl.write("binaries/blinky-green.bin");
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

async function connect() {
    var device = await usb.requestDevice({ filters: [{vendorId: 0x0d28}]});
    var deviceCode = device.serialNumber.slice(0, 4);
    var hid = new DAPjs.HID(device);

    // open hid device
    await hid.open();

    console.log("Device opened.");

    var dapDevice = new DAPjs.DAP(hid);
    var target = new DAPjs.FlashTarget(dapDevice, DAPjs.FlashTargets.get(deviceCode));

    console.log("Initialising device.");

    await target.init();

    console.log("Halting target.");

    await target.halt();

    console.log("Target halted.");

    const [imp, isa, type] = await target.readCoreType();
    console.log(`Connected to an ARM ${DAPjs.CoreNames.get(type)} (${DAPjs.ISANames.get(isa)})`);

    return target;
}

// Update device using image
async function flashFirmware(target, buffer) {

    var progressBar = new progress(`Updating firmware [:bar] :percent :etas`, {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: buffer.byteLength
    });

    const array = new Uint32Array(buffer);
    const program = DAPjs.FlashProgram.fromBinary(0, array);

    console.log(`Binary file ${array.length} words long`);

    // Push binary to board
    await target.program(program, (progress) => {
        progressBar.update(progress);
    });

    console.log(`Successfully flashed binary.`);
    console.log("Done.");

    await target.reset();

    // make sure we don't have any issues flashing twice in the same session.
    target.flashUnInit();
}

async function start(file) {
    var target = await connect();
    await flashFirmware(target, file);
    process.exit();
}

getFileName()
.then(fileName => {
    if (!fileName) throw new Error("No file name specified");
    if (fileName.indexOf("http") === 0) return downloadFile(fileName);
    return loadFile(fileName);
})
.then(file => {
    start(file);
})
.catch(error => {
    console.log(error.message || error);
    process.exit();
});
