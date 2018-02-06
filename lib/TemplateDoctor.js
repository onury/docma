/* eslint */

'use strict';

// core modules
const path = require('path');

// dep modules
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs-extra');

// own modules
const TemplateBuilder = require('./TemplateBuilder');
const utils = require('./utils');
// const docmaPkg = require('../package.json');

// --------------------------------
// Helper Methods
// --------------------------------

function _checkKeywords(pkg = {}) {
    const kw = pkg.keywords || [];
    return kw.indexOf('docma') >= 0 && kw.indexOf('template') >= 0;
}

function _hasDocmaDepIn(pkg, depType) {
    const deps = (pkg || {})[depType] || {};
    return Boolean(deps.docma);
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
 *  Class that runs diagnostics on a target Docma template.
 *  @class
 *  @memberof! Docma.Template
 */
class TemplateDoctor {

    /**
     *  Initializes a new instance of `TemplateDoctor`.
     *  @private
     *  @hideconstructor
     */
    constructor(templatePath, settings = {}) {
        if (typeof templatePath !== 'string' || templatePath.trim() === '') {
            throw new Error('Template path should be specified.');
        }
        templatePath = path.resolve(templatePath);
        const pkgPath = path.join(templatePath, 'package.json');
        this._ = {
            templatePath,
            pkgPath,
            pkg: utils.safeRequire(pkgPath)
        };

        this.settings = _.defaults(settings, {
            quite: false,
            stopOnFirstFailure: false
        });

        this.diagnostics = {
            result: '',
            errors: [],
            warnings: []
        };
    }

    get pkg() {
        return this._.pkg;
    }

    get templateName() {
        return (this.pkg || {}).name || '[unknown]';
    }

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
    _warn(msg) {
        this.diagnostics.warnings.push(msg);
        if (!this.settings.quite) {
            console.log(chalk.yellow(`  !`), chalk.gray(msg));
        }
    }

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
        if (_hasDocmaDepIn(this.pkg, 'dependencies')) {
            this._warn('Remove "docma" dependency from your package. It\'s only needed in "peerDependencies".');
        }
        if (_hasDocmaDepIn(this.pkg, 'devDependencies')) {
            this._warn('Remove "docma" dev-dependency from your package. It\'s only needed in "peerDependencies".');
        }
        if (!_hasDocmaDepIn(this.pkg, 'peerDependencies')) {
            this._error('Missing "docma" peer-dependency in package.json.');
        }

        // check keywords
        if (!_checkKeywords(this.pkg)) {
            this._warn('Include keywords "docma" and "template" in your package.json.');
        }
    }

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

    _tryBuilder() {
        try {
            this.builder = new TemplateBuilder({
                template: {
                    path: this._.templatePath
                }
            });
            this.template = this.builder.template;
        } catch (e) {
            this._error(`Template builder fails with given template. Your module probably exports an improper object.\n    ${chalk.red('Error: ' + e.message)}`);
        }
    }

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
        const c = color[this.diagnostics.result];
        const res = chalk[c](this.diagnostics.result);
        if (!this.settings.quite) console.log(); // extra empty line
        console.log(chalk.white(`Diagnostics completed with ${chalk.underline(res)}!`));
        let statsMsg = chalk.gray(`  ${chalk.underline(nErrors)} error(s), ${chalk.underline(nWarnings)} warning(s).`);
        if (this.settings.stopOnFirstFailure && nErrors) {
            statsMsg += chalk.gray(' Stopped on first failure.');
        }
        console.log(statsMsg + '\n');

        return this.diagnostics;
    }

}

module.exports = TemplateDoctor;
