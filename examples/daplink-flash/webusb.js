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

const USB = require('webusb').USB;
const common = require('./common');
const DAPjs = require('../../');

// Allow user to select a device
const devicesFound = async (devices) => {
    for (device of devices) {
        device.name = device.productName || device.serialNumber;
    }

    return common.selectDevice(devices);
}

const usb = new USB({ devicesFound });

(async () => {
    try {
        const program = await common.getFile();
        const device = await usb.requestDevice({
            filters: [{vendorId: common.DAPLINK_VENDOR}]
        })
        const transport = new DAPjs.WebUSB(device);
        await common.flash(transport, program);
    } catch(error) {
        console.error(error.message || error);
    }
    process.exit();
})();
