/**
 * Vendor-specific commands for DapLink serial access
 * @hidden
 */
export declare const enum DAPLinkSerial {
    /**
     * Read serial settings
     */
    READ_SETTINGS = 129,
    /**
     * Write serial settings
     */
    WRITE_SETTINGS = 130,
    /**
     * Read from serial
     */
    READ = 131,
    /**
     * Write to serial
     */
    WRITE = 132
}
/**
 * Vendor-specific commands for DapLink mass-storage device flashing
 * @hidden
 */
export declare const enum DAPLinkFlash {
    /**
     * Reset the target
     */
    RESET = 137,
    /**
     * Open the MSD
     */
    OPEN = 138,
    /**
     * Close the MSD
     */
    CLOSE = 139,
    /**
     * Write the image
     */
    WRITE = 140
}
