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

const USB = require("webusb").USB;
const progress = require("progress");
const getFile = require("./getfile");
const DAPjs = require("../../");

process.stdin.setEncoding("utf8");

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

getFile()
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
