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

// Emit keyboard input
const inputEmitter = new EventEmitter();
process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
    let input;
    while (input = process.stdin.read()) {
        if (input === "\u0003") {
            process.exit();
        } else if (input !== null) {
            let index = parseInt(input);
            inputEmitter.emit("input", index);
        }
    }
});

// Read device registers
function readRegisters(transport) {
    const processor = new DAPjs.CortexM(transport);

    return processor.connect()
    .then(() => {
        return processor.halt();
    })
    .then(() => {
        const registers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        return processor.readCoreRegisters(registers);
    })
    .then(registers => {
        registers.forEach((register, index) => {
            console.log(`R${index}: ${("00000000" + register.toString(16)).slice(-8)}`);
        });
        return processor.resume();
    })
    .then(() => {
        return processor.disconnect();
    });
}

module.exports = {
    inputEmitter: inputEmitter,
    readRegisters: readRegisters
};
