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

const DAPjs = require("../../");

// Listen to serial output from the device
function listen(transport) {
    const target = new DAPjs.DAPLink(transport);

    target.on(DAPjs.DAPLink.EVENT_SERIAL_DATA, data => {
        console.log(data);
    });

    return target.connect()
    .then(() => {
        return target.getSerialBaudrate();
    })
    .then(baud => {
        target.startSerialRead();
        console.log(`Listening at ${baud} baud, press a key to stop...`);
    
        process.stdin.setRawMode(true);
        process.stdin.on("data", () => {
            process.stdin.setRawMode(false);
            target.stopSerialRead()

            return target.disconnect()
            .then(() => {
                process.exit();
            })
        });
    });
}

module.exports = {
    listen: listen
};
