import argv from './options.mjs';
import Readline from '@serialport/parser-readline';
import SerialPort  from 'serialport';
import VirtualSerialPort from 'virtual-serialport';

import VMix from './output/vmix.mjs';

/**
 * Watch the specified Serial Port for changes and push these to the remote client.
 *
 * @param   {SerialPort} port The SerialPort that the Farmtek console is connected to
 * @param   {Object} argv Arguments provided to the program
 * @param   {UI} frontend The UI used to display data locally
 * @param   {Output} output The target system
 */
const listen = (port, argv, frontend, output) => {
    let lastTime = '';

    /**
     * Update the title if has changed.
     *
     * @param   {String} titleData The value to set
     */
    const updateTitleIfChanged = timeData => {
        if (lastTime !== timeData) {
            lastTime = timeData;
            output.sendTime(timeData);
        }

        frontend.setLocalTime(timeData);
    };


    return output.ready()
    .then(client => {
        if (port.pipe) {
            const parser = port.pipe(new Readline({ delimiter: '\r', encoding: 'latin1'  }))
            if (parser) {
                return parser;
            }
        }
        return Promise.resolve(port);
    })
    .then(pipe => {
        pipe.on('data', updateTitleIfChanged)

        return pipe;
    });
};

const getFrontend = isPretty => {
    if (isPretty) {
        return import('./ui/blessed.mjs').then(UI => new UI.default(argv));
    }

    return import('./ui/console.mjs').then(UI => new UI.default(argv));
}

export const run = async() => {
    const frontend = await getFrontend(argv.pretty);
    const output = new VMix(argv, frontend);

    let port;
    if (argv.test) {
        frontend.addLog(`Connecting to virtual serial port`);
        port = new VirtualSerialPort(argv.device, {baud: argv.baud});

        const startTime = Date.now();

        frontend.addLog(`Generating test data`);
        setInterval(() => {
            const timeNow = Math.round((Date.now() - startTime) / 10) / 100;
            port.writeToComputer(`${timeNow}`, err => {
                if (err) {
                    console.log(err.message);
                }
            });
            port.flush();
        }, 5)
    } else {
        frontend.addLog(`Connecting to serial port at ${argv.device} (speed ${argv.baud})`);
        port = new SerialPort(argv.device, {baud: argv.baud});
    }

    listen(port, argv, frontend, output);
};
