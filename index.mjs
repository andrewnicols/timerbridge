#!/usr/bin/env node

import Blessed from 'blessed';

import Net from 'net';
import argv from './src/options.mjs';
import Readline from '@serialport/parser-readline';
import SerialPort  from 'serialport';
import VirtualSerialPort from 'virtual-serialport';

let client = null;
let screen = null;

const setStatus = statusText => {
    screen.data.log.add(statusText);
    screen.log(statusText);
};

const setupScreen = () => {
    screen = Blessed.screen({
        smartCSR: true,
        log: './listen.log',
    });

    screen.title = 'Farmtek Polaris Timer Bridge to vMix';

    // Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
    });

    screen.data.timeBox = Blessed.bigtext({
        label: "Timer data",
        top: 0,
        left: 0,
        width: '50%',
        height: '35%',
        content: '0.00',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            bg: 'magenta',
            border: {
                fg: '#f0f0f0'
            },
            hover: {
                bg: 'green'
            }
        }
    });
    screen.append(screen.data.timeBox);

    screen.data.remoteTimeBox = Blessed.bigtext({
        label: `Data sent to vMix at ${argv.vmix}:${argv.port}/${argv.vmixinput} ${argv.fieldname}`,
        top: '40%',
        left: 0,
        width: '50%',
        height: '35%',
        content: '0.00',
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            bg: 'magenta',
            border: {
                fg: '#f0f0f0'
            },
            hover: {
                bg: 'green'
            }
        }
    });
    screen.append(screen.data.remoteTimeBox);

    screen.data.log = Blessed.log({
        bottom: '0',
        left: '60%',
        height: '100%',
        width: '40%',
        tags: true,
        border: {
            type: 'line',
        },
    });
    screen.append(screen.data.log);
    screen.data.log.focus();

    screen.render();
};

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
                setStatus(`Connected to ${apiAddress}:${apiPort}`);

                resolve(client);
            });

            client.on('end', () => {
                setStatus(`Connection closed by remote side.`);
            });

            client.on('close', () => {
                if (client && !client.pending) {
                    setStatus(`Connection closed`);
                }
            });

            setStatus(`Connecting to ${apiAddress}:${apiPort}`);
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
            setStatus("NO client");
            return;
        }

            connectToClient();
        if (client.destroyed) {
            setStatus("The client was destroyed. Reconnecting.");
            client = null;
            connectToClient();

            return;
        }

        if (client.pending) {
            setStatus(`Unable to set title to ${titleData}. Connection to vMix ${apiAddress}:${apiPort}/${inputId} not ready.`);

            return;
        }

        client.write(`FUNCTION SetText Input=${inputId}&SelectedName=${fieldName}&Value=${titleData}\r\n`);
        screen.data.remoteTimeBox.setContent(titleData + '');
        screen.log(`Remote time set to ${titleData}`);
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

        screen.data.timeBox.setContent(titleData + '');
        screen.debug(`Local time is ${titleData}`);
        screen.render();
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

setupScreen();

let port;
if (argv.test) {
    setStatus(`Connecting to virtual serial port at ${argv.device} (speed ${argv.baud})`);
    port = new VirtualSerialPort(argv.device, {baud: argv.baud});

    const startTime = Date.now();

    setStatus(`Generating test data`);
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
    setStatus(`Connecting to serial port at ${argv.device} (speed ${argv.baud})`);
    port = new SerialPort(argv.device, {baud: argv.baud});
}

listen({
    port,
    apiAddress: argv.vmix,
    apiPort: argv.port,
    inputId: argv.vmixinput,
    fieldName: argv.fieldname,
});
