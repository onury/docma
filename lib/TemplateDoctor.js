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
// Mandatory prefix for docma template names
const TEMPLATE_PREFIX = 'docma-template-';
const RE_TEMPLATE_PREFIX = new RegExp('^' + TEMPLATE_PREFIX);
const TEMPLATE_PREFIX_MESSAGE = `Template(package) name should have "${TEMPLATE_PREFIX}*" prefix.`;

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
// CLASS: TemplateDoctor
// --------------------------------

/**
 *  <blockquote>This class is useful for template authors only.</blockquote>
 *
 *  Class that runs diagnostics on a target Docma template by analyzing
 *  the file structure, validating package metadata and testing with the
 *  template builder.
 *
 *  @class
 *  @name TemplateDoctor
 *  @memberof Docma
 *  @since 2.0.0
 */
class TemplateDoctor {

    /**
     *  Initializes a new instance of `Docma.TemplateDoctor`.
     *  @constructs Docma.TemplateDoctor
     *
     *  @param {String} templatePath - Path of the template to be diagnosed.
     *  @param {Object} [settings={}] - Diagnose settings.
     *      @param {Boolean} [settings.quiet=true] - Whether not to log
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
     *  @name Docma.TemplateDoctor#pkg
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
     *  @type {Docma.Template}
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
            quiet: false,
            stopOnFirstFailure: false
        });
    }

    /**
     *  @private
     */
    _error(msg) {
        this.diagnostics.errors.push(msg);
        if (!this.settings.quiet) {
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
        if (!this.settings.quiet) {
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
        const insName = TemplateDoctor.inspectName(this.pkg.name, true);
        if (!insName.valid) {
            this._error(insName.message);
        }
        if (!trim(this.pkg.description)) {
            this._error('No description is provided in package.json.');
        }
        if (!trim(this.pkg.version)) {
            this._error('No version is defined in package.json.');
        } else {
            const insVersion = TemplateDoctor.inspectVersion(this.pkg.version);
            if (!insVersion.valid) {
                this._error('Template version should comply with Semver. See https://semver.org');
            }
            if (insVersion.message) {
                this._warn(insVersion.message);
            }
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
        const readmePath = path.join(this.template.dirname, 'README.md');
        if (!fs.pathExistsSync(readmePath)) {
            this._warn(`Missing "README.md" file.`);
        }
        const licensePath = path.join(this.template.dirname, 'LICENSE');
        const licensePathMD = path.join(this.template.dirname, 'LICENSE.md');
        if (!fs.pathExistsSync(licensePath) && !fs.pathExistsSync(licensePathMD)) {
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

        if (!this.settings.quiet) {
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
     *  Resets the state of the TemplateDoctor instance, cleaning up
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

    /**
     *  @private
     */
    static nameHasPrefix(name) {
        return RE_TEMPLATE_PREFIX.test(name);
    }

    /**
     *  @private
     */
    static removePrefix(name) {
        return name.replace(RE_TEMPLATE_PREFIX, '');
    }

    /**
     *  @private
     */
    static inspectName(name, withPrefix) {
        const result = {
            valid: false,
            message: ''
        };
        if (!trim(name)) {
            result.message = 'Template (package) name is not defined.';
            return result;
        }
        // max length for an NPM package is 214
        const maxLength = 214 - TEMPLATE_PREFIX.length;
        if (withPrefix) {
            if (TemplateDoctor.nameHasPrefix(name)) {
                name = name.replace(RE_TEMPLATE_PREFIX, '');
            } else {
                result.message = TEMPLATE_PREFIX_MESSAGE;
                return result;
            }
        }
        // Similar to NPM naming rules but template naming is a bit more strict.
        // https://docs.npmjs.com/files/package.json#name
        if (name.length > maxLength) {
            result.message = `Template name must be less than or equal to 214 characters, including "${TEMPLATE_PREFIX}*" prefix.`;
            return result;
        }
        if (/[A-Z]/g.test(name)) {
            result.message = `Template name must not have uppercase letters in the name.`;
            return result;
        }
        if (!(/^[a-z\d]/).test(name)) {
            result.message = `Template name should start with a letter or number.`;
            return result;
        }
        return {
            valid: true,
            message: ''
        };
    }

    /**
     *  @private
     */
    static inspectVersion(version) {
        const valid = Boolean(semver.valid(version));
        const message = valid
            ? (semver.lt(version, '1.0.0')
                ? 'Templates with a version less than 1.0.0 will output a warning when building docs.'
                : '')
            : 'Please specify a semantic version.';

        return {
            valid,
            message
        };
    }

    /**
     *  @private
     */
    static inspectMinDocmaVersion(version) {
        let valid = Boolean(semver.valid(version));
        let message = '';
        if (!valid) {
            message = 'Please specify a semantic version.';
        } else if (semver.lt(version, '2.0.0')) {
            message = 'Minimum Docma version cannot be less than 2.0.0';
            valid = false;
        }
        return {
            valid,
            message
        };
    }

}

TemplateDoctor.TEMPLATE_PREFIX = TEMPLATE_PREFIX;
TemplateDoctor.RE_TEMPLATE_PREFIX = RE_TEMPLATE_PREFIX;

module.exports = TemplateDoctor;
