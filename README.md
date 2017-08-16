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

## Example

For a more full-featured example, see [dapjs-web-demo](https://github.com/ArmMbed/dapjs-web-demo).

```typescript
let device = new HID(device_path);
let core = new CortexM(new DAP(device));

await core.init();
await core.halt();

// detect core type
const [impl, isa, type] = await this.target.readCoreType();

// read core registers!
const r0 = await this.target.readCoreRegister(CortexReg.R0);

// step through code :)
await this.target.debug.step();

// set breakpoints
await this.target.debug.setBreakpoints(0x3c000);
```

## Build process

```
typings install
npm install
make
```

## License

MIT

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
