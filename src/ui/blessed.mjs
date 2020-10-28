import Blessed from 'blessed';
import UI from './ui.mjs';

export default class extends UI {
    constructor(argv = {}) {
        super(argv);

        const screen = Blessed.screen({
            smartCSR: true,
            log: './listen.log',
        });

        screen.title = 'Farmtek Polaris Timer Bridge to vMix';

        // Quit on Escape, q, or Control-C.
        screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

        this.addTimeBox(screen, 'localTimeBox', {
            label: 'Timer data',
            top: 0,
        });

        this.addTimeBox(screen, 'remoteTimeBox', {
            label: `Data sent to vMix at ${argv.vmix}:${argv.port}/${argv.vmixinput} ${argv.fieldname}`,
            top: 16 * 1
        });

        this.setupLogRegion(screen);

        screen.render();
        this.screen = screen;
    }

    setupLogRegion(screen) {
        this.log = Blessed.log({
            bottom: '0',
            left: 110,
            height: '100%',
            tags: true,
            border: {
                type: 'line',
            },
        });
        screen.append(this.log);
        this.log.focus();
    }

    addTimeBox(screen, fieldName, options = {
        label,
        top,
    }) {
        const timeBox = Blessed.bigtext(Object.assign(
            {
                left: 0,
                width: 110,
                height: 16,
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
            }, options)
        );
        screen.append(timeBox);
        this[fieldName] = timeBox;
    }

    addLog(statusText) {
        this.log.add(statusText);
        this.screen.log(statusText);
    }

    setLocalTime(time) {
        this.localTimeBox.setContent(time);
        this.screen.debug(`Local time is ${time}`);
        this.screen.render();
    }

    setRemoteTime(time) {
        this.remoteTimeBox.setContent(time);
        this.screen.debug(`Remote time is ${time}`);
        this.screen.render();
    }
}
