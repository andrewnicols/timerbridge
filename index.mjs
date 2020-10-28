#!/usr/bin/env node

import Net from 'net';
import argv from './src/options.mjs';
import Readline from '@serialport/parser-readline';
import SerialPort  from 'serialport';
import VirtualSerialPort from 'virtual-serialport';
import Frontend from './src/frontend.mjs';
import UI from './src/ui.mjs';

let client = null;

const getClientConnector = ({apiAddress, apiPort, inputId, fieldName}) => {
    const connectToClient = () => {
        return new Promise(resolve => {
            if (client) {
                if (client.readyState !== 'open' && !client.connecting) {
                    client.connect(apiPort, apiAddress);
                }

                resolve(client);
                return;
            }

            client = new Net.Socket();

            client.on('error', () => {
                if (client && !client.connecting) {
                    client.connect(apiPort, apiAddress);
                }
            });

            client.on('ready', () => {
                frontend.addLog(`Connected to ${apiAddress}:${apiPort}`);

                resolve(client);
            });

            client.on('end', () => {
                frontend.addLog(`Connection closed by remote side.`);
            });

            client.on('close', () => {
                if (client && !client.pending) {
                    frontend.addLog(`Connection closed`);
                }
            });

            frontend.addLog(`Connecting to ${apiAddress}:${apiPort}`);
            client.connect(apiPort, apiAddress);
        });
    };

    const disconnectFromClient = () => {
        client = null;
    };

    /**
     * Update the title.
     *
     * @param   {String} titleData The value to set
     */
    const updateTitle = titleData => {
        if (!client) {
            frontend.addLog("NO client");
            return;
        }

            connectToClient();
        if (client.destroyed) {
            frontend.addLog("The client was destroyed. Reconnecting.");
            client = null;
            connectToClient();

            return;
        }

        if (client.pending) {
            frontend.addLog(`Unable to set title to ${titleData}. Connection to vMix ${apiAddress}:${apiPort}/${inputId} not ready.`);

            return;
        }

        client.write(`FUNCTION SetText Input=${inputId}&SelectedName=${fieldName}&Value=${titleData}\r\n`);
        frontend.setRemoteTime(titleData);
    };

    return {connectToClient, disconnectFromClient, updateTitle};
};

/**
 * Watch the specified Serial Port for changes and push these to the remote client.
 *
 * @param   {SerialPort} port The serial port to watch
 * @param   {String} apiAddress The network name or IP address of the vMix endpoint
 * @param   {Number} apiPort The port number of the vMix endpoint
 * @param   {Number} inputId The vMix input number
 * @param   {String} fieldName The name of the vMix Title within the specified inputId
 */
const listen = ({
    port,
    apiAddress = '127.0.0.1',
    apiPort = 8099,
    inputId = 1,
    fieldName = 'Clock.text',
} = {}) => {
    const {connectToClient, updateTitle} = getClientConnector({apiAddress, apiPort, inputId, fieldName});

    let lastResponse = '';

    /**
     * Update the title if has changed.
     *
     * @param   {String} titleData The value to set
     */
    const updateTitleIfChanged = titleData => {
        if (lastResponse !== titleData) {
            lastResponse = titleData;
            updateTitle(titleData);
        }

        frontend.setLocalTime(titleData);
    };


    return connectToClient()
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

let port;
if (argv.test) {
    frontend.addLog(`Connecting to virtual serial port at ${argv.device} (speed ${argv.baud})`);
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

listen({
    port,
    apiAddress: argv.vmix,
    apiPort: argv.port,
    inputId: argv.vmixinput,
    fieldName: argv.fieldname,
});
