# DAP.js

[![Circle CI](https://circleci.com/gh/ARMmbed/dapjs.svg?style=shield&circle-token=d37ef109d0134f6f8e4eb12a65214a8b159f77d8)](https://circleci.com/gh/ARMmbed/dapjs/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://spdx.org/licenses/MIT.html)

DAP.js is a JavaScript interface to [CMSIS-DAP](https://www.keil.com/pack/doc/CMSIS/DAP/html/index.html), enabling access to Arm Microcontrollers using [Node.js](https://nodejs.org/) or in the browser using [WebUSB](https://wicg.github.io/webusb/).

## Prerequisites

[Node.js > v6.10.0](https://nodejs.org), which includes `npm`

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
<script type="text/javascript" src="bundles/dap.bundle.js"></script>
```

In Node.js Require the libraries:

```javascript
const usb = require("webusb").usb;
const DAPjs = require("dapjs");
```

Then in either environment:

```javascript
<navigator>.usb.requestDevice({
    filters: [{vendorId: 0xD28}]
})
.then(device => {
    const transport = new DAPjs.WebUSB(device);
    const daplink = new DAPjs.DAPLink(transport);

    return daplink.connect()
    .then(() => daplink.disconnect())
    .then(() => process.exit());
})
.catch(error => {
    console.error(error.message || error);
    process.exit();
});
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
const hid = require("node-hid");
const DAPjs = require("dapjs");

let devices = hid.devices();
devices = devices.filter(device => device.vendorId === 0xD28);

const transport = new DAPjs.HID(devices[0]);
const daplink = new DAPjs.DAPLink(transport);

daplink.connect()
.then(() => daplink.disconnect())
.then(() => process.exit())
.catch(error => {
    console.error(error.message || error);
    process.exit();
});
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
const usb = require("usb");
const DAPjs = require("dapjs");

let devices = usb.getDeviceList();
devices = devices.filter(device => device.deviceDescriptor.idVendor === 0xD28);

const transport = new DAPjs.USB(devices[0]);
const daplink = new DAPjs.DAPLink(transport);

daplink.connect()
.then(() => daplink.disconnect())
.then(() => process.exit())
.catch(error => {
    console.error(error.message || error);
    process.exit();
});
```

#### Pros
- Doesn't require HID access to JavaScript in your OS.

#### Cons
- Requires a recent version of [DAPLink](https://armmbed.github.io/DAPLink/) to be installed on your target device.

## Architecture

The architecture of this project is built up in layers as follows:

### Transport

The `Transport` layer offers access to the USB device plugged into the host. Different transports are available based on user needs (see above).

### Proxy

The `Proxy` layer uses the transport layer to expose low-level `CMSIS-DAP` commands to the next layer. A common use for the proxy is as a debug chip attached to the main processor accessed over USB.

A CMSIS-DAP implementation is included, however a network proxy or similar could be introduced at this layer in order to remote commands.

### DAPLink

The `DAPLink` layer is a special derived implementation of the `CMSIS-DAP` proxy implementation. It adds DAPLink vendor specific functionality such as Mass Storage Device `firmware flashing` and `serial control`.

### DAP

The `DAP` (Debug Access Port) layer exposes low-level access to ports, registers and memory. An implementation exists for `ADI` (Arm Debug Interface).

### Processor

The `Processor` layer exposes access to the core processor registers.

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
