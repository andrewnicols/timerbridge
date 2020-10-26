import Yargs from 'yargs';

export default Yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .help('h')
    .alias('h', 'help')

    .describe('d', 'Path to input device')
    .nargs('d', 1)
    .alias('d', 'device')

    .describe('baud', 'Baud Rate for Farmtek connection')
    .nargs('baud', 1)
    .default('baud', 4800)

    .describe('vmix', 'Address of vMix server')
    .nargs('vmix', 1)
    .default('vmix', '127.0.0.1')

    .describe('port', 'vMix Port')
    .nargs('port', 1)
    .default('port', 8099)

    .describe('vmixinput', 'vMix Video Input')
    .nargs('vmixinput', 1)
    .alias('vmixinput', 'i')
    .default('vmixinput', 1)

    .describe('fieldname', 'vMix Title Name')
    .nargs('fieldname', 1)
    .alias('fieldname', 'f')
    .default('fieldname', 'Clock.text')

    .demandOption(['d'])

    .argv;
