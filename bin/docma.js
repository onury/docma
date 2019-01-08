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
const Docma = require('../lib/Docma');
const serve = require('./commands/serve');
const doctor = require('./commands/template.doctor');
const init = require('./commands/template.init');
const pkg = require('../package.json');
const utils = require('../lib/utils');

// --------------------------
// CLI SETUP
// --------------------------

const examples = 'Examples:\n'
    + '\n  * Build documentation with a Docma configuration (JSON) file:\n'
    + chalk.white('      docma -c path/to/docma.json')
    + '\n  * If a docma.json exists in the current directory, simply:\n'
    + chalk.white('      docma')
    + '\n  * Output to a different directory:\n'
    + chalk.white('      docma -c path/to/docma.json -d path/to/docs')
    + '\n  * Re-define source files (ignore the ones defined in the config file):\n'
    + chalk.white('      docma -c path/to/docma.json -s path/to/lib-1.js -s path/to/lib-2.js')
    + '\n  * Define name-grouped source files:\n'
    + chalk.white('      docma -c path/to/docma.json -s mylib:path/to/lib-1.js -s mylib:path/to/lib-2.js')
    + '\n'
    + '\n  * See help for `serve` command:\n'
    + chalk.white('      docma serve --help')
    + '\n  * See help for `template` command:\n'
    + chalk.white('      docma template --help');

const serveExamples = 'Examples:\n'
    + '\n  * Serve generated SPA at the default port(9000):\n'
    + chalk.white('      docma serve path/to/docs')
    + '\n  * Serve current working directory:\n'
    + chalk.white('      cd path/to/docs && docma serve')
    + '\n  * Serve configured destination directory (looks for a docma.json):\n'
    + chalk.white('      cd path/to/project && docma serve')
    + '\n  * Configure a custom port and serve:\n'
    + chalk.white('      docma serve path/to/docs -p 8080')
    + '\n  * Serve without request logs\n'
    + chalk.white('      docma serve path/to/docs -q');

const templateDoctorExamples = 'Examples:\n'
    + '\n  * Diagnose a Docma template module:\n'
    + chalk.white('      docma template doctor path/to/project')
    + '\n  * Diagnose a template in current working directory:\n'
    + chalk.white('      cd path/to/project && docma template doctor');

const info = '\n\n'
    + chalk.yellow('Docma Repo ') + '@ ' + chalk.blue('https://github.com/onury/docma')
    + '\n'
    + chalk.yellow('Docma Docs ') + '@ ' + chalk.blue('https://onury.io/docma')
    + '\n'
    + chalk.yellow('Docma CLI ') + ' @ ' + chalk.blue('https://onury.io/docma/cli');

console.log();

const argv = yargs
    .usage('docma [command] [options]\n\nBuild documentation from Javascript, Markdown and HTML files.') // 'Usage: $0 <cmd> [options]'
    .help('h', 'Show this help').alias('h', 'help')
    .version('v', 'Output Docma version', pkg.version).alias('v', 'version')
    .option('c', {
        alias: 'config',
        type: 'string',
        description: 'Docma JSON configuration file path. You can define all build options within this file. Any option (below) set via CLI will overwrite the value defined in this file.',
        global: false,
        normalize: true // apply path.normalize
    })
    .option('s', {
        alias: 'src',
        type: 'array',
        description: '<[name:]path>   Source file path. To define multiple source files, this option can be used more than once. To group/name source files, prefix each path with "name:" e.g. -s a.js -s mylib:b.js -s mylib:c.js -s other:d.js',
        global: false,
        normalize: true
    })
    .option('d', {
        alias: 'dest',
        type: 'string',
        description: '<path>   Destination output directory path.',
        global: false,
        normalize: true
    })
    .option('clean', {
        type: 'boolean',
        description: 'Whether to empty destination directory before building.',
        global: false
    })
    .option('web-logs', {
        type: 'boolean',
        description: '(Debug) Enable logs in the browser console, for the generated SPA.',
        global: false
    })
    .option('V', {
        alias: 'verbose',
        type: 'boolean',
        description: '(Debug) Output verbose logs to consoles.',
        global: false
    })
    .option('nomin', {
        type: 'boolean',
        description: '(Debug) Disable minification for the generated SPA assets. (e.g. js, css files)',
        global: false
    })
    .option('jd-out', {
        type: 'boolean',
        description: '(Debug) Output one or more [name.]jsdoc.json files for each (name-grouped) javascript source.',
        global: false
    })
    .option('debug', {
        type: 'boolean',
        description: 'Enable all debugging options. Equivalent to: --web-logs -v --nomin --jd-out',
        global: false
    })
    .option('q', {
        alias: 'quiet',
        type: 'boolean',
        description: '(Debug) Disable build logs for the Node console.',
        global: false
    })
    .command('serve [path]', 'Start a static server for the generated SPA.', yargs => {
        yargs
            .options({
                p: {
                    alias: 'port',
                    describe: 'Port number to bind the mock-server on.',
                    type: 'number',
                    default: 9000,
                    global: false
                },
                b: {
                    alias: 'base',
                    describe: 'Base path for the application.',
                    type: 'string',
                    default: null,
                    global: false
                },
                q: {
                    alias: 'quiet',
                    type: 'boolean',
                    description: 'Disable request logs for the Node console.',
                    global: false
                }
            })
            .epilog(serveExamples + info);
    })
    .command('template <cmd>', 'Execute template related commands.', yargs => {
        yargs
            .command('init [path]', 'Initialize a new Docma template module.', () => {
                // yargs.options();
            })
            .command('doctor [path]', 'Diagnose a Docma template.', yargs => {
                yargs
                    .options({
                        // v: { alias: 'verbose', default: true },
                        first: {
                            describe: 'Whether to stop on first fault when diagnosing the template.',
                            default: false,
                            global: false
                        }
                    })
                    .epilog(templateDoctorExamples + info);
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
    if (argv.clean) config.clean = Boolean(argv.clean);

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

    if (argv.quiet) {
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
        console.log(chalk.yellow('No source or destination is specified.\n'));
        yargs.showHelp();
        process.exit(0);
    }
    // otherwise we'll use empty config
    console.log(chalk.blue('No configuration file specified. Using default configuration.'));
    return null;
}

// --------------------------
// PROGRAM ROUTINE
// --------------------------

// console.log(argv);

const cmds = argv._ || [];
// checking for `serve` command
if (cmds.indexOf('serve') >= 0) {
    serve(argv.path, {
        port: argv.port,
        base: argv.base,
        quiet: argv.quiet
    });
} else if (cmds.indexOf('template') >= 0) {
    if (cmds.indexOf('init') >= 0) {
        init(argv.path);
    } else if (cmds.indexOf('doctor') >= 0) {
        doctor(argv.path, {
            quiet: argv.quiet,
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
