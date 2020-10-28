import Output from './output.mjs';
import Net from 'net';

export default class extends Output {
    constructor(argv, frontend) {
        super(argv, frontend);

        this.connectToClient();
    }

    /**
     * Returns a Promise which will resolve when the Output method is ready to serve data.
     *
     * @returns {Promise}
     */
    ready() {
        return this.connectToClient();
    }

    /**
     * Connect to the client, returning a resolved Promise when connected.
     *
     * @returns {Promise}
     */
    connectToClient() {
        return new Promise(resolve => {
            if (this.client) {
                if (this.client.readyState !== 'open' && !this.client.connecting) {
                    this.client.connect(this.argv.port, this.argv.vmix);
                }

                resolve(this.client);
                return;
            }

            this.client = new Net.Socket();

            this.client.on('error', () => {
                if (this.client && !this.client.connecting) {
                    this.client.connect(this.argv.port, this.argv.vmix);
                }
            });

            this.client.on('ready', () => {
                this.frontend.addLog(`Connected to ${this.argv.vmix}:${this.argv.port}`);

                resolve(this.client);
            });

            this.client.on('end', () => {
                this.frontend.addLog(`Connection closed by remote side.`);
            });

            this.client.on('close', () => {
                if (this.client && !this.client.pending) {
                    this.frontend.addLog(`Connection closed`);
                }
            });

            this.frontend.addLog(`Connecting to ${this.argv.vmix}:${this.argv.port}`);
            this.client.connect(this.argv.port, this.argv.vmix);
        });
    }

    /**
     * Update the title.
     *
     * @param   {String} timeData The value to set
     */
    sendTime(timeData) {
        if (!this.client) {
            this.frontend.addLog("No client");
            return;
        }

        if (this.client.destroyed) {
            this.frontend.addLog("The client was destroyed. Reconnecting.");
            this.client = null;
            this.connectToClient();

            return;
        }

        if (this.client.pending) {
            this.frontend.addLog(`Unable to set title to ${timeData}. Connection to vMix ${this.argv.vmix}:${this.argv.port}/${this.argv.vmixinput} not ready.`);

            return;
        }

        this.client.write(`FUNCTION SetText Input=${this.argv.vmixinput}&SelectedName=${this.argv.fieldname}&Value=${timeData}\r\n`);
        this.frontend.setRemoteTime(timeData);
    }
};
