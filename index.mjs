#!/usr/bin/env node

import argv from './src/options.mjs';
import Readline from '@serialport/parser-readline';
import SerialPort  from 'serialport';
import VirtualSerialPort from 'virtual-serialport';
import Frontend from './src/frontend.mjs';
import UI from './src/ui.mjs';
import VMix from './src/output/vmix.mjs';

/**
 * Watch the specified Serial Port for changes and push these to the remote client.
 *
 * @param   {SerialPort} port The serial port to watch
 * @param   {String} apiAddress The network name or IP address of the vMix endpoint
 * @param   {Number} apiPort The port number of the vMix endpoint
 * @param   {Number} inputId The vMix input number
 * @param   {String} fieldName The name of the vMix Title within the specified inputId
 */
const listen = (argv, frontend, output) => {
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
            const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
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

const frontend = argv.pretty ? new UI(argv) : new Frontend(argv);
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

listen(argv, frontend, output);
