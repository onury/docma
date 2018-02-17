/* eslint */

'use strict';

// core modules
const path = require('path');

// dep modules
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs-extra');
const semver = require('semver');

// own modules
const TemplateBuilder = require('./TemplateBuilder');
const utils = require('./utils');
// const docmaPkg = require('../package.json');

// Minimum (peer) Docma version must be 2.0.0
const MIN_DOCMA_VERSION = '2.0.0';

// --------------------------------
// Helper Methods
// --------------------------------

function _checkKeywords(pkg = {}) {
    const kw = pkg.keywords || [];
    return kw.indexOf('docma') >= 0 && kw.indexOf('template') >= 0;
}

function _getDocmaDepVersionIn(pkg, depType) {
    const deps = (pkg || {})[depType] || {};
    return deps.docma;
}

function _inspectDocmaPeerVersion(pkg) {
    const peerDocmaVersion = _getDocmaDepVersionIn(pkg, 'peerDependencies');
    if (!peerDocmaVersion) return null;
    const clean = semver.clean(peerDocmaVersion);
    const validRange = semver.validRange(peerDocmaVersion);
    const next = semver.inc(clean, 'major');
    return {
        clean,
        validRange,
        minVersionOK: semver.satisifies(MIN_DOCMA_VERSION, peerDocmaVersion),
        supportsNextVersion: semver.satisifies(next, peerDocmaVersion),
        suggestedRange: validRange ? `>=${clean}` : `>=${MIN_DOCMA_VERSION}`
    };
}

function trim(s) {
    return _.trim(s || '');
}

/** @private */
const color = {
    failure: 'red',
    warnings: 'yellow',
    success: 'green'
};

// --------------------------------
// CLASS: DocmaTemplateDoctor
// --------------------------------

/**
 *  Class that runs diagnostics on a target Docma template by analyzing
 *  the file structure, validating package metadata and testing with the
 *  template builder.
 *  @class
 *  @name Docma.TemplateDoctor
 *  @lends Docma.TemplateDoctor
 *  @since 2.0.0
 */
class DocmaTemplateDoctor {

    /**
     *  Initializes a new instance of `Docma.TemplateDoctor`.
     *
     *  @param {String} templatePath - Path of the template to be diagnosed.
     *  @param {Object} [settings={}] - Diagnose settings.
     *      @param {Boolean} [settings.quite=true] - Whether not to log
     *      diagnostics information to console.
     *      @param {Boolean} [settings.stopOnFirstFailure=false] - Whether
     *      to stop on first failure.
     */
    constructor(templatePath, settings = {}) {
        if (typeof templatePath !== 'string' || templatePath.trim() === '') {
            throw new Error('Template path should be specified.');
        }
        templatePath = path.resolve(templatePath);
        const pkgPath = path.join(templatePath, 'package.json');

        /**
         * @private
         */
        this._ = {
            templatePath,
            pkgPath,
            pkg: utils.safeRequire(pkgPath),
            builder: null,
            template: null,
            settings: null,
            diagnostics: null
        };

        this.settings = settings;
    }

    /**
     *  Gets the package.json contents of the Docma template anayzed.
     *  @type {Object}
     */
    get pkg() {
        return this._.pkg;
    }

    /**
     *  Gets the name of the Docma template.
     *  @type {String}
     *  @name Docma.TemplateDoctor#templateName
     */
    get templateName() {
        return (this.pkg || {}).name || '[unknown]';
    }

    /**
     *  Gets the template instance created while diagnosing. In other words,
     *  template instance is only available after `.diagnose()` is called.
     *  @type {DocmaTemplate}
     *  @name Docma.TemplateDoctor#template
     */
    get template() {
        return this._.template;
    }

    /**
     *  Gets the diagnostics data object that contains the results.
     *  @type {Object}
     *  @name Docma.TemplateDoctor#diagnostics
     */
    get diagnostics() {
        return this._.diagnostics;
    }

    /**
     *  Gets or sets the diagnostics settings.
     *  @type {Object}
     *  @name Docma.TemplateDoctor#settings
     */
    get settings() {
        return this._.settings;
    }
    set settings(value) {
        this._.settings = _.defaults(value, {
            quite: false,
            stopOnFirstFailure: false
        });
    }

    /**
     *  @private
     */
    _error(msg) {
        this.diagnostics.errors.push(msg);
        if (!this.settings.quite) {
            console.log(chalk.red(`  ✕`), msg);
        }
        // throw to exit early from diagnose()
        if (this.settings.stopOnFirstFailure) {
            throw new Error();
        }
    }
    /**
     *  @private
     */
    _warn(msg) {
        this.diagnostics.warnings.push(msg);
        if (!this.settings.quite) {
            console.log(chalk.yellow(`  !`), chalk.gray(msg));
        }
    }

    /**
     *  @private
     */
    _checkPkg() {
        if (!this.pkg) {
            this._error('No package.json is found in template directory.');
            return;
        }

        // check package config
        if (!trim(this.pkg.name)) {
            this._error('No template (package) name is defined in package.json.');
        }
        if (!(/^docma-template-.*/).test(trim(this.pkg.name))) {
            this._error('Template (package) name should have "docma-template-*" prefix.');
        }
        if (!trim(this.pkg.description)) {
            this._error('No description is provided in package.json.');
        }
        if (!trim(this.pkg.version)) {
            this._error('No version is defined in package.json.');
        }
        if (!trim(this.pkg.license)) {
            this._error('No license is defined in package.json.');
        }
        if (!trim(this.pkg.author)) {
            this._error('No author is defined in package.json.');
        }

        // check dependencies
        if (_getDocmaDepVersionIn(this.pkg, 'dependencies')) {
            this._warn('Remove "docma" dependency from your package. It\'s only required in "peerDependencies".');
        }
        if (_getDocmaDepVersionIn(this.pkg, 'devDependencies')) {
            this._warn('Remove "docma" dev-dependency from your package. It\'s only required in "peerDependencies".');
        }

        const peerInfo = _inspectDocmaPeerVersion(this.pkg);
        if (!peerInfo) {
            this._error('Missing "docma" peer-dependency in package.json.');
        } else if (!peerInfo.validRange) {
            this._error(`"docma" peer-dependency does not have a valid range. Suggested range: "${peerInfo.suggestedRange}"`);
        } else if (!peerInfo.minVersionOK) {
            this._error(`Minimum "docma" peer-dependency version must be "${MIN_DOCMA_VERSION}". Suggested Range: ">=${MIN_DOCMA_VERSION}"`);
        } else if (!peerInfo.supportsNextVersion) {
            this._warn(`"docma" peer-dependency version range does not cover next Docma version. Are you OK with this? Suggested range: "${peerInfo.suggestedRange}"`);
        }

        // check keywords
        if (!_checkKeywords(this.pkg)) {
            this._warn('Include keywords "docma" and "template" in your package.json.');
        }
    }

    /**
     *  @private
     */
    _checkStructure() {
        if (!this.template) return;

        // check file/folder structure
        if (!fs.pathExistsSync(this.template.templateDir)) {
            this._error('Missing "/template" directory in the root of the package.');
        }
        const mainHtmlPath = path.join(this.template.templateDir, this.template.mainHTML);
        if (!fs.pathExistsSync(mainHtmlPath)) {
            this._error(`Missing "/template/${this.template.mainHTML}" file.`);
        }
        const partialsDir = path.join(this.template.templateDir, 'partials');
        if (!fs.pathExistsSync(partialsDir)) {
            this._error(`Missing "/template/partials" directory.`);
        }
        const apiPartial = path.join(partialsDir, 'docma-api.html');
        if (!fs.pathExistsSync(apiPartial)) {
            this._error(`Missing "/template/partials/docma-api.html" file.`);
        }
        const licensePath = path.join(this.template.dirname, 'LICENSE');
        if (!fs.pathExistsSync(licensePath)) {
            this._warn(`Missing "LICENSE" file.`);
        }
    }

    /**
     *  @private
     */
    _tryBuilder() {
        try {
            this._.builder = new TemplateBuilder({
                template: {
                    path: this._.templatePath
                }
            });
            this._.template = this._.builder.template;
        } catch (e) {
            this._error(`Template builder fails with given template. Your module probably exports an improper object.\n    ${chalk.red('Error: ' + e.message)}`);
        }
    }

    /**
     *  Analyzes the Docma template and collects diagnostics information on the
     *  template structure, package health and builder initialization.
     *  @name Docma.TemplateDoctor#diagnose
     *  @method
     *
     *  @returns {Object} - Diagnostics data.
     */
    diagnose() {
        try {
            if (!this.pkg) {
                this._error('No package.json is found in template directory.');
            } else {
                this._checkPkg();
            }

            this._tryBuilder();
            this._checkStructure();
        } catch (e) {
            // e is thrown for exiting early.
            // console.log(e);
        }

        const nErrors = this.diagnostics.errors.length;
        const nWarnings = this.diagnostics.warnings.length;
        this.diagnostics.result = nErrors === 0
            ? (nWarnings > 0 ? 'warnings' : 'success')
            : 'failure';

        if (!this.settings.quite) {
            const c = color[this.diagnostics.result];
            const res = chalk[c](this.diagnostics.result);
            console.log();
            console.log(chalk.white(`Diagnostics completed with ${chalk.underline(res)}!`));
            let statsMsg = chalk.gray(`  ${chalk.underline(nErrors)} error(s), ${chalk.underline(nWarnings)} warning(s).`);
            if (this.settings.stopOnFirstFailure && nErrors) {
                statsMsg += chalk.gray(' Stopped on first failure.');
            }
            console.log(statsMsg + '\n');
        }

        return this.diagnostics;
    }

    /**
     *  Resets the state of the DocmaTemplateDoctor instance, cleaning up
     *  previous diagnosis information and data. (Note that settings are not
     *  reset.)
     *  @name Docma.TemplateDoctor#reset
     *  @method
     */
    reset() {
        this._.diagnostics = {
            result: '',
            errors: [],
            warnings: []
        };
        this._.template = null;
        this._.builder = null;
    }

}

module.exports = DocmaTemplateDoctor;
