import Listen from './listen.mjs';
import Options from './options.mjs';
import SerialPort  from 'serialport';

const port = new SerialPort(Options.device, {baud: Options.baud});

Listen({
    port,
    apiAddress: Options.vmix,
    apiPort: Options.port,
    inputId: Options.vmixinput,
    fieldName: Options.field,
});
