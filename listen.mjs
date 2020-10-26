import Readline from '@serialport/parser-readline';
import Net from 'net';

const getClientConnector = ({apiAddress, apiPort, inputId, fieldName}) => {
    let client;

    const setupClientListeners = () => {
        client.on('end', () => {
            console.log(`Connection closed by remote side.`);
            client = null;
        });

        client.on('close', () => {
            if (client && !client.pending) {
                console.log(`Connection closed`);
                client = null;
            }
        });

        client.on('error', () => {
            if (client && !client.connecting) {
                client = null;
            }
        });
    };

    const connectToClient = () => {
        if (client) {
            return;
        }

        client = new Net.Socket();
        setupClientListeners();

        client.connect(apiPort, apiAddress, () => {
            console.log(`Connected to ${apiAddress}:${apiPort}`);
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
        if (!client || client.destroyed) {
            connectToClient();

            return;
        }

        if (client.pending) {
            console.log(`Unable to set title to ${titleData}. Connection to vMix ${apiAddress}:${apiPort}/${inputId} not ready.`);

            return;
        }

        if (client.connecting) {
            return;
        }

        console.debug(titleData);
        client.write(`FUNCTION SetText Input=${inputId}&SelectedName=${fieldName}&Value=${titleData}\r\n`);
    };

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
    };

    return {connectToClient, disconnectFromClient, updateTitle, updateTitleIfChanged};
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
    const {connectToClient, updateTitle, updateTitleIfChanged} = getClientConnector({apiAddress, apiPort, inputId, fieldName});
    connectToClient();

    if (port.pipe) {
        const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
        parser.on('data', updateTitleIfChanged)
    } else {
        port.on('data', updateTitleIfChanged)
    }
};
