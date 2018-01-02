/* eslint no-nested-ternary:0 */

'use strict';

const chalk = require('chalk');
const Table = require('easy-table');
const _ = require('lodash');

const PRE = ' » ';

// ----------------------
// CLASS: Debug
// ----------------------

class Debug {
    constructor(options) {
        if (!_.isPlainObject(options)) options = { level: options };

        const level = options.level;
        this.level = typeof level === 'boolean'
            ? (level ? Debug.ALL : Debug.DISABLED)
            : (typeof level === 'number' ? level : Debug.DISABLED);

        this.colors = Boolean(options.colors);

        this.disabled = !this.level;
        this.verbose = (this.level & Debug.VERBOSE) !== 0;
        this.buildLogs = (this.level & Debug.BUILD_LOGS) !== 0;
        this.webLogs = (this.level & Debug.WEB_LOGS) !== 0;
        this.noMinify = (this.level & Debug.NO_MINIFY) !== 0;
        this.jsdocOutput = (this.level & Debug.JSDOC_OUTPUT) !== 0;
    }

    // ----------------------
    // INSTANCE MEMBERS
    // ----------------------

    title(...args) {
        if (!this.buildLogs) return;
        console.log('\n' + chalk.white.underline(args.join(' ')), '\n');
    }

    data(...args) {
        if (!(this.buildLogs && this.verbose)) return;
        console.log(chalk.gray(PRE + args.join(' ')));
    }

    log(...args) {
        if (!this.buildLogs) return;
        console.log(chalk.green(args.join(' ')));
    }

    info(...args) {
        if (!this.buildLogs) return;
        console.info(chalk.cyan(args.join(' ')));
    }

    warn(...args) {
        if (!this.buildLogs) return;
        console.warn(chalk.yellow(args.join(' ')));
    }

    error(...args) {
        if (!this.buildLogs) return;
        console.error(chalk.red(args.join(' ')));
    }

    table(array, excludeKeys = false, accentColIndex = -1) {
        const accIndex = Array.isArray(accentColIndex) ? accentColIndex : [accentColIndex];
        // get the first object's keys as column names and remove excluded keys
        // by difference.
        const columns = _.difference(_.keys(array[0]), excludeKeys || []);
        const table = new Table();

        array.forEach(item => {
            columns.forEach((column, index) => {
                const val = item[column] || '—';
                const styledVal = accIndex.indexOf(index) >= 0 ? chalk.cyan(val) : val;
                table.cell(column, styledVal);
            });
            table.newRow();
        });
        console.log(table.toString());
    }
}

// ----------------------
// DEBUG FLAGS
// ----------------------

// disable debug
Debug.DISABLED = 0;
// output build logs to node console.
Debug.BUILD_LOGS = 1;
// output app logs to browser console.
Debug.WEB_LOGS = 2;
// output verbose logs to consoles.
Debug.VERBOSE = 4;
// disable minification.
Debug.NO_MINIFY = 8;
// generate ...jsdoc.json output files.
Debug.JSDOC_OUTPUT = 16;

// all debug options
Debug.ALL = Debug.BUILD_LOGS
    | Debug.WEB_LOGS
    | Debug.VERBOSE_LOGS
    | Debug.NO_MINIFY
    | Debug.JSDOC_OUTPUT;

// ----------------------

module.exports = Debug;
