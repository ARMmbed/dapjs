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

const EventEmitter = require("events");
const DAPjs = require("../../");

const inputEmitter = new EventEmitter();
process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
    let input;
    while (input = process.stdin.read()) {
        if (input !== null) {
            inputEmitter.emit("input", input);
        }
    }
});

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
        console.log(`Listening at ${baud} baud...`);

        inputEmitter.addListener("input", input => {
            if (input === "\u0003") {
                process.stdin.setRawMode(false);
                target.stopSerialRead()

                return target.disconnect()
                .then(() => {
                    process.exit();
                })
            }

            if (input !== null) {
                target.serialWrite(input);
            }
        });
    });
}

module.exports = {
    inputEmitter: inputEmitter,
    listen: listen
};
