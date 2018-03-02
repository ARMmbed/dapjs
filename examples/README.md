# DAP.js Examples

These examples are designed to show basic usage of the DAP.js library.

## Web

### Prerequisites

A browser which supports [WebUSB](https://wicg.github.io/webusb/), please refer to the [implementation status](https://github.com/WICG/webusb#implementation-status) for details.

### Usage

To run the web example, start the local web server by executing:

```bash
$ npm start
```

A browser window should open at [localhost:3000](http://localhost:3000/), which allows you to select a device, flash firmare to it and undertake basic step debugging.

Source for this example can be seen in [web.html](web.html).

__Note:__ Currently only the `FRDM-K64F` and `micro:bit` boards are supported in this example.

## Node js

### Prerequisites

[Node.js > v6.10.0](https://nodejs.org), which includes `npm 3`.

### Usage

To run the Node examples, simply execute them using node:

```bash
$ node <path to example.js>
```

### Examples

* __Flash Firmware__ [flash.js](flash.js)

  This example flashes a supplied firmware file onto a connected device using the WebUSB protocol.
  Some sample firmware binaries can be found in the [binaries](https://github.com/ARMmbed/dapjs/tree/master/binaries) folder.
