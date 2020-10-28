import Yargs from 'yargs';

export default Yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .help('h')
    .alias('h', 'help')

    .options({
        device: {
            description: 'Path to input device',
            alias: 'd',
            nargs: 1,
        },

        baud: {
            description: 'Baud Rate for Farmtek connection',
            default: 4800,
        },

        vmix: {
            description: 'Address of vMix server',
            default: '127.0.0.1',
            alias: 'a',
        },

        port: {
            description: 'vMix Port',
            default: 8099,
            alias: 'p',
        },

        vmixinput: {
            description:'vMix Video Input',
            alias: 'i',
            default: 1,
        },

        fieldname: {
            description: 'vMix Title Name',
            alias: 'f',
            default: 'Clock.text',
        },

        test: {
            description: 'Send test data',
            alias: 't',
            default: false,
            boolean: true,
            bool: true,
        },

        pretty: {
            description: 'Use a pretty interface for display',
            default: true,
            boolean: true,
        }
    })

    .argv;
