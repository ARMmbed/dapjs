/*
* DAPjs
* Copyright Arm Limited 2018
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

/**
 * Vendor-specific commands for DapLink serial access
 * @hidden
 */
export const enum DAPLinkSerial {
    /**
     * Read serial settings
     */
    READ_SETTINGS = 0x81,
    /**
     * Write serial settings
     */
    WRITE_SETTINGS = 0x82,
    /**
     * Read from serial
     */
    READ = 0x83,
    /**
     * Write to serial
     */
    WRITE = 0x84
}

/**
 * Vendor-specific commands for DapLink mass-storage device flashing
 * @hidden
 */
export const enum DAPLinkFlash {
    /**
     * Reset the target
     */
    RESET = 0x89,
    /**
     * Open the MSD
     */
    OPEN = 0x8A,
    /**
     * Close the MSD
     */
    CLOSE = 0x8B,
    /**
     * Write the image
     */
    WRITE = 0x8C
}
