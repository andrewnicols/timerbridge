import SerialPort from '@serialport/stream';
import Listen from './listen.mjs';
import VirtualSerialPort from 'virtual-serialport';
import Options from './options.mjs';

const port = new VirtualSerialPort(Options.device, {baud: Options.baud});

const startTime = Date.now();

setInterval(() => {
    const timeNow = Math.round((Date.now() - startTime) / 10)/100;
    port.writeToComputer(`${timeNow}`, err => {
        if (err) {
            console.log(err.message);
        }
    });
    port.flush();
}, 1)

Listen({
    port,
    apiAddress: Options.vmix,
    apiPort: Options.port,
    inputId: Options.vmixinput,
    fieldName: Options.field,
});
