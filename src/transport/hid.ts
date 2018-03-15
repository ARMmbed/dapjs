export interface IHID {
    write(data: ArrayBuffer): Promise<void>;
    read(): Promise<Uint8Array>;
    close(): Promise<void>;
}

function bufferExtend(source: ArrayBuffer, length: number) {
    const sarr = new Uint8Array(source);

    const dest = new ArrayBuffer(length);
    const darr = new Uint8Array(dest);

    for (let i = 0; i < Math.min(source.byteLength, length); i++) {
        darr[i] = sarr[i];
    }

    return dest;
}

export class HID {
    private device: USBDevice;
    private interfaces: USBInterface[];
    private interface: USBInterface;
    private endpoints: USBEndpoint[];
    private epIn: USBEndpoint;
    private epOut: USBEndpoint;
    private useControlTransfer: boolean;
    private packetSize = 64;
    private controlTransferGetReport = 0x01;
    private controlTransferSetReport = 0x09;
    private controlTransferOutReport = 0x200;
    private controlTransferInReport = 0x100;

    constructor(device: USBDevice) {
        this.device = device;
    }

    public async open(hidInterfaceClass = 0xFF, useControlTransfer = true) {
        this.useControlTransfer = useControlTransfer;
        await this.device.open();
        await this.device.selectConfiguration(1);
        const hids = this.device.configuration.interfaces.filter(
            intf => intf.alternates[0].interfaceClass === hidInterfaceClass);

        if (hids.length === 0) {
            throw new Error("No HID interfaces found.");
        }

        this.interfaces = hids;

        if (this.interfaces.length === 1) {
            this.interface = this.interfaces[0];
        }
        await this.device.claimInterface(this.interface.interfaceNumber);
        this.endpoints = this.interface.alternates[0].endpoints;

        this.epIn = null;
        this.epOut = null;

        for (const endpoint of this.endpoints) {
            if (endpoint.direction === "in") {
                this.epIn = endpoint;
            } else {
                this.epOut = endpoint;
            }
        }
    }

    public async close() {
        return this.device.close();
    }

    public async write(data: ArrayBuffer): Promise<USBOutTransferResult> {
        if (this.epOut && !this.useControlTransfer) {
            const reportSize = this.epOut.packetSize;
            const buffer = bufferExtend(data, reportSize);
            return this.device.transferOut(this.epOut.endpointNumber, buffer);
        } else {
            // Device does not have out endpoint. Send data using control transfer
            const buffer = bufferExtend(data, this.packetSize);
            return this.device.controlTransferOut(
                {
                    requestType: "class",
                    recipient: "interface",
                    request: this.controlTransferSetReport,
                    value: this.controlTransferOutReport,
                    index: this.interface.interfaceNumber
                },
                buffer
            );
        }
    }

    public async read(): Promise<DataView> {
        if (this.epIn && !this.useControlTransfer) {
            const reportSize = this.epIn.packetSize;
            return this.device.transferIn(this.epIn.endpointNumber, reportSize)
                .then(res => res.data);
        } else {
            return this.device.controlTransferIn(
                {
                    requestType: "class",
                    recipient: "interface",
                    request: this.controlTransferGetReport,
                    value: this.controlTransferInReport,
                    index: this.interface.interfaceNumber
                },
                this.packetSize
            ).then(res => res.data);
        }
    }
}
