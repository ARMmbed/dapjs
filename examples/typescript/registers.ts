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

import { WebUSB, CortexM } from 'dapjs';

export interface USB {
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
}

export class Registers {

    constructor(private usb: USB = navigator.usb) {
    }

    public async read(count: number): Promise<string[]> {
        const device = await this.usb.requestDevice({
            filters: [{vendorId: 0xD28}]
        });

        const transport = new WebUSB(device);
        const processor = new CortexM(transport);

        await processor.connect();
        await processor.halt();

        const registers = Array.from({ length: count }, (_, index) => index);
        const values = await processor.readCoreRegisters(registers);

        await processor.resume();
        await processor.disconnect();

        const result = values.map(register => ('00000000' + register.toString(16)).slice(-8));
        return result;
    }
}
