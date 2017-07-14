# DAP.JS

Node.js interface to DAP-CMSIS over USB/HID

This package is meant to provide a subset of functionality of [pyOCD](https://github.com/mbedmicro/pyOCD).

It's currently only being tested with BBC micro:bit devices.

The is explicitly not using node.js features not present in browsers (in particular `Buffer` type)
so it's easier to refactor it to use different USB/HID providers (WinRT, Chrome Apps etc).

## Note: running with WebUSB

Chrome does not attempt to unmount the kernel driver for the device. As such,
this will _not_ work if the mbed serial driver is installed. This has only been
tested on Windows 10 and Chrome so far.

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
