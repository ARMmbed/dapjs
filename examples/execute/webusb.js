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
const common = require("./common");
const DAPjs = require("../../");

const data = "hello world";

// Allow user to select a device
function handleDevicesFound(devices, selectFn) {

    common.inputEmitter.addListener("input", index => {
        if (index && index <= devices.length) selectFn(devices[index - 1]);
    });

    console.log("Select a device to listen to execute on:");
    devices.forEach((device, index) => {
        console.log(`${index + 1}: ${device.productName || device.serialNumber}`);
    });
}

const run = async data => {
    try {
        common.setupEmitter();
        let usb = new USB({
            devicesFound: handleDevicesFound
        });
        const device = await usb.requestDevice({
            filters: [{vendorId: 0xD28}]
        });
        const transport = new DAPjs.WebUSB(device);
        const deviceHash = await common.deviceHash(transport, data);
        const nodeHash = common.nodeHash(data);

        console.log(deviceHash);
        console.log(nodeHash);
        console.log(deviceHash === nodeHash ? "match" : "mismatch");    
    } catch (error) {
        console.error(error.message || error);
    }
    process.exit();
}

(async () => await run(data))();
