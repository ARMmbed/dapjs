export interface IHID {
    write(data: ArrayBuffer): Promise<void>;
    read(): Promise<Uint8Array>;
    close(): Promise<void>;
}

function bufferExtend(source: ArrayBuffer, length: number) {
    let sarr = new Uint8Array(source);

    let dest = new ArrayBuffer(length);
    let darr = new Uint8Array(dest);

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
    private ep_in: USBEndpoint;
    private ep_out: USBEndpoint;

    constructor(device: USBDevice) {
        this.device = device;
    }

    async open() {
        await this.device.open();
        await this.device.selectConfiguration(1);

        let hids = this.device.configuration.interfaces.filter(
            (intf) => intf.alternates[0].interfaceClass == 0xFF);

        if (hids.length == 0) {
            throw 'No HID interfaces found.';
        }

        this.interfaces = hids;

        if (this.interfaces.length == 1) {
            this.interface = this.interfaces[0];
        }

        await this.device.claimInterface(this.interface.interfaceNumber);

        this.endpoints = this.interface.alternates[0].endpoints;

        this.ep_in = null;
        this.ep_out = null;

        for (let endpoint of this.endpoints) {
            if (endpoint.direction == 'in') {
                this.ep_in = endpoint;
            } else {
                this.ep_out = endpoint;
            }
        }

        if (this.ep_in == null || this.ep_out == null) {
            console.log('Unable to find an in and an out endpoint.');
        }
    }

    close() {
        return this.device.close();
    }

    write(data: ArrayBuffer): Promise<USBOutTransferResult> {
        let report_size = this.ep_out.packetSize;
        let buffer = bufferExtend(data, report_size);

        return this.device.transferOut(this.ep_out.endpointNumber, buffer);
    }

    read() : Promise<DataView> {
        let report_size = this.ep_in.packetSize;

        return this.device.transferIn(this.ep_in.endpointNumber, report_size)
            .then(res => res.data);
    }
}

