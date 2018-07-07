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
 * CMSIS-DAP Protocol
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Connect.html
 */
export const enum DAPProtocol {
    /**
     * Default mode: configuration of the DAP port mode is derived from DAP_DEFAULT_PORT
     */
    DEFAULT = 0,
    /**
     * SWD mode: connect with Serial Wire Debug mode
     */
    SWD = 1,
    /**
     * JTAG mode: connect with 4/5-pin JTAG mode
     */
    JTAG = 2
}

/**
 * DAP Ports
 */
export const enum DAPPort {
    /**
     * Debug Port (DP)
     */
    DEBUG = 0x00,
    /**
     * Access Port (AP)
     */
    ACCESS = 0x01
}

/**
 * DAP Register Transfer Modes
 */
export const enum DAPTransferMode {
    /**
     * Write
     */
    WRITE = 0x00,
    /**
     * Read
     */
    READ = 0x02
}

/**
 * CMSIS-DAP Commands
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__genCommands__gr.html
 */
export const enum DAPCommand {
    /**
     * Get Information about CMSIS-DAP Debug Unit
     */
    DAP_INFO = 0x00,
    /**
     * Sent status information of the debugger to Debug Unit
     */
    DAP_HOST_STATUS = 0x01,
    /**
     * Connect to Device and selected DAP mode
     */
    DAP_CONNECT = 0x02,
    /**
     * Disconnect from active Debug Port
     */
    DAP_DISCONNECT = 0x03,
    /**
     * Configure Transfers
     */
    DAP_TRANSFER_CONFIGURE = 0x04,
    /**
     * Read/write single and multiple registers
     */
    DAP_TRANSFER = 0x05,
    /**
     * Read/Write a block of data from/to a single register
     */
    DAP_TRANSFER_BLOCK = 0x06,
    /**
     * Abort current Transfer
     */
    DAP_TRANSFER_ABORT = 0x07,
    /**
     * Write ABORT Register
     */
    DAP_WRITE_ABORT = 0x08,
    /**
     * Wait for specified delay
     */
    DAP_DELAY = 0x09,
    /**
     * Reset Target with Device specific sequence
     */
    DAP_RESET_TARGET = 0x0A,
    /**
     * Control and monitor SWD/JTAG Pins
     */
    DAP_SWJ_PINS = 0x10,
    /**
     * Select SWD/JTAG Clock
     */
    DAP_SWJ_CLOCK = 0x11,
    /**
     * Generate SWJ sequence SWDIO/TMS @SWCLK/TCK
     */
    DAP_SWJ_SEQUENCE = 0x12,
    /**
     * Configure SWD Protocol
     */
    DAP_SWD_CONFIGURE = 0x13,
    /**
     * Generate JTAG sequence TMS, TDI and capture TDO
     */
    DAP_JTAG_SEQUENCE = 0x14,
    /**
     * Configure JTAG Chain
     */
    DAP_JTAG_CONFIGURE = 0x15,
    /**
     * Read JTAG IDCODE
     */
    DAP_JTAG_ID_CODE = 0x16,
    /**
     * Set SWO transport mode
     */
    DAP_SWO_TRANSPORT = 0x17,
    /**
     * Set SWO capture mode
     */
    DAP_SWO_MODE = 0x18,
    /**
     * Set SWO baudrate
     */
    DAP_SWO_BAUD_RATE = 0x19,
    /**
     * Control SWO trace data capture
     */
    DAP_SWO_CONTROL = 0x1A,
    /**
     * Read SWO trace status
     */
    DAP_SWO_STATUS = 0x1B,
    /**
     * Read SWO trace data
     */
    DAP_SWO_DATA = 0x1C,
    /**
     * Generate SWD sequence and output on SWDIO or capture input from SWDIO data
     */
    DAP_SWD_SEQUENCE = 0x1D,
    /**
     * Read SWO trace extended status
     */
    DAP_SWO_EXTENDED_STATUS = 0x1E,
    /**
     * Execute multiple DAP commands from a single packet
     */
    DAP_EXECUTE_COMMANDS = 0x7F,
    /**
     * Queue multiple DAP commands provided in a multiple packets
     */
    DAP_QUEUE_COMMANDS = 0x7E
}

/**
 * CMSIS-DAP Command Response
 * @hidden
 */
export const enum DAPResponse {
    /**
     * This is fine
     */
    DAP_OK = 0x00,
    /**
     * Error
     */
    DAP_ERROR = 0xFF
}

/**
 * Get Information about CMSIS-DAP Debug Unit
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Info.html
 */
export const enum DAPInfoRequest {
    /**
     * Get the Vendor ID (string)
     */
    VENDOR_ID = 0x01,
    /**
     * Get the Product ID (string)
     */
    PRODUCT_ID = 0x02,
    /**
     * Get the Serial Number (string)
     */
    SERIAL_NUMBER = 0x03,
    /**
     * Get the CMSIS-DAP Firmware Version (string)
     */
    CMSIS_DAP_FW_VERSION = 0x04,
    /**
     * Get the Target Device Vendor (string)
     */
    TARGET_DEVICE_VENDOR = 0x05,
    /**
     * Get the Target Device Name (string)
     */
    TARGET_DEVICE_NAME = 0x06,
    /**
     * Get information about the Capabilities (BYTE) of the Debug Unit
     */
    CAPABILITIES = 0xF0,
    /**
     * Get the Test Domain Timer parameter information
     */
    TEST_DOMAIN_TIMER = 0xF1,
    /**
     * Get the SWO Trace Buffer Size (WORD)
     */
    SWO_TRACE_BUFFER_SIZE = 0xFD,
    /**
     * Get the maximum Packet Count (BYTE)
     */
    PACKET_COUNT = 0xFE,
    /**
     * Get the maximum Packet Size (SHORT)
     */
    PACKET_SIZE = 0xFF,
}

/**
 * CMSIS-DAP Host Status Type
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__HostStatus.html
 * @hidden
 */
export const enum DAPHostStatusType {
    /**
     *  Connect: Status indicates that the debugger is connected to the Debug Unit
     */
    CONNECT = 0,
    /**
     * Running: Status indicates that the target hardware is executing application code
     */
    RUNNING = 1
}

/**
 * CMSIS-DAP Host Status Response
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__HostStatus.html
 * @hidden
 */
export const enum DAPHostStatusResponse {
    /**
     * False: may be used to turn off a status LED (Connect or Running) on the Debug Unit
     */
    FALSE = 0,
    /**
     * True: may be used to turn on a status LED (Connect or Running) on the Debug Unit
     */
    TRUE = 1
}

/**
 * CMSIS-DAP Connect Response
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Connect.html
 * @hidden
 */
export const enum DAPConnectResponse {
    /**
     * Initialization failed; no mode pre-configured
     */
    FAILED = 0,
    /**
     * Initialization for SWD mode
     */
    SWD = 1,
    /**
     * Initialization for JTAG mode
     */
    JTAG = 2
}

/**
 * CMSIS-DAP Reset Target Execute Response
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__ResetTarget.html
 * @hidden
 */
export const enum DAPResetTargeResponse {
    /**
     * No device specific reset sequence is implemented
     */
    NO_RESET_SEQUENCE = 0,
    /**
     * A device specific reset sequence is implemented
     */
    RESET_SEQUENCE = 1
}

/**
 * CMSIS-DAP SWO Transport
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__SWO__Transport.html
 * @hidden
 */
export const enum DAPSWOTransport {
    /**
     * None (default)
     */
    NONE = 0,
    /**
     * Read trace data via DAP_SWO_Data command
     */
    READ = 1,
    /**
     * Send trace data via separate WinUSB endpoint (requires CMSIS-DAP v2 configuration)
     */
    SEND = 2
}

/**
 * CMSIS-DAP SWO Mode
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__SWO__Mode.html
 * @hidden
 */
export const enum DAPSWOMode {
    /**
     * Off (default)
     */
    OFF = 0,
    /**
     * UART
     */
    UART = 1,
    /**
     * Manchester
     */
    MANCHESTER = 2
}

/**
 * CMSIS-DAP SWO Control
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__SWO__Control.html
 * @hidden
 */
export const enum DAPSWOControl {
    /**
     * Stop
     */
    STOP = 0,
    /**
     * Start
     */
    START = 1
}

/**
 * CMSIS-DAP Transfer Response
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Transfer.html
 * @hidden
 */
export const enum DAPTransferResponse {
    /**
     * OK (for SWD protocol), OK or FAULT (for JTAG protocol)
     */
    OK = 0x01,
    /**
     * Wait
     */
    WAIT = 0x02,
    /**
     * Fault
     */
    FAULT = 0x04,
    /**
     * NO_ACK (no response from target)
     */
    NO_ACK = 0x07,
    /**
     * Protocol Error (SWD)
     */
    PROTOCOL_ERROR = 0x08,
    /**
     * Value Mismatch (Read Register with Value Match)
     */
    VALUE_MISMATCH = 0x10
}
