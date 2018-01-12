# JavaScript interface to on-chip debugger (CMSIS-DAP)

## Prerequisites

[Node.js > v8.9.0](https://nodejs.org), which includes `npm 5`.

## Installation

The SDK is distributed using npm. To install the package in your project:

```bash
$ npm install dapjs
```

## Examples

For more full-featured examples, please refer to the [examples](https://github.com/ARMmbed/dapjs/tree/master/examples) folder and see the web example running at:

https://armmbed.github.io/dapjs/

```javascript
device = await navigator.usb.requestDevice({
    filters: [{vendorId: 0x0d28}]
});

this.deviceCode = device.serialNumber.slice(0, 4);
selector = new DAPjs.PlatformSelector();
const info = await selector.lookupDevice(this.deviceCode);
this.hid = new DAPjs.HID(device);

// open hid device
await this.hid.open();
dapDevice = new DAPjs.DAP(this.hid);
this.target = new DAPjs.FlashTarget(dapDevice, DAPjs.FlashTargets.get(this.deviceCode));

// init and halt target
await this.target.init();
await this.target.halt();

// program_data contains binary data
program_data = DAPjs.FlashProgram.fromBinary(0, program_data);
await this.target.program(program_data, (progress) => {
    console.log(progress);
});

await this.target.reset();
```
