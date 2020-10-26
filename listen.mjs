import Readline from '@serialport/parser-readline';
import Net from 'net';

import Blessed from 'blessed';

let client = null;
let screen = null;

const setStatus = statusText => {
    screen.data.log.add(statusText);
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
        screen.data.remoteTimeBox.setContent(titleData);
    };

    return {connectToClient, disconnectFromClient, updateTitle};
};

const setupScreen = () => {
    screen = Blessed.screen({smartCSR: true});
    screen.title = 'Farmtek Polaris Timer Bridge to vMix';

    // Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
    });

    screen.data.timeBox = Blessed.bigtext({
        label: "Timer data",
        top: 0,
        left: 0,
        align: 'right',
        width: '40%',
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
        label: "Data sent to vMix",
        top: 0,
        right: 0,
        align: 'right',
        width: '40%',
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
        left: 'center',
        height: '50%',
        width: '100%',
        tags: true,
        border: {
            type: 'line',
        },
    });
    screen.append(screen.data.log);
    screen.data.log.focus();

    screen.render();
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
export default ({
    port,
    apiAddress = '127.0.0.1',
    apiPort = 8099,
    inputId = 1,
    fieldName = 'Clock.text',
} = {}) => {
    const {connectToClient, updateTitle} = getClientConnector({apiAddress, apiPort, inputId, fieldName});

    setupScreen();

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

        screen.data.timeBox.setContent(titleData);
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
