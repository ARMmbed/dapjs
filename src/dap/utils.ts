export class Utils {

    public static isBufferBinary(buffer: ArrayBuffer): boolean {
        // detect if buffer contains text or binary data
        const lengthToCheck = buffer.byteLength > 50 ? 50 : buffer.byteLength;
        const bufferString = Buffer.from(buffer).toString("utf8");
        for (let i = 0; i < lengthToCheck; i++) {
            const charCode = bufferString.charCodeAt(i);
            // 65533 is a code for unknown character
            // 0-8 are codes for control characters
            if (charCode === 65533 || charCode <= 8) {
                return true;
            }
        }
        return false;
    }
}
