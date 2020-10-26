import SerialPort  from 'serialport';
import Listen from './listen.mjs';

const portPath = '/dev/cu.usbserial-120';
const port = new SerialPort(portPath, {baud: 4800});

Listen({
    port,
});
