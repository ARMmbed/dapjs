var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])})(t,n)};function t(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}function n(){}function r(){r.init.call(this)}function i(e){return void 0===e._maxListeners?r.defaultMaxListeners:e._maxListeners}function o(e,t,r,o){var s,u,a,f;if("function"!=typeof r)throw new TypeError('"listener" argument must be a function');if((u=e._events)?(u.newListener&&(e.emit("newListener",t,r.listener?r.listener:r),u=e._events),a=u[t]):(u=e._events=new n,e._eventsCount=0),a){if("function"==typeof a?a=u[t]=o?[r,a]:[a,r]:o?a.unshift(r):a.push(r),!a.warned&&(s=i(e))&&s>0&&a.length>s){a.warned=!0;var c=new Error("Possible EventEmitter memory leak detected. "+a.length+" "+t+" listeners added. Use emitter.setMaxListeners() to increase limit");c.name="MaxListenersExceededWarning",c.emitter=e,c.type=t,c.count=a.length,f=c,"function"==typeof console.warn?console.warn(f):console.log(f)}}else a=u[t]=r,++e._eventsCount;return e}function s(e,t,n){var r=!1;function i(){e.removeListener(t,i),r||(r=!0,n.apply(e,arguments))}return i.listener=n,i}function u(e){var t=this._events;if(t){var n=t[e];if("function"==typeof n)return 1;if(n)return n.length}return 0}function a(e,t){for(var n=new Array(t);t--;)n[t]=e[t];return n}n.prototype=Object.create(null),r.EventEmitter=r,r.usingDomains=!1,r.prototype.domain=void 0,r.prototype._events=void 0,r.prototype._maxListeners=void 0,r.defaultMaxListeners=10,r.init=function(){this.domain=null,r.usingDomains&&(void 0).active&&(void 0).Domain,this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=new n,this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},r.prototype.setMaxListeners=function(e){if("number"!=typeof e||e<0||isNaN(e))throw new TypeError('"n" argument must be a positive number');return this._maxListeners=e,this},r.prototype.getMaxListeners=function(){return i(this)},r.prototype.emit=function(e){var t,n,r,i,o,s,u,f="error"===e;if(s=this._events)f=f&&null==s.error;else if(!f)return!1;if(u=this.domain,f){if(t=arguments[1],!u){if(t instanceof Error)throw t;var c=new Error('Uncaught, unspecified "error" event. ('+t+")");throw c.context=t,c}return t||(t=new Error('Uncaught, unspecified "error" event')),t.domainEmitter=this,t.domain=u,t.domainThrown=!1,u.emit("error",t),!1}if(!(n=s[e]))return!1;var h="function"==typeof n;switch(r=arguments.length){case 1:!function(e,t,n){if(t)e.call(n);else for(var r=e.length,i=a(e,r),o=0;o<r;++o)i[o].call(n)}(n,h,this);break;case 2:!function(e,t,n,r){if(t)e.call(n,r);else for(var i=e.length,o=a(e,i),s=0;s<i;++s)o[s].call(n,r)}(n,h,this,arguments[1]);break;case 3:!function(e,t,n,r,i){if(t)e.call(n,r,i);else for(var o=e.length,s=a(e,o),u=0;u<o;++u)s[u].call(n,r,i)}(n,h,this,arguments[1],arguments[2]);break;case 4:!function(e,t,n,r,i,o){if(t)e.call(n,r,i,o);else for(var s=e.length,u=a(e,s),f=0;f<s;++f)u[f].call(n,r,i,o)}(n,h,this,arguments[1],arguments[2],arguments[3]);break;default:for(i=new Array(r-1),o=1;o<r;o++)i[o-1]=arguments[o];!function(e,t,n,r){if(t)e.apply(n,r);else for(var i=e.length,o=a(e,i),s=0;s<i;++s)o[s].apply(n,r)}(n,h,this,i)}return!0},r.prototype.addListener=function(e,t){return o(this,e,t,!1)},r.prototype.on=r.prototype.addListener,r.prototype.prependListener=function(e,t){return o(this,e,t,!0)},r.prototype.once=function(e,t){if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');return this.on(e,s(this,e,t)),this},r.prototype.prependOnceListener=function(e,t){if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');return this.prependListener(e,s(this,e,t)),this},r.prototype.removeListener=function(e,t){var r,i,o,s,u;if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');if(!(i=this._events))return this;if(!(r=i[e]))return this;if(r===t||r.listener&&r.listener===t)0==--this._eventsCount?this._events=new n:(delete i[e],i.removeListener&&this.emit("removeListener",e,r.listener||t));else if("function"!=typeof r){for(o=-1,s=r.length;s-- >0;)if(r[s]===t||r[s].listener&&r[s].listener===t){u=r[s].listener,o=s;break}if(o<0)return this;if(1===r.length){if(r[0]=void 0,0==--this._eventsCount)return this._events=new n,this;delete i[e]}else!function(e,t){for(var n=t,r=n+1,i=e.length;r<i;n+=1,r+=1)e[n]=e[r];e.pop()}(r,o);i.removeListener&&this.emit("removeListener",e,u||t)}return this},r.prototype.removeAllListeners=function(e){var t,r;if(!(r=this._events))return this;if(!r.removeListener)return 0===arguments.length?(this._events=new n,this._eventsCount=0):r[e]&&(0==--this._eventsCount?this._events=new n:delete r[e]),this;if(0===arguments.length){for(var i,o=Object.keys(r),s=0;s<o.length;++s)"removeListener"!==(i=o[s])&&this.removeAllListeners(i);return this.removeAllListeners("removeListener"),this._events=new n,this._eventsCount=0,this}if("function"==typeof(t=r[e]))this.removeListener(e,t);else if(t)do{this.removeListener(e,t[t.length-1])}while(t[0]);return this},r.prototype.listeners=function(e){var t,n=this._events;return n&&(t=n[e])?"function"==typeof t?[t.listener||t]:function(e){for(var t=new Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}(t):[]},r.listenerCount=function(e,t){return"function"==typeof e.listenerCount?e.listenerCount(t):u.call(e,t)},r.prototype.listenerCount=u,r.prototype.eventNames=function(){return this._eventsCount>0?Reflect.ownKeys(this._events):[]};var f,c=1e7,h=4,p=2,d=5,l=function(e){function n(t,n,r){void 0===n&&(n=0),void 0===r&&(r=c);var i=e.call(this)||this;i.transport=t,i.mode=n,i.clockFrequency=r,i.blockSize=i.transport.packetSize-h-1;var o=i.transport.packetSize-p-1;return i.operationCount=Math.floor(o/d),i}return t(n,e),n.prototype.delay=function(e){return new Promise(function(t,n){setTimeout(t,e)})},n.prototype.bufferSourceToUint8Array=function(e,t){if(!t)return new Uint8Array([e]);var n=void 0!==t.buffer?t.buffer:t,r=new Uint8Array(n.byteLength+1);return r.set([e]),r.set(new Uint8Array(n),1),r},n.prototype.selectProtocol=function(e){var t=this,n=2===e?59196:59294;return this.swjSequence(new Uint8Array([255,255,255,255,255,255,255])).then(function(){return t.swjSequence(new Uint16Array([n]))}).then(function(){return t.swjSequence(new Uint8Array([255,255,255,255,255,255,255]))}).then(function(){return t.swjSequence(new Uint8Array([0]))})},n.prototype.send=function(e,t){var n=this,r=this.bufferSourceToUint8Array(e,t);return this.transport.write(r).then(function(){return n.transport.read()}).then(function(t){if(t.getUint8(0)!==e)throw new Error("Bad response for "+e+" -> "+t.getUint8(0));switch(e){case 3:case 8:case 9:case 10:case 17:case 18:case 19:case 29:case 23:case 24:case 26:case 21:case 22:case 4:if(0!==t.getUint8(1))throw new Error("Bad status for "+e+" -> "+t.getUint8(1))}return t})},n.prototype.dapInfo=function(e){return this.send(0,new Uint8Array([e])).then(function(t){var n=t.getUint8(1);if(0===n)throw new Error("DAP Info Failure");switch(e){case 240:case 254:case 255:case 253:if(1===n)return t.getUint8(2);if(2===n)return t.getUint16(2);if(4===n)return t.getUint32(2)}var r=Array.prototype.slice.call(new Uint8Array(t.buffer,2,n));return String.fromCharCode.apply(null,r)})},n.prototype.swjSequence=function(e){var t=8*e.byteLength,n=this.bufferSourceToUint8Array(t,e);return this.send(18,n).then(function(){})},n.prototype.configureTransfer=function(e,t,n){var r=new Uint8Array(5),i=new DataView(r.buffer);return i.setUint8(0,e),i.setUint16(1,t,!0),i.setUint16(3,n,!0),this.send(4,r).then(function(){})},n.prototype.connect=function(){var e=this;return this.transport.open().then(function(){return e.send(17,new Uint32Array([e.clockFrequency]))}).then(function(){return e.send(2,new Uint8Array([e.mode]))}).then(function(t){if(0===t.getUint8(1)||0!==e.mode&&t.getUint8(1)!==e.mode)throw new Error("Mode not enabled.")}).then(function(){return e.configureTransfer(0,100,0)}).then(function(){return e.selectProtocol(1)})},n.prototype.disconnect=function(){var e=this;return this.send(3).then(function(){return e.transport.close()})},n.prototype.reconnect=function(){var e=this;return this.disconnect().then(function(){return e.delay(100)}).then(function(){return e.connect()})},n.prototype.reset=function(){return this.send(10).then(function(e){return 1===e.getUint8(2)})},n.prototype.transfer=function(e,t,n,r){var i;void 0===t&&(t=2),void 0===n&&(n=0),void 0===r&&(r=0),i="number"==typeof e?[{port:e,mode:t,register:n,value:r}]:e;var o=new Uint8Array(p+i.length*d),s=new DataView(o.buffer);return s.setUint8(0,0),s.setUint8(1,i.length),i.forEach(function(e,t){var n=p+t*d;s.setUint8(n,e.port|e.mode|e.register),s.setUint32(n+1,e.value||0,!0)}),this.send(5,o).then(function(t){if(t.getUint8(1)!==i.length)throw new Error("Transfer count mismatch");var n=t.getUint8(2);if(2===n)throw new Error("Transfer response WAIT");if(4===n)throw new Error("Transfer response FAULT");if(8===n)throw new Error("Transfer response PROTOCOL_ERROR");if(16===n)throw new Error("Transfer response VALUE_MISMATCH");if(7===n)throw new Error("Transfer response NO_ACK");if("number"==typeof e)return t.getUint32(3,!0);var r=4*i.length;return new Uint32Array(t.buffer.slice(3,3+r))})},n.prototype.transferBlock=function(e,t,n){var r,i,o=h;"number"==typeof n?(r=n,i=2):(r=n.length,i=0,o+=n.byteLength);var s=new Uint8Array(o),u=new DataView(s.buffer);return u.setUint8(0,0),u.setUint16(1,r,!0),u.setUint8(3,e|i|t),"number"!=typeof n&&s.set(n,h),this.send(6,u).then(function(e){if(e.getUint16(1,!0)!==r)throw new Error("Transfer count mismatch");var t=e.getUint8(3);if(2&t)throw new Error("Transfer response WAIT");if(4&t)throw new Error("Transfer response FAULT");if(8&t)throw new Error("Transfer response PROTOCOL_ERROR");if(7&t)throw new Error("Transfer response NO_ACK");if("number"==typeof n)return new Uint32Array(e.buffer.slice(4))})},n}(r),m=function(e){function n(){return null!==e&&e.apply(this,arguments)||this}return t(n,e),n.prototype.isBufferBinary=function(e){for(var t=Array.prototype.slice.call(new Uint16Array(e,0,50)),n=String.fromCharCode.apply(null,t),r=0;r<n.length;r++){var i=n.charCodeAt(r);if(65533===i||i<=8)return!0}return!1},n.prototype.writeBuffer=function(e,t,r){var i=this;void 0===r&&(r=0);var o=Math.min(e.byteLength,r+t),s=e.slice(r,o),u=new Uint8Array(s.byteLength+1);return u.set([s.byteLength]),u.set(new Uint8Array(s),1),this.send(140,u).then(function(){return i.emit(n.EVENT_PROGRESS,r/e.byteLength),o<e.byteLength?i.writeBuffer(e,t,o):Promise.resolve()})},n.prototype.flash=function(e,t){var r=this;void 0===t&&(t=62);var i=void 0!==e.buffer?e.buffer:e,o=this.isBufferBinary(i)?0:1;return this.send(138,new Uint32Array([o])).then(function(e){return 0!==e.getUint8(1)?Promise.reject("Flash error"):r.writeBuffer(i,t)}).then(function(){return r.emit(n.EVENT_PROGRESS,1),r.send(139)}).then(function(e){return 0!==e.getUint8(1)?Promise.reject("Flash error"):r.send(137)}).then(function(){})},n.prototype.getSerialBaudrate=function(){return this.send(129).then(function(e){return e.getUint32(1,!0)})},n.prototype.setSerialBaudrate=function(e){return void 0===e&&(e=9600),this.send(130,new Uint32Array([e])).then(function(){})},n.prototype.startSerialRead=function(e){var t=this;void 0===e&&(e=200),this.stopSerialRead(),this.timer=setInterval(function(){return t.send(131).then(function(e){if(e.byteLength>0){var r=e.getUint8(1);if(0!==r){var i=e.buffer.slice(2,2+r),o=Array.prototype.slice.call(new Uint8Array(i)),s=String.fromCharCode.apply(null,o);t.emit(n.EVENT_SERIAL_DATA,s)}}})},e)},n.prototype.stopSerialRead=function(){this.timer&&(clearInterval(this.timer),this.timer=void 0)},n.prototype.serialWrite=function(e){var t=e.split("").map(function(e){return e.charCodeAt(0)});return t.unshift(t.length),this.send(132,new Uint8Array(t).buffer).then(function(){})},n.EVENT_PROGRESS="progress",n.EVENT_SERIAL_DATA="serial",n}(l),v=function(){function e(e,t,n){void 0===t&&(t=0),void 0===n&&(n=c),this.proxy=void 0!==e.open?new l(e,t,n):e}return e.prototype.delay=function(e){return new Promise(function(t,n){setTimeout(t,e)})},e.prototype.waitDelay=function(e,t,n){var r=this;void 0===t&&(t=100),void 0===n&&(n=0);var i=!0,o=function(n){return i?n?Promise.resolve():r.delay(t).then(e).then(o):Promise.resolve()};return new Promise(function(e,t){return n>0&&setTimeout(function(){i=!1,t("Wait timed out")},n),o(!1).then(function(){return e()})})},e.prototype.concatTypedArray=function(e){if(1===e.length)return e[0];for(var t=0,n=0,r=e;n<r.length;n++){t+=r[n].length}for(var i=new Uint32Array(t),o=0,s=0;o<e.length;o++)i.set(e[o],s),s+=e[o].length;return i},e.prototype.readDPCommand=function(e){return[{mode:2,port:0,register:e}]},e.prototype.writeDPCommand=function(e,t){if(8===e){if(t===this.selectedAddress)return[];this.selectedAddress=t}return[{mode:0,port:0,register:e,value:t}]},e.prototype.readAPCommand=function(e){var t=4278190080&e|240&e;return this.writeDPCommand(8,t).concat({mode:2,port:1,register:e})},e.prototype.writeAPCommand=function(e,t){if(0===e){if(t===this.cswValue)return[];this.cswValue=t}var n=4278190080&e|240&e;return this.writeDPCommand(8,n).concat({mode:0,port:1,register:e,value:t})},e.prototype.readMem16Command=function(e){return this.writeAPCommand(0,587202641).concat(this.writeAPCommand(4,e)).concat(this.readAPCommand(12))},e.prototype.writeMem16Command=function(e,t){return this.writeAPCommand(0,587202641).concat(this.writeAPCommand(4,e)).concat(this.writeAPCommand(12,t))},e.prototype.readMem32Command=function(e){return this.writeAPCommand(0,587202642).concat(this.writeAPCommand(4,e)).concat(this.readAPCommand(12))},e.prototype.writeMem32Command=function(e,t){return this.writeAPCommand(0,587202642).concat(this.writeAPCommand(4,e)).concat(this.writeAPCommand(12,t))},e.prototype.transferSequence=function(e){var t=this,n=[];n=n.concat.apply(n,e);for(var r=Promise.resolve([]),i=function(){var e=n.splice(0,o.proxy.operationCount);r=r.then(function(n){return t.proxy.transfer(e).then(function(e){return n.concat([e])})})},o=this;n.length;)i();return r.then(function(e){return t.concatTypedArray(e)})},e.prototype.connect=function(){var e=this;return this.proxy.connect().then(function(){return e.readDP(0)}).then(function(){return e.transferSequence([e.writeDPCommand(0,4),e.writeDPCommand(8,0),e.writeDPCommand(4,1342177280)])}).then(function(){return e.waitDelay(function(){return e.readDP(4).then(function(e){return-1610612736==(-1610612736&e)})})})},e.prototype.disconnect=function(){return this.proxy.disconnect()},e.prototype.reconnect=function(){var e=this;return this.disconnect().then(function(){return e.delay(100)}).then(function(){return e.connect()})},e.prototype.reset=function(){return this.proxy.reset()},e.prototype.readDP=function(e){return this.proxy.transfer(this.readDPCommand(e)).then(function(e){return e[0]})},e.prototype.writeDP=function(e,t){return this.proxy.transfer(this.writeDPCommand(e,t)).then(function(){})},e.prototype.readAP=function(e){return this.proxy.transfer(this.readAPCommand(e)).then(function(e){return e[0]})},e.prototype.writeAP=function(e,t){return this.proxy.transfer(this.writeAPCommand(e,t)).then(function(){})},e.prototype.readMem16=function(e){return this.proxy.transfer(this.readMem16Command(e)).then(function(e){return e[0]})},e.prototype.writeMem16=function(e,t){return t<<=(2&e)<<3,this.proxy.transfer(this.writeMem16Command(e,t)).then(function(){})},e.prototype.readMem32=function(e){return this.proxy.transfer(this.readMem32Command(e)).then(function(e){return e[0]})},e.prototype.writeMem32=function(e,t){return this.proxy.transfer(this.writeMem32Command(e,t)).then(function(){})},e.prototype.readBlock=function(e,t){for(var n=this,r=this.transferSequence([this.writeAPCommand(0,587202642),this.writeAPCommand(4,e)]).then(function(){return[]}),i=t,o=function(){var e=Math.min(i,s.proxy.blockSize);r=r.then(function(t){return n.proxy.transferBlock(1,12,e).then(function(e){return t.concat([e])})}),i-=e},s=this;i>0;)o();return r.then(function(e){return n.concatTypedArray(e)})},e.prototype.writeBlock=function(e,t){for(var n=this,r=this.transferSequence([this.writeAPCommand(0,587202642),this.writeAPCommand(4,e)]).then(function(){}),i=0,o=function(){var e=t.slice(i,i+s.proxy.blockSize);r=r.then(function(){return n.proxy.transferBlock(1,12,e)}),i+=s.proxy.blockSize},s=this;i<t.length;)o();return r},e}(),y=function(e){function n(){return null!==e&&e.apply(this,arguments)||this}return t(n,e),n.prototype.enableDebug=function(){return this.writeMem32(3758157296,-1604386815)},n.prototype.readCoreRegisterCommand=function(e){return this.writeMem32Command(3758157300,e).concat(this.readMem32Command(3758157296)).concat(this.readMem32Command(3758157304))},n.prototype.writeCoreRegisterCommand=function(e,t){return this.writeMem32Command(3758157304,t).concat(this.writeMem32Command(3758157300,65536|e))},n.prototype.getState=function(){var e=this;return this.readMem32(3758157296).then(function(t){var n;return n=524288&t?1:262144&t?2:131072&t?3:4,33554432&t?e.readMem32(3758157296).then(function(e){return 33554432&e&&!(16777216&e)?0:n}):n})},n.prototype.isHalted=function(){return this.readMem32(3758157296).then(function(e){return!!(131072&e)})},n.prototype.halt=function(e,t){var n=this;return void 0===e&&(e=!0),void 0===t&&(t=0),this.isHalted().then(function(r){return r?Promise.resolve():n.writeMem32(3758157296,-1604386813).then(function(){return e?n.waitDelay(function(){return n.isHalted()},100,t):Promise.resolve()})})},n.prototype.resume=function(e,t){var n=this;return void 0===e&&(e=!0),void 0===t&&(t=0),this.isHalted().then(function(r){return r?n.writeMem32(3758157104,7).then(function(){return n.enableDebug()}).then(function(){return e?n.waitDelay(function(){return n.isHalted().then(function(e){return!e})},100,t):Promise.resolve()}):Promise.resolve()})},n.prototype.readCoreRegister=function(e){var t=this;return this.transferSequence([this.writeMem32Command(3758157300,e),this.readMem32Command(3758157296)]).then(function(e){if(!(65536&e[0]))throw new Error("Register not ready");return t.readMem32(3758157304)})},n.prototype.readCoreRegisters=function(e){var t=this,n=Promise.resolve([]);return e.forEach(function(e){n=n.then(function(n){return t.readCoreRegister(e).then(function(e){return n.concat([e])})})}),n},n.prototype.writeCoreRegister=function(e,t){return this.transferSequence([this.writeMem32Command(3758157304,t),this.writeMem32Command(3758157300,65536|e),this.readMem32Command(3758157296)]).then(function(e){if(!(65536&e[0]))throw new Error("Register not ready")})},n.prototype.execute=function(e,t,n,r,i){var o=this;void 0===i&&(i=e+1);for(var s=[],u=5;u<arguments.length;u++)s[u-5]=arguments[u];if(48682!==t[t.length-1]){var a=new Uint32Array(t.length+1);a.set(t),a.set([48682],t.length-1),t=a}for(var f=[this.writeCoreRegisterCommand(13,n),this.writeCoreRegisterCommand(15,r),this.writeCoreRegisterCommand(14,i)],c=0;c<Math.min(s.length,12);c++)f.push(this.writeCoreRegisterCommand(c,s[c]));return this.halt().then(function(){return o.transferSequence(f)}).then(function(){return o.writeBlock(e,t)}).then(function(){return o.resume(!1)}).then(function(){return o.waitDelay(function(){return o.isHalted()},100,1e4)})},n}(v);!function(e){e[e.ENABLE=1]="ENABLE",e[e.KEY=2]="KEY"}(f||(f={}));var w=function(){function e(e){this.os="browser",this.packetSize=64,this.path=void 0!==e.path?e.path:e}return e.prototype.open=function(){var e=this;return new Promise(function(t,n){if(!e.path.length)return n("No path specified");try{var r=require("node-hid");e.device=new r.HID(e.path),t()}catch(e){n(e)}})},e.prototype.close=function(){var e=this;return new Promise(function(t,n){e.device&&e.device.close(),t()})},e.prototype.read=function(){var e=this;return new Promise(function(t,n){if(!e.device)return n("No device opened");e.device.read(function(e,r){if(e)return n(e);var i=new Uint8Array(r).buffer;t(new DataView(i))})})},e.prototype.write=function(e){var t=this;return new Promise(function(n,r){if(!t.device)return r("No device opened");for(var i=void 0!==e.buffer?e.buffer:e,o=Array.prototype.slice.call(new Uint8Array(i));o.length<t.packetSize;)o.push(0);if("win32"===t.os&&o.unshift(0),t.device.write(o)!==o.length)return r("Incorrect bytecount written");n()})},e}(),g=1,C=255,b=function(){function e(e,t,n,r){void 0===t&&(t=C),void 0===n&&(n=g),void 0===r&&(r=!1),this.device=e,this.interfaceClass=t,this.configuration=n,this.alwaysControlTransfer=r,this.packetSize=64}return e.prototype.bufferToDataView=function(e){var t=new Uint8Array(e).buffer;return new DataView(t)},e.prototype.bufferSourceToBuffer=function(e){var t=void 0!==e.buffer?e.buffer:e;return Buffer.from(t)},e.prototype.extendBuffer=function(e,t){var n=void 0!==e.buffer?e.buffer:e,r=Math.min(n.byteLength,t),i=new Uint8Array(r);return i.set(new Uint8Array(n)),i},e.prototype.open=function(){var e=this;return new Promise(function(t,n){e.device.open(),e.device.setConfiguration(e.configuration,function(r){if(r)return n(r);var i=e.device.interfaces.filter(function(t){return t.descriptor.bInterfaceClass===e.interfaceClass});if(!i.length)throw new Error("No valid interfaces found.");var o=i.find(function(e){return e.endpoints.length>0});if(o||(o=i[0]),e.interfaceNumber=o.interfaceNumber,!e.alwaysControlTransfer){var s=o.endpoints;e.endpointIn=void 0,e.endpointOut=void 0;for(var u=0,a=s;u<a.length;u++){var f=a[u];"in"===f.direction?e.endpointIn=f:e.endpointOut=f}if(e.endpointIn||e.endpointOut)try{o.claim()}catch(t){e.endpointIn=void 0,e.endpointOut=void 0}}t()})})},e.prototype.close=function(){var e=this;return new Promise(function(t,n){e.device.close(),t()})},e.prototype.read=function(){var e=this;return new Promise(function(t,n){if(void 0===e.interfaceNumber)return n("No device opened");e.endpointIn?e.endpointIn.transfer(e.packetSize,function(r,i){if(r)return n(r);t(e.bufferToDataView(i))}):e.device.controlTransfer(161,1,256,e.interfaceNumber,e.packetSize,function(r,i){return r?n(r):i?void t(e.bufferToDataView(i)):n("No buffer read")})})},e.prototype.write=function(e){var t=this,n=this.extendBuffer(e,this.packetSize),r=this.bufferSourceToBuffer(n);return new Promise(function(e,n){if(void 0===t.interfaceNumber)return n("No device opened");t.endpointOut?t.endpointOut.transfer(r,function(t){if(t)return n(t);e()}):t.device.controlTransfer(33,9,512,t.interfaceNumber,r,function(t){if(t)return n(t);e()})})},e}(),A=1,P=255,U=function(){function e(e,t,n,r){void 0===t&&(t=P),void 0===n&&(n=A),void 0===r&&(r=!1),this.device=e,this.interfaceClass=t,this.configuration=n,this.alwaysControlTransfer=r,this.packetSize=64}return e.prototype.extendBuffer=function(e,t){var n=void 0!==e.buffer?e.buffer:e,r=Math.min(n.byteLength,t),i=new Uint8Array(r);return i.set(new Uint8Array(n)),i},e.prototype.open=function(){var e=this;return this.device.open().then(function(){return e.device.selectConfiguration(e.configuration)}).then(function(){var t=e.device.configuration.interfaces.filter(function(t){return t.alternates[0].interfaceClass===e.interfaceClass});if(!t.length)throw new Error("No valid interfaces found.");var n=t.find(function(e){return e.alternates[0].endpoints.length>0});if(n||(n=t[0]),e.interfaceNumber=n.interfaceNumber,!e.alwaysControlTransfer){var r=n.alternates[0].endpoints;e.endpointIn=void 0,e.endpointOut=void 0;for(var i=0,o=r;i<o.length;i++){var s=o[i];"in"===s.direction?e.endpointIn=s:e.endpointOut=s}}return e.device.claimInterface(e.interfaceNumber)})},e.prototype.close=function(){return this.device.close()},e.prototype.read=function(){return void 0===this.interfaceNumber?Promise.reject("No device opened"):this.endpointIn?this.device.transferIn(this.endpointIn.endpointNumber,this.packetSize).then(function(e){return e.data}):this.device.controlTransferIn({requestType:"class",recipient:"interface",request:1,value:256,index:this.interfaceNumber},this.packetSize).then(function(e){return e.data})},e.prototype.write=function(e){if(void 0===this.interfaceNumber)return Promise.reject("No device opened");var t=this.extendBuffer(e,this.packetSize);return this.endpointOut?this.device.transferOut(this.endpointOut.endpointNumber,t).then(function(){}):this.device.controlTransferOut({requestType:"class",recipient:"interface",request:9,value:512,index:this.interfaceNumber},t).then(function(){})},e}();export{v as ADI,l as CmsisDAP,y as CortexM,m as DAPLink,c as DEFAULT_CLOCK_FREQUENCY,f as FPBCtrlMask,w as HID,b as USB,U as WebUSB};
//# sourceMappingURL=dap.esm.js.map
