/* eslint */

'use strict';

// core modules
const path = require('path');

// dep modules
const _ = require('lodash');

// own modules
const utils = require('./utils');

// --------------------------------
// CLASS: DocmaTemplate
// --------------------------------

/**
 *  Class that provides template information and methods for supporting the
 *  documentation build process. An instance of this class is passed to the
 *  template module as the first argument.
 *  @class
 *  @memberof! Docma
 */
class DocmaTemplate {

    /**
     *  Initializes a new instance of `DocmaTemplate`.
     *  @private
     *  @hideconstructor
     *
     *  @param {Object} params
     *      @param {Object} params.modulePath - Resolved path of the template
     *      module.
     *      @param {Object} params.buildConfig - Docma build configuration (that
     *      also includes template configuration).
     *      @param {String} params.docmaVersion - Current Docma version.
     *      @param {Function} params.fnLog - Log function to be used within the
     *      template module.
     */
    constructor(params) {
        const dirname = path.dirname(params.path);
        const pkgPath = path.join(dirname, 'package.json');
        const pkg = utils.safeRequire(pkgPath);
        if (!pkg) {
            throw new Error(`Template package.json is not found at ${pkgPath}`);
        }
        pkg.docmaTemplate = pkg.docmaTemplate || {};

        /** @private */
        this._ = _.extend({}, params, {
            dirname,
            pkg,
            templateDir: path.join(dirname, 'template'),
            initialOptions: (params.buildConfig.template || {}).options || {},
            defaultOptions: null,
            mainHTML: '',
            compile: null,
            ignore: null
        });

        // explicitly execute the setter for defaultOptions
        this.defaultOptions = pkg.docmaTemplate.defaultOptions || {};

        // can be an object or string
        const author = typeof this._.pkg.author === 'string'
            ? this._.pkg.author
            : (this._.pkg.author || {}).name || '';
        // remove <email@email> part, if any.
        this._.author = author.replace(/\s*<.*?>/, '');

        /** @private */
        this._PreBuild = () => { };
        /** @private */
        this._postBuild = () => { };
    }

    get pkg() {
        return this._.pkg;
    }

    get name() {
        return this._.pkg.name;
    }

    get description() {
        return this._.pkg.description || '';
    }

    get version() {
        return this._.pkg.version;
    }

    get docmaVersion() {
        return this._.docmaVersion;
    }

    get supportedDocmaVersion() {
        return (this._.pkg.peerDependencies || {}).docma || '>=2.0.0';
    }

    get author() {
        return this._.author;
    }

    get license() {
        return this._.pkg.license || '';
    }

    get path() {
        return this._.path;
    }

    get dirname() {
        return this._.dirname;
    }

    get templateDir() {
        return this._.templateDir;
    }

    get buildConfig() {
        return this._.buildConfig || {};
    }

    get defaultOptions() {
        return this._.defaultOptions
            || this._.pkg.docmaTemplate.defaultOptions
            || {};
    }
    set defaultOptions(value) {
        this._.defaultOptions = value;
        this._.options = _.defaultsDeep(this._.initialOptions, this.defaultOptions);
    }

    get options() {
        return this._.options;
    }

    get mainHTML() {
        return this._.mainHTML
            || this._.pkg.docmaTemplate.mainHTML
            || 'index.html';
    }
    set mainHTML(value) {
        this._.mainHTML = value;
    }

    get ignore() {
        return this._.ignore
            || this._.pkg.docmaTemplate.ignore
            || [];
    }
    set ignore(value) {
        this._.ignore = value;
    }

    log(...args) {
        this._.fnLog(...args);
    }

    getSrcPath(...args) {
        return path.join(this.templateDir, ...args);
    }

    getDestPath(...args) {
        return path.join(this.buildConfig.dest, ...args);
    }

    preBuild(fn) {
        this._preBuild = typeof fn === 'function' ? fn : () => { };
    }

    postBuild(fn) {
        this._postBuild = typeof fn === 'function' ? fn : () => { };
    }

}

module.exports = DocmaTemplate;
