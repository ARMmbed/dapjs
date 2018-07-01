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
 * DAP Ports
 */
export const enum DapPort {
    DEBUG = 0x00, // DP
    ACCESS = 0x01 // AP
}

/**
 * DAP Register Transfer Modes
 */
export const enum TransferMode {
    WRITE = 0x00,
    READ = 0x02
}

/**
 * CMSIS-DAP Commands
 */
export const enum DapCommand {
    DAP_INFO = 0x00,
    DAP_HOST_STATUS = 0x01,
    DAP_CONNECT = 0x02,
    DAP_DISCONNECT = 0x03,
    DAP_TRANSFER_CONFIGURE = 0x04,
    DAP_TRANSFER = 0x05,
    DAP_TRANSFER_BLOCK = 0x06,
    DAP_TRANSFER_ABORT = 0x07,
    DAP_WRITE_ABORT = 0x08,
    DAP_DELAY = 0x09,
    DAP_RESET_TARGET = 0x0A,
    DAP_SWJ_PINS = 0x10,
    DAP_SWJ_CLOCK = 0x11,
    DAP_SWJ_SEQUENCE = 0x12,
    DAP_SWD_CONFIGURE = 0x13,
    DAP_JTAG_SEQUENCE = 0x14,
    DAP_JTAG_CONFIGURE = 0x15,
    DAP_JTAG_ID_CODE = 0x16,
    DAP_SWO_TRANSPORT = 0x17,
    DAP_SWO_MODE = 0x18,
    DAP_SWO_BAUD_RATE = 0x19,
    DAP_SWO_CONTROL = 0x1A,
    DAP_SWO_STATUS = 0x1B,
    DAP_SWO_DATA = 0x1C,
    DAP_SWD_SEQUENCE = 0x1D,
    DAP_SWO_EXTENDED_STATUS = 0x1E,
    DAP_EXECUTE_COMMANDS = 0x7F,
    DAP_QUEUE_COMMANDS = 0x7E
}

/**
 * CMSIS-DAP Command Response
 */
export const enum DapResponse {
    DAP_OK = 0x00,
    DAP_ERROR = 0xFF
}

/**
 * CMSIS-DAP Info Request
 */
export const enum DapInfoRequest {
    VENDOR_ID = 0x01,
    PRODUCT_ID = 0x02,
    SERIAL_NUMBER = 0x03,
    CMSIS_DAP_FW_VERSION = 0x04,
    TARGET_DEVICE_VENDOR = 0x05,
    TARGET_DEVICE_NAME = 0x06,
    CAPABILITIES = 0xF0,
    TEST_DOMAIN_TIMER = 0xF1,
    SWO_TRACE_BUFFER_SIZE = 0xFD,
    PACKET_COUNT = 0xFE,
    PACKET_SIZE = 0xFF,
}

/**
 * CMSIS-DAP Host Status Type
 */
export const enum DapHostStatusType {
    CONNECT = 0,
    RUNNING = 1
}

/**
 * CMSIS-DAP Host Status Response
 */
export const enum DapHostStatusResponse {
    FALSE = 0,
    TRUE = 1
}

/**
 * CMSIS-DAP Connect Port
 */
export const enum DapConnectPort {
    DEFAULT = 0,
    SWD = 1,
    JTAG = 2
}

/**
 * CMSIS-DAP Connect Response
 */
export const enum DapConnectResponse {
    FAILED = 0,
    SWD = 1,
    JTAG = 2
}

/**
 * CMSIS-DAP Reset Target Execute Response
 */
export const enum DapResetTargeExecuteResponse {
    NO_RESET_SEQUENCE = 0,
    RESET_SEQUENCE = 1
}

/**
 * CMSIS-DAP SWO Transport
 */
export const enum DapSwoTransport {
    NONE = 0,
    READ = 1,
    SEND = 2
}

/**
 * CMSIS-DAP SWO Mode
 */
export const enum DapSwoMode {
    OFF = 0,
    UART = 1,
    MANCHESTER = 2
}

/**
 * CMSIS-DAP SWO Control
 */
export const enum DapSwoControl {
    STOP = 0,
    START = 1
}

/**
 * CMSIS-DAP Transfer Response
 */
export const enum DapTransferResponse {
    OK = 0x01,
    WAIT = 0x02,
    FAULT = 0x04,
    NO_ACK = 0x07,
    PROTOCOL_ERROR = 0x08,
    VALUE_MISMATCH = 0x10
}
