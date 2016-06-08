/* eslint no-nested-ternary:0 */

var chalk = require('chalk'),
    Table = require('easy-table'),
    _ = require('lodash');

module.exports = (function () {
    'use strict';

    var ArrayProto = Array.prototype,
        PRE = ' » ';

    // ----------------------
    // CLASS: Debug
    // ----------------------

    function Debug(options) {
        if (!_.isPlainObject(options)) options = { level: options };

        var level = options.level;
        this.level = typeof level === 'boolean'
            ? (level ? Debug.JSDOC_OUTPUT : Debug.DISABLED)
            : (typeof level === 'number' ? level : Debug.DISABLED);

        this.colors = Boolean(options.colors);

        this.disabled = this.level === Debug.DISABLED;
        this.jsdocOutput = this.level >= Debug.JSDOC_OUTPUT;
        this.noMinify = this.level >= Debug.NO_MINIFY;
        this.logsEnabled = this.level >= Debug.LOGS_ENABLED;
        this.logsVerbose = this.level >= Debug.LOGS_VERBOSE;
    }

    // ----------------------
    // DEBUG LEVELS
    // ----------------------

    // 0|false - disable debug
    Debug.DISABLED = 0;
    // 1|true - generate ...jsdoc.json output files.
    Debug.JSDOC_OUTPUT = 1;
    // 2 - also disable minification.
    Debug.NO_MINIFY = 2;
    // 3 - also output logs to console.
    Debug.LOGS_ENABLED = 3;
    // 3 - also output verbose (data) logs to console.
    Debug.LOGS_VERBOSE = 4;

    // ----------------------
    // INSTANCE
    // ----------------------

    Debug.prototype.title = function () {
        if (!this.logsEnabled) return;
        var args = ArrayProto.slice.call(arguments);
        args = ['\n' + chalk.white.underline(args.join(' ')) + '\n'];
        console.log.apply(console, args);
    };

    Debug.prototype.data = function () {
        if (!this.logsVerbose) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.gray(PRE + args.join(' '))];
        console.log.apply(console, args);
    };

    Debug.prototype.log = function () {
        if (!this.logsEnabled) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.green(args.join(' '))];
        console.log.apply(console, args);
    };

    Debug.prototype.info = function () {
        if (!this.logsEnabled) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.cyan(args.join(' '))];
        console.info.apply(console, args);
    };

    Debug.prototype.warn = function () {
        if (!this.logsEnabled) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.yellow(PRE + args.join(' '))];
        console.warn.apply(console, args);
    };

    Debug.prototype.error = function () {
        if (!this.logsEnabled) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.red(PRE + args.join(' '))];
        console.error.apply(console, args);
    };

    // Debug.prototype.table = function (array) {
    //     // var table = new Table();
    //     console.log(Table.print(array));
    // };

    Debug.prototype.table = function (array, excludeKeys) {
        // get the first object's keys as column names and remove excluded keys
        // by difference.
        var columns = _.difference(_.keys(array[0]), excludeKeys || []),
            table = new Table();
        array.forEach(function (item) {
            columns.forEach(function (column) {
                table.cell(column, item[column]);
            });
            table.newRow();
        });
        console.log(table.toString());
    };

    // ----------------------

    return Debug;

})();
