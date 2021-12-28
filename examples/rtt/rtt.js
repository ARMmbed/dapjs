/*
*
* Copyright (C) 2021 Ciro Cattuto <ciro.cattuto@gmail.com>
*
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

// RTT configuration
const rttAddr = 0x20000000;
const rttRange = 0x10000;
const rttSignature = "53454747455220525454"; // "SEGGER RTT"


class RTT {
    processor = null;
    numBufUp = 0;
    numBufDown = 0;
    bufUp = {};
    bufDown = {};

    constructor (processor) {
        this.processor = processor;
    }

    async init () {
        let scanBlockSize = 0x1000 ;
        let scanStride = 0x0800;

        // locate RTT control block
        console.log("Locating RTT control block...");

        // inspect 4kB windows, advancing with a 2kB stride
        for (var offset=0; offset < rttRange; offset += scanStride) {
            console.log(" scanning at", offset.toString(16));
            var data32 = await this.processor.readBlock(rttAddr + offset, scanBlockSize / 4);
            var data = new Uint8Array(data32.buffer);
            var sigIndex = this.toHexString(data).indexOf(rttSignature) / 2;
            if (sigIndex >= 0)
                break;
        }

        if (sigIndex >= 0) {
            var rttCtrlAddr = rttAddr + offset + sigIndex;
            console.log(" found at 0x" + rttCtrlAddr.toString(16));
        } else {
            console.log(" not found.");
            return -1;
        }

        // load control block
        data32 = await this.processor.readBlock(rttCtrlAddr, scanBlockSize / 4);
        data = new Uint8Array(data32.buffer);
        var dv = new DataView(data.buffer);

        // number of up- and down-buffers
        this.numBufUp = dv.getUint32(16, true);
        this.numBufDown = dv.getUint32(16+4, true);

        // up-buffers (target to host)
        for (let bufIndex=0; bufIndex < this.numBufUp; bufIndex++) {
            let bufOffset = 24 + bufIndex*24;
            this.bufUp[bufIndex] = {}
            var rttBuf = this.bufUp[bufIndex];
            rttBuf['bufAddr'] = rttCtrlAddr + bufOffset;
            rttBuf['pBuffer'] = dv.getUint32(bufOffset + 4, true);
            rttBuf['SizeOfBuffer'] = dv.getUint32(bufOffset + 8, true);
            rttBuf['WrOff'] = dv.getUint32(bufOffset + 12, true);
            rttBuf['RdOff'] = dv.getUint32(bufOffset + 16, true);
            rttBuf['Flags'] = dv.getUint32(bufOffset + 20, true);
        }

        // down-buffers (host to target)
        for (let bufIndex=0; bufIndex < this.numBufUp; bufIndex++) {
            let bufOffset = 24 + (this.numBufUp + bufIndex)*24;
            this.bufDown[bufIndex] = {}
            var rtt_buf = this.bufDown[bufIndex];
            rtt_buf['bufAddr'] = rttCtrlAddr + bufOffset;
            rtt_buf['pBuffer'] = dv.getUint32(bufOffset + 4, true);
            rtt_buf['SizeOfBuffer'] = dv.getUint32(bufOffset + 8, true);
            rtt_buf['WrOff'] = dv.getUint32(bufOffset + 12, true);
            rtt_buf['RdOff'] = dv.getUint32(bufOffset + 16, true);
            rtt_buf['Flags'] = dv.getUint32(bufOffset + 20, true);
        }

        return this.numBufUp + this.numBufDown;
    }

    toHexString (byteArray) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    async read (bufId) {
        var buf = this.bufUp[bufId];

        buf.RdOff = await this.processor.readMem32(buf.bufAddr + 16);
        buf.WrOff = await this.processor.readMem32(buf.bufAddr + 12);

        if (buf.WrOff > buf.RdOff) {
            var data = await this.processor.readBytes(buf.pBuffer + buf.RdOff, buf.WrOff - buf.RdOff);
        } else if (buf.WrOff < buf.RdOff) {
            let data1 = await this.processor.readBytes(buf.pBuffer + buf.RdOff, buf.SizeOfBuffer - buf.RdOff);
            let data2 = await this.processor.readBytes(buf.pBuffer, buf.WrOff);
            var data = new Uint8Array(data1.length + data2.length);
            data.set(data1, 0);
            data.set(data2, data1.length);
        } else {
            return new Uint8Array(0);
        }

        buf.RdOff = buf.WrOff;
        await this.processor.writeMem32(buf.bufAddr + 16, buf.RdOff);

        return data;
    }

    async write (bufId, data) {
        var buf = this.bufDown[bufId];

        buf.RdOff = await this.processor.readMem32(buf.bufAddr + 16);
        buf.WrOff = await this.processor.readMem32(buf.bufAddr + 12);

        if (buf.WrOff >= buf.RdOff)
            var num_avail = buf.SizeOfBuffer - (buf.WrOff - buf.RdOff);
        else
            var num_avail = buf.RdOff - buf.WrOff - 1;
        
        if (num_avail < data.length)
            return -1;

        for (let i=0; i<data.length; i++) {
            await this.processor.writeMem8(buf.pBuffer + buf.WrOff, data[i]);
            if (++buf.WrOff == buf.SizeOfBuffer)
                buf.WrOff = 0;
        }
        await this.processor.writeMem32(buf.bufAddr + 12, buf.WrOff);

        return data.length;
    }
}
