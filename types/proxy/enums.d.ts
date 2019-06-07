/**
 * CMSIS-DAP Protocol
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Connect.html
 */
export declare const enum DAPProtocol {
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
export declare const enum DAPPort {
    /**
     * Debug Port (DP)
     */
    DEBUG = 0,
    /**
     * Access Port (AP)
     */
    ACCESS = 1
}
/**
 * DAP Register Transfer Modes
 */
export declare const enum DAPTransferMode {
    /**
     * Write
     */
    WRITE = 0,
    /**
     * Read
     */
    READ = 2
}
/**
 * CMSIS-DAP Commands
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__genCommands__gr.html
 */
export declare const enum DAPCommand {
    /**
     * Get Information about CMSIS-DAP Debug Unit
     */
    DAP_INFO = 0,
    /**
     * Sent status information of the debugger to Debug Unit
     */
    DAP_HOST_STATUS = 1,
    /**
     * Connect to Device and selected DAP mode
     */
    DAP_CONNECT = 2,
    /**
     * Disconnect from active Debug Port
     */
    DAP_DISCONNECT = 3,
    /**
     * Configure Transfers
     */
    DAP_TRANSFER_CONFIGURE = 4,
    /**
     * Read/write single and multiple registers
     */
    DAP_TRANSFER = 5,
    /**
     * Read/Write a block of data from/to a single register
     */
    DAP_TRANSFER_BLOCK = 6,
    /**
     * Abort current Transfer
     */
    DAP_TRANSFER_ABORT = 7,
    /**
     * Write ABORT Register
     */
    DAP_WRITE_ABORT = 8,
    /**
     * Wait for specified delay
     */
    DAP_DELAY = 9,
    /**
     * Reset Target with Device specific sequence
     */
    DAP_RESET_TARGET = 10,
    /**
     * Control and monitor SWD/JTAG Pins
     */
    DAP_SWJ_PINS = 16,
    /**
     * Select SWD/JTAG Clock
     */
    DAP_SWJ_CLOCK = 17,
    /**
     * Generate SWJ sequence SWDIO/TMS @SWCLK/TCK
     */
    DAP_SWJ_SEQUENCE = 18,
    /**
     * Configure SWD Protocol
     */
    DAP_SWD_CONFIGURE = 19,
    /**
     * Generate JTAG sequence TMS, TDI and capture TDO
     */
    DAP_JTAG_SEQUENCE = 20,
    /**
     * Configure JTAG Chain
     */
    DAP_JTAG_CONFIGURE = 21,
    /**
     * Read JTAG IDCODE
     */
    DAP_JTAG_ID_CODE = 22,
    /**
     * Set SWO transport mode
     */
    DAP_SWO_TRANSPORT = 23,
    /**
     * Set SWO capture mode
     */
    DAP_SWO_MODE = 24,
    /**
     * Set SWO baudrate
     */
    DAP_SWO_BAUD_RATE = 25,
    /**
     * Control SWO trace data capture
     */
    DAP_SWO_CONTROL = 26,
    /**
     * Read SWO trace status
     */
    DAP_SWO_STATUS = 27,
    /**
     * Read SWO trace data
     */
    DAP_SWO_DATA = 28,
    /**
     * Generate SWD sequence and output on SWDIO or capture input from SWDIO data
     */
    DAP_SWD_SEQUENCE = 29,
    /**
     * Read SWO trace extended status
     */
    DAP_SWO_EXTENDED_STATUS = 30,
    /**
     * Execute multiple DAP commands from a single packet
     */
    DAP_EXECUTE_COMMANDS = 127,
    /**
     * Queue multiple DAP commands provided in a multiple packets
     */
    DAP_QUEUE_COMMANDS = 126
}
/**
 * CMSIS-DAP Command Response
 * @hidden
 */
export declare const enum DAPResponse {
    /**
     * This is fine
     */
    DAP_OK = 0,
    /**
     * Error
     */
    DAP_ERROR = 255
}
/**
 * Get Information about CMSIS-DAP Debug Unit
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__Info.html
 */
export declare const enum DAPInfoRequest {
    /**
     * Get the Vendor ID (string)
     */
    VENDOR_ID = 1,
    /**
     * Get the Product ID (string)
     */
    PRODUCT_ID = 2,
    /**
     * Get the Serial Number (string)
     */
    SERIAL_NUMBER = 3,
    /**
     * Get the CMSIS-DAP Firmware Version (string)
     */
    CMSIS_DAP_FW_VERSION = 4,
    /**
     * Get the Target Device Vendor (string)
     */
    TARGET_DEVICE_VENDOR = 5,
    /**
     * Get the Target Device Name (string)
     */
    TARGET_DEVICE_NAME = 6,
    /**
     * Get information about the Capabilities (BYTE) of the Debug Unit
     */
    CAPABILITIES = 240,
    /**
     * Get the Test Domain Timer parameter information
     */
    TEST_DOMAIN_TIMER = 241,
    /**
     * Get the SWO Trace Buffer Size (WORD)
     */
    SWO_TRACE_BUFFER_SIZE = 253,
    /**
     * Get the maximum Packet Count (BYTE)
     */
    PACKET_COUNT = 254,
    /**
     * Get the maximum Packet Size (SHORT)
     */
    PACKET_SIZE = 255
}
/**
 * CMSIS-DAP Host Status Type
 * https://www.keil.com/pack/doc/CMSIS/DAP/html/group__DAP__HostStatus.html
 * @hidden
 */
export declare const enum DAPHostStatusType {
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
export declare const enum DAPHostStatusResponse {
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
export declare const enum DAPConnectResponse {
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
export declare const enum DAPResetTargeResponse {
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
export declare const enum DAPSWOTransport {
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
export declare const enum DAPSWOMode {
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
export declare const enum DAPSWOControl {
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
export declare const enum DAPTransferResponse {
    /**
     * OK (for SWD protocol), OK or FAULT (for JTAG protocol)
     */
    OK = 1,
    /**
     * Wait
     */
    WAIT = 2,
    /**
     * Fault
     */
    FAULT = 4,
    /**
     * NO_ACK (no response from target)
     */
    NO_ACK = 7,
    /**
     * Protocol Error (SWD)
     */
    PROTOCOL_ERROR = 8,
    /**
     * Value Mismatch (Read Register with Value Match)
     */
    VALUE_MISMATCH = 16
}
