# DAP.js

DAP.js is a JavaScript interface to CMSIS-DAP, aiming to implement a subset of
the functionality provided by [pyOCD](https://github.com/mbedmicro/pyOCD), enabling
debugging of Arm Cortex-M devices in Node.js and in the browser using [WebUSB](https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web).

## Features

- General
    - Read core registers
    - Run arbitrary assembled Arm machine code
- Debugging
    - Set hardware and software breakpoints
    - Step (instruction level)
- Memory
    - Read blocks from memory:
        - 16-bit reads/writes
        - 32-bit reads/writes
        - Word-aligned mass reads and writes
- Flashing
    - Full-chip erase
    - Flash binary files and intel hex files
    - Support for the NRF51 (including the micro:bit) and NXP's FRDM-K64F.
- Performance
    - Support for batched commands to improve HID report utilisation
    - Flashing at ~10-20 kB/s, comparable with PyOCD and OpenOCD


## Build process

```
typings install
npm install
make
```

`dap.bundle.js` will be created in `built` folder.

## Example

For a more full-featured example, see [dapjs-web-demo](https://github.com/ArmMbed/dapjs-web-demo).

```javascript
device = await navigator.usb.requestDevice({ filters: [{vendorId: 0x0d28}]});
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

## License

MIT

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
