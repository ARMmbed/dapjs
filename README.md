# DAP.JS

Node.js interface to DAP-CMSIS over USB/HID

This package is meant to provide a subset of functionality of [pyOCD](https://github.com/mbedmicro/pyOCD).

It's currently only being tested with BBC micro:bit devices.

The is explicitly not using node.js features not present in browsers (in particular `Buffer` type)
so it's easier to refactor it to use different USB/HID providers (WinRT, Chrome Apps etc).

## Build process

```
typings install
npm install
make
```

## License

MIT

