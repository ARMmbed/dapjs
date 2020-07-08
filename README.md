# DAP.js

[![Circle CI](https://circleci.com/gh/ARMmbed/dapjs.svg?style=shield&circle-token=d37ef109d0134f6f8e4eb12a65214a8b159f77d8)](https://circleci.com/gh/ARMmbed/dapjs/)
[![npm](https://img.shields.io/npm/dm/dapjs.svg)](https://www.npmjs.com/package/dapjs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)

DAP.js is a JavaScript interface to [CMSIS-DAP](https://www.keil.com/pack/doc/CMSIS/DAP/html/index.html), enabling access to Arm Microcontrollers using [Node.js](https://nodejs.org/) or in the browser using [WebUSB](https://wicg.github.io/webusb/).

## Prerequisites

[Node.js > v8.14.0](https://nodejs.org), which includes `npm`

## Installation

The package is distributed using npm. To install the package in your project:

```bash
$ npm install dapjs
```

## Getting Started

Decide on a transport layer to use (see below) and refer to the [examples folder](https://github.com/ARMmbed/dapjs/tree/master/examples/) to get started.

The web example can be seen running at:

https://armmbed.github.io/dapjs/examples/daplink-flash/web.html

Refer to the [DAPjs API Documentation](https://armmbed.github.io/dapjs/) for more information.

## Supported Systems

### Browsers

Please refer to the [WebUSB implementation status](https://github.com/WICG/webusb#implementation-status) for browser support.

### Windows

All transports outlined below are known to work on Windows 7, 8 and 10. Please refer to the [node-usb FAQ](https://github.com/tessel/node-usb/issues/182) with any issues using the `USB` or `WebUSB` transport in `Node.js`. The `HID` transport is preferred on Windows.

Please ensure you __don't__ have the Mbed Serial driver installed on `Windows 10` as this can cause issues and isn't needed on this platform.

### MacOS

No known issues with any transports in `Node.js` Tested on MacOS 10.12.

### Linux

Basic testing undertaken with no known issues. Please refer to the [node-usb FAQ](https://github.com/tessel/node-usb/issues/182) with any issues using the `USB` or `WebUSB` transport in `Node.js`.

### Development Boards

All develoment boards supporting `CMSIS-DAP` should work. For the flash and serial `DAPLink` functionality, all [Mbed Enabled boards](https://os.mbed.com/platforms/?mbed-enabled=15) should work, but need the latest `DAPLink` firmware installed.

The latest DAPLink containing WebUSB support needs to be built from the [DAPLink source](https://github.com/ARMmbed/DAPLink) until we have prepared a new firmware release on https://armmbed.github.io/DAPLink/.

All examples have been tested with the latest DAPLink fiormware on the following hardware:

- Freedom K64F
- BBC micro:bit

## Choosing a Transport

In order to use DAPjs, you need to install support for one of the transports. Use the following information to help you choose which to use:

### WebUSB

If you wish to use DAPjs in a browser environment, you must use WebUSB. Please refer to the [implementation status](https://github.com/WICG/webusb#implementation-status) of WebUSB to understand browser support for this technology.

__Note:__ WebUSB in the browser doesn't require any further libraries to be installed.

If you also want your program to work in a Node.js environment a [WebUSB library](https://github.com/thegecko/webusb) exists to allow your program to be ported to Node.js.

To install the library for Node.js, use:

```bash
$ npm install webusb
```

#### Example

In the browser, require the library:

```html
<script type="text/javascript" src="dist/dap.umd.js"></script>
```

In Node.js Require the libraries:

```javascript
const usb = require('webusb').usb;
const DAPjs = require('dapjs');
```

Then in either environment:

```javascript
const device = await <navigator>.usb.requestDevice({
    filters: [{vendorId: 0xD28}]
});

const transport = new DAPjs.WebUSB(device);
const daplink = new DAPjs.DAPLink(transport);

try {
    await daplink.connect();
    await daplink.disconnect();
} catch(error) {
    console.error(error.message || error);
}
```

#### Pros
- Works in the browser
- Programs are portable to Node.js environments

#### Cons
- Requires a recent version of [DAPLink](https://armmbed.github.io/DAPLink/) to be installed on your target device.

### HID

For the highest level of firmware compatibility in a Node.js environment, the HID transport is recommended. This utilises the `node-hid` library and is installed as follows:

```bash
$ npm install node-hid
```

#### Example

```javascript
const hid = require('node-hid');
const DAPjs = require('dapjs');

let devices = hid.devices();
devices = devices.filter(device => device.vendorId === 0xD28);

const device = new hid.HID(devices[0].path);
const transport = new DAPjs.HID(device);
const daplink = new DAPjs.DAPLink(transport);

try {
    await daplink.connect();
    await daplink.disconnect();
} catch(error) {
    console.error(error.message || error);
}
```

#### Pros
- Compatible with older CMSIS-DAP firmware.

#### Cons
- Requires HID access to JavaScript in your OS.

### USB

A "pure" USB transport exists which bypasses requiring `WebUSB` and `HID`.
This utilises the `usb` library and is installed as follows:

```bash
$ npm install usb
```

#### Example

```javascript
const usb = require('usb');
const DAPjs = require('dapjs');

let devices = usb.getDeviceList();
devices = devices.filter(device => device.deviceDescriptor.idVendor === 0xD28);

const transport = new DAPjs.USB(devices[0]);
const daplink = new DAPjs.DAPLink(transport);

try {
    await daplink.connect();
    await daplink.disconnect();
} catch(error) {
    console.error(error.message || error);
}
```

#### Pros
- Doesn't require HID access to JavaScript in your OS.

#### Cons
- Requires a recent version of [DAPLink](https://armmbed.github.io/DAPLink/) to be installed on your target device.
- Can have issues on Windows machines

## Architecture

The architecture of this project is built up in layers as follows:

### Transport

The `Transport` layer offers access to the USB device plugged into the host. Different transports are available based on user needs (see above).

#### Implementation Status

- [x] packetSize
- [x] open()
- [x] close()
- [x] read()
- [x] write()

### Proxy

The `Proxy` layer uses the transport layer to expose low-level `CMSIS-DAP` commands to the next layer. A common use for the proxy is as a debug chip attached to the main processor accessed over USB.

A CMSIS-DAP implementation is included, however a network proxy or similar could be introduced at this layer in order to remote commands.

#### Implementation Status

- [x] operationCount
- [x] blockSize
- [x] dapInfo()
- [x] swjSequence()
- [x] swjClock()
- [x] transferConfigure()
- [x] connect()
- [x] disconnect()
- [x] reconnect()
- [x] reset()
- [x] transfer()
- [x] transferBlock()
- [ ] hostStatus()
- [ ] delay()
- [ ] writeAbort()
- [ ] swjPins()
- [ ] swdSequence()
- [ ] swdConfigure()
- [ ] swoTransport()
- [ ] swoMode()
- [ ] swoBaudrate()
- [ ] swoControl()
- [ ] swoStatus()
- [ ] swoExtendedStatus()
- [ ] swoData()
- [ ] jtagSequence()
- [ ] jtagConfigure()
- [ ] jtagIDCode()
- [ ] transferAbort()
- [ ] executeCommands()
- [ ] queueCommands()

### DAPLink

The `DAPLink` layer is a special derived implementation of the `CMSIS-DAP` proxy implementation. It adds DAPLink vendor specific functionality such as Mass Storage Device `firmware flashing` and `serial control`.

#### Implementation Status

- [x] flash()
- [x] getSerialBaudrate()
- [x] setSerialBaudrate()
- [x] startSerialRead()
- [x] stopSerialRead()
- [x] serialWrite()

#### Events

- [x] flash_progress
- [x] serial_data

### DAP

The `DAP` (Debug Access Port) layer exposes low-level access to ports, registers and memory. An implementation exists for `ADI` (Arm Debug Interface).

#### Implementation Status

- [x] connect()
- [x] disconnect()
- [x] reconnect()
- [x] reset()
- [x] readDP()
- [x] writeDP()
- [x] readAP()
- [x] writeAP()
- [x] readMem16()
- [x] writeMem16()
- [x] readMem32()
- [x] writeMem32()
- [x] readBlock()
- [x] writeBlock()

### Processor

The `Processor` layer exposes access to the core processor registers.

#### Implementation Status

- [x] getState()
- [x] isHalted()
- [x] halt()
- [x] resume()
- [x] readCoreRegister()
- [x] readCoreRegisters()
- [x] writeCoreRegister()
- [x] execute()
- [ ] step()

## Development

After cloning this repository, install the development dependencies:

```bash
$ npm install
```

### Building

[Gulp](https://gulpjs.com/) is used as a task runner to build the project.
To build the project, simply run `gulp` or to continually build as source changes, run `gulp watch`:

```bash
$ gulp
$ gulp watch
```

A `package.json script` exists to run gulp if you don't have it installed globally:

```bash
$ npm run gulp
$ npm run gulp watch
```

### Running

A local [express](https://expressjs.com/) server is included to run the web example locally:

```bash
$ node server.js
```

The latest build of master is always available to be installed from the `gh-pages` branch:

```bash
$ npm install ARMmbed/dapjs#gh-pages
```
