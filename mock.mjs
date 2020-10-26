import SerialPort from '@serialport/stream';
import Listen from './listen.mjs';
import VirtualSerialPort from 'virtual-serialport';

const portPath = '/dev/ttyUSB0';

const port = new VirtualSerialPort(portPath, {});
/*
const port = new SerialPort(portPath, {
    baudRate: 4800,
});
*/

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
});
