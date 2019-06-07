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

const usb = require("usb");
const common = require("./common");
const DAPjs = require("../../");

// Read USB device descriptor
function getStringDescriptor(device, index) {
    return new Promise((resolve, reject) => {
        try {
            device.open();
        } catch (_e) {
            resolve("");
        }
        device.getStringDescriptor(index, (error, buffer) => {
            device.close();
            if (error) return reject(error);
            resolve(buffer.toString());
        });
    });
}

// Allow user to select a device
function selectDevice(vendorID) {
    return new Promise((resolve, reject) => {
        let devices = usb.getDeviceList();
        devices = devices.filter(device => device.deviceDescriptor.idVendor === vendorID);

        if (devices.length === 0) {
            return reject("No devices found");
        }

        common.inputEmitter.addListener("input", index => {
            if (index <= devices.length) resolve(devices[index - 1]);
        });

        console.log("Select a device to read registers:");
        devices.forEach((device, index) => {
            getStringDescriptor(device, device.deviceDescriptor.iProduct)
            .then(name => {
                console.log(`${index + 1}: ${name}`);
            });
        });    
    });
}

selectDevice(0xD28)
.then(device => {
    const transport = new DAPjs.USB(device);
    return common.readRegisters(transport);
})
.then(() => {
    process.exit();
})
.catch(error => {
    console.error(error.message || error);
    process.exit();
});
