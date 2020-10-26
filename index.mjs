import Listen from './listen.mjs';
import Options from './options.mjs';
import SerialPort  from 'serialport';
import VirtualSerialPort from 'virtual-serialport';

let port;
if (Options.test) {
    port = new VirtualSerialPort(Options.device, {baud: Options.baud});

    const startTime = Date.now();

    setInterval(() => {
        const timeNow = Math.round((Date.now() - startTime) / 10)/100;
        port.writeToComputer(`${timeNow}`, err => {
            if (err) {
                console.log(err.message);
            }
        });
        port.flush();
    }, 50)
} else {
    port = new SerialPort(Options.device, {baud: Options.baud});
}

Listen({
    port,
    apiAddress: Options.vmix,
    apiPort: Options.port,
    inputId: Options.vmixinput,
    fieldName: Options.fieldname,
});
