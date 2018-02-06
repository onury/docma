#!/usr/bin/env node

/* eslint prefer-template:0 */

// --------------------------
// DOCMA CLI
// --------------------------

'use strict';

// core modules
const path = require('path');

// dep modules
const yargs = require('yargs');
const _ = require('lodash');
const fs = require('fs-extra');
const chalk = require('chalk');

// own modules
const Docma = require('../lib/docma');
const serve = require('./commands/serve');
const doctor = require('./commands/template.doctor');
const pkg = require('../package.json');
const utils = require('../lib/utils');

// --------------------------
// CLI SETUP
// --------------------------

const examples = 'Examples:\n\n'
    + '  * Build documentation with a Docma configuration (JSON) file:\n'
    + chalk.white('      docma -c path/to/docma.json')
    + '\n  * If a docma.json exists in the current directory, simply:\n'
    + chalk.white('      docma')
    + '\n  * Output to a different directory:\n'
    + chalk.white('      docma -c path/to/docma.json -d path/to/docs')
    + '\n  * Re-define source files (ignore the ones defined in the config file):\n'
    + chalk.white('      docma -c path/to/docma.json -s path/to/lib-1.js -s path/to/lib-2.js')
    + '\n  * Define name-grouped source files:\n'
    + chalk.white('      docma -c path/to/docma.json -s mylib:path/to/lib-1.js -s mylib:path/to/lib-2.js')
    + '\n  * Serve generated SPA at the default port (9000):\n'
    + chalk.white('      docma serve /path/to/docs')
    + '\n  * Configure a custom port and serve:\n'
    + chalk.white('      docma serve /path/to/docs -p 8080');

const info = '\n\n'
    + chalk.yellow('Docma Repo ') + '@ ' + chalk.blue('https://github.com/onury/docma')
    + '\n'
    + chalk.yellow('Docma Docs ') + '@ ' + chalk.blue('https://onury.io/docma')
    + '\n'
    + chalk.yellow('Docma CLI ') + ' @ ' + chalk.blue('https://onury.io/docma/?content=docma-cli');

console.log();

const argv = yargs
    .usage('Usage: docma [options]') // 'Usage: $0 <cmd> [options]'
    .help('h', 'Show this help').alias('h', 'help')
    .version('V', 'Output Docma version', pkg.version).alias('V', 'version')
    .option('c', {
        alias: 'config',
        type: 'string',
        description: 'Docma JSON configuration file path. You can define all build options within this file. Any option (below) set via CLI will overwrite the value defined in this file.',
        normalize: true // apply path.normalize
    })
    .option('s', {
        alias: 'src',
        type: 'array',
        description: '<[name:]path>   Source file path. To define multiple source files, this option can be used more than once. To group/name source files, prefix each path with "name:" e.g. -s a.js -s mylib:b.js -s mylib:c.js -s other:d.js',
        normalize: true
    })
    .option('d', {
        alias: 'dest',
        type: 'string',
        description: '<path>   Destination output directory path. CAUTION: This directory will be emptied.',
        normalize: true
    })
    .option('web-logs', {
        type: 'boolean',
        description: '(Debug) Enable logs in the browser console, for the generated SPA.'
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        description: '(Debug) Output verbose logs to consoles.'
    })
    .option('nomin', {
        type: 'boolean',
        description: '(Debug) Disable minification for the generated SPA assets. (e.g. js, css files)'
    })
    .option('jd-out', {
        type: 'boolean',
        description: '(Debug) Output one or more [name.]jsdoc.json files for each (name-grouped) javascript source.'
    })
    .option('debug', {
        type: 'boolean',
        description: 'Enable all debugging options. Equivalent to: --web-logs -v --nomin --jd-out'
    })
    .option('q', {
        alias: 'quite',
        type: 'boolean',
        description: '(Debug) Disable build logs for the Node console.'
    })
    .command('serve [spaPath]', 'Start a static server for the generated SPA.')
    .option('p', {
        alias: 'port',
        describe: 'Port number to bind the mock-server on.',
        type: 'number',
        default: 9000
    })
    .command('template init [path]', 'Initialize a new Docma template.', yargs => {
        // yargs
        //     .options({
        //         v: { alias: 'verbose', default: true }
        //     });
    })
    .command('template doctor [path]', 'Diagnose a Docma template.', yargs => {
        yargs
            .options({
                // v: { alias: 'verbose', default: true },
                first: {
                    describe: 'Whether to stop on first failure when diagnosing a template.',
                    default: false
                }
            });
    })
    .wrap(80)
    // .locale('en')
    .epilog(examples + info)
    .showHelpOnFail(false, 'Run with --help for available options.')
    .argv;

// --------------------------
// PROGRAM HELPERS
// --------------------------

function updateConfig(config) {
    config = config || {};
    if (argv.src && argv.src.length) {
        config.src = [];
        let s, p;
        const named = {};
        _.each(argv.src, item => {
            s = item.split(':');
            if (s.length > 1) {
                p = s[0];
                named[p] = named[p] || [];
                named[p].push(s.slice(1));
            } else {
                config.src.push(item);
            }
        });
        if (_.keys(named).length) config.src.push(named);
    }

    if (argv.dest) config.dest = argv.dest;

    // DEBUG OPTIONS

    let debug = 0;

    if (argv.debug) {
        debug |= 31;
    } else {
        if (argv['web-logs']) debug |= 2;
        if (argv.verbose) debug |= 4;
        if (argv.nomin) debug |= 8;
        if (argv['jd-out']) debug |= 16;
    }

    if (debug > 0) {
        config.debug = debug;
    } else {
        config.debug = typeof config.debug === 'boolean'
            ? (config.debug ? 31 : 1)
            : (typeof config.debug === 'number' ? config.debug : 1);
    }

    if (argv.quite) {
        config.debug &= ~1; // unset node logs
    } else {
        if (config.debug & 1 === 0) config.debug = 1;
    }

    return config;
}

function getConfigFileSync() {
    if (argv.config) {
        if (fs.pathExistsSync(argv.config)) return path.resolve(argv.config);
        // throw only if -c option is set initially and file does not exist
        console.error(chalk.red(`Error: Config file "${argv.config}" does not exist.`));
        process.exit(1);
    }

    // otherwise, try other default config file names.
    const conf = utils._findDocmaConfigFileSync();
    if (conf) {
        console.log(chalk.blue(`Using configuration file: ${conf}`));
        return conf;
    }

    // if `docma` is run with no options/commands,
    // we'll display help.
    if (!process.argv.slice(2).length) {
        console.log(chalk.yellow(`No source or destination is specified.\n`));
        yargs.showHelp();
        process.exit(0);
    }
    // otherwise we'll use empty config
    console.log(chalk.blue(`No configuration file specified. Using default configuration.`));
    return null;
}

// --------------------------
// PROGRAM ROUTINE
// --------------------------

// console.log(argv);

const cmds = argv._ || [];
// checking for `serve` command
if (cmds.indexOf('serve') >= 0) {
    serve(argv.spaPath, {
        port: argv.port,
        quite: argv.quite
    });
} else if (cmds.indexOf('template') >= 0) {
    if (argv.doctor) {
        console.log(argv);
        doctor(argv.path, {
            quite: argv.quite,
            stopOnFirstFailure: argv.first
        });
    }
} else {
    const configFile = getConfigFileSync();

    Promise.resolve()
        .then(() => {
            return configFile
                ? utils.json.read(configFile)
                : {}; // use empty config
        })
        .then(config => {
            config = updateConfig(config);
            return Docma.create().build(config);
        })
        .catch(error => {
            console.error(chalk.red(error.stack || error));
        });
}
