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
    // INSTANCE
    // ----------------------

    Debug.prototype.title = function () {
        if (!this.buildLogs) return;
        var args = ArrayProto.slice.call(arguments);
        args = ['\n' + chalk.white.underline(args.join(' ')) + '\n'];
        console.log.apply(console, args);
    };

    Debug.prototype.data = function () {
        if (!(this.buildLogs && this.verbose)) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.gray(PRE + args.join(' '))];
        console.log.apply(console, args);
    };

    Debug.prototype.log = function () {
        if (!this.buildLogs) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.green(args.join(' '))];
        console.log.apply(console, args);
    };

    Debug.prototype.info = function () {
        if (!this.buildLogs) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.cyan(args.join(' '))];
        console.info.apply(console, args);
    };

    Debug.prototype.warn = function () {
        if (!this.buildLogs) return;
        var args = ArrayProto.slice.call(arguments);
        args = [chalk.yellow(PRE + args.join(' '))];
        console.warn.apply(console, args);
    };

    Debug.prototype.error = function () {
        if (!this.buildLogs) return;
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
