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
 *  @since 2.0.0
 *
 *  @example <caption>Custom template module implementation</caption>
 *  module.exports = (template, modules) => {
 *      const { Promise } = modules;
 *
 *      template.mainHTML = 'index.html';
 *
 *      template.defaultOptions = {
 *          title: 'Docs',
 *          searchEnabled: true
 *      };
 *
 *      template.preBuild(() => {
 *          // Do some stuff before the build begins...
 *          return Promise.resolve();
 *      });
 *
 *      template.postBuild(() => {
 *          // Do some stuff after the build completes...
 *          return Promise.resolve();
 *      });
 *  };
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
        if (!params) {
            throw new Error(`Template initialization failed!`);
        }
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

    /**
     *  Gets the package.json contents of the template.
     *  @type {Object}
     */
    get pkg() {
        return this._.pkg;
    }

    /**
     *  Gets the name of the template.
     *  @type {String}
     */
    get name() {
        return this._.pkg.name;
    }

    /**
     *  Gets the description of the template.
     *  @type {String}
     */
    get description() {
        return this._.pkg.description || '';
    }

    /**
     *  Gets the version of the template.
     *  @type {String}
     */
    get version() {
        return this._.pkg.version;
    }

    /**
     *  Gets Docma version, template is built with.
     *  @type {String}
     */
    get docmaVersion() {
        return this._.docmaVersion;
    }

    /**
     *  Gets Docma version (range) supported by this template.
     *  This is set via `peerDependencies` in package.json.
     *  If omitted, returns `">=2.0.0"`.
     *  @type {String}
     */
    get supportedDocmaVersion() {
        return (this._.pkg.peerDependencies || {}).docma || '>=2.0.0';
    }

    /**
     *  Gets the author of the template.
     *  @type {String}
     */
    get author() {
        return this._.author;
    }

    /**
     *  Gets the license of the template.
     *  @type {String}
     */
    get license() {
        return this._.pkg.license || '';
    }

    /**
     *  Gets the path of the template.
     *  @type {String}
     */
    get path() {
        return this._.path;
    }

    /**
     *  Gets the dirname of the template.
     *  @type {String}
     */
    get dirname() {
        return this._.dirname;
    }

    /**
     *  Gets the path of the template directory within the template.
     *  @type {String}
     */
    get templateDir() {
        return this._.templateDir;
    }

    /**
     *  Gets the build configuration used when building documentation with this
     *  template.
     *  @type {Docma~BuildConfiguration}
     */
    get buildConfig() {
        return this._.buildConfig || {};
    }

    /**
     *  Gets or sets the default options of the template.
     *  Default options can be set within the module main JS file or via
     *  `docmaTemplate.defaultOptions` within template's package.json.
     *  @type {Object}
     */
    get defaultOptions() {
        return this._.defaultOptions
            || this._.pkg.docmaTemplate.defaultOptions
            || {};
    }
    set defaultOptions(value) {
        this._.defaultOptions = value;
        this._.options = _.defaultsDeep(this._.options || this._.initialOptions, this.defaultOptions);
    }

    /**
     *  Gets or sets the template options set by the user when building
     *  documentation with this template.
     *  @type {Object}
     */
    get options() {
        return this._.options;
    }
    set options(value) {
        this._.options = _.defaultsDeep(value, this.defaultOptions);
    }

    /**
     *  Gets or sets the main HTML file (name) of the template.
     *  Main HTML file can be set within the module main JS file or via
     *  `docmaTemplate.mainHTML` within template's package.json.
     *  @type {String}
     */
    get mainHTML() {
        return this._.mainHTML
            || this._.pkg.docmaTemplate.mainHTML
            || 'index.html';
    }
    set mainHTML(value) {
        this._.mainHTML = value;
    }

    /**
     *  Gets or sets array of ignored files when building documentation with
     *  this template. Ignored files can be set within the module main JS file
     *  or via `docmaTemplate.ignore` within template's package.json.
     *  @type {Array}
     */
    get ignore() {
        return this._.ignore
            || this._.pkg.docmaTemplate.ignore
            || [];
    }
    set ignore(value) {
        this._.ignore = value;
    }

    /**
     *  Gets or sets array of ignored files when building documentation with
     *  this template. Ignored files can be set within the module main JS file
     *  or via `docmaTemplate.ignore` within template's package.json.
     *  @param {...String} [args=""] - String arguments to be logged.
     */
    log(...args) {
        this._.fnLog(...args);
    }

    /**
     *  Convenience method for joining and getting the source path within
     *  `<root>/template` directory for the given string(s).
     *  @param {...String} [args=""] - String arguments of path sections.
     *  @returns {String}
     */
    getSrcPath(...args) {
        return path.join(this.templateDir, ...args);
    }

    /**
     *  Convenience method for joining and getting the destination path within
     *  build (output) directory for the given string(s).
     *  @param {...String} [args=""] - String arguments of path sections.
     *  @returns {String}
     */
    getDestPath(...args) {
        return path.join(this.buildConfig.dest, ...args);
    }

    /**
     *  Sets a pre-build processor function that is ran right before Docma build
     *  starts.
     *  @param {Function} fn - Processor function. You can return a `Promise` if
     *  this is an async operation.
     */
    preBuild(fn) {
        this._preBuild = typeof fn === 'function' ? fn : () => { };
    }

    /**
     *  Sets a post-build processor function that is ran right after Docma build
     *  completes.
     *  @param {Function} fn - Processor function. You can return a `Promise` if
     *  this is an async operation.
     */
    postBuild(fn) {
        this._postBuild = typeof fn === 'function' ? fn : () => { };
    }

}

module.exports = DocmaTemplate;
