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

const usb = require('usb');
const common = require('./common');
const DAPjs = require('../../');

// Read USB device descriptor
const getStringDescriptor = async (device, index) => {
    try {
        device.open();
    } catch (_e) {
        return '';
    }

    return new Promise((resolve, reject) => {
        device.getStringDescriptor(index, (error, buffer) => {
            device.close();
            if (error) {
                reject(new Error(error));
            } else {
                resolve(buffer.toString());
            }
        });
    });
}

// List all devices
const getDevices = async (vendorID) => {
    let devices = usb.getDeviceList();
    devices = devices.filter(device => device.deviceDescriptor.idVendor === vendorID);

    for (device of devices) {
        device.name = await getStringDescriptor(device, device.deviceDescriptor.iProduct);
    }

    return devices;
}

(async () => {
    try {
        const program = await common.getFile();
        const devices = await getDevices(common.DAPLINK_VENDOR);
        const device = await common.selectDevice(devices);
        const transport = new DAPjs.USB(device);
        await common.flash(transport, program);
    } catch(error) {
        console.error(error.message || error);
    }
    process.exit();
})();
