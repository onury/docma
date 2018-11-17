/* eslint */

'use strict';

// core modules
const path = require('path');

// dep modules
const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const semver = require('semver');

// own modules
const Template = require('./Template');
const HtmlParser = require('./HtmlParser');
const Paths = require('./Paths');
const utils = require('./utils');
const Debug = require('./Debug');
const docmaPkg = require('../package.json');

// Name of content partial  (Dust template)
// This is for misc content; (such as markdown files
// converted to HTML), within the `/content` directory of the output.
// This is also the id of the target element within the partial.
const CONTENT_PARTIAL = 'docma-content';
// ID of the target element within the content partial.
const CONTENT_ELEM_ID = 'docma-content'; // same as partial name

// --------------------------------
// HELPER METHODS
// --------------------------------

/**
 *  Adds the given meta list to the current document of the given jQuery
 *  instance.
 *  @private
 *
 *  @param {jQuery} $ - jQuery instance.
 *  @param {Array} metaList - List of arbitrary meta objects.
 */
function _addMetasToDoc($, metaList) {
    if (!_.isArray(metaList) || metaList.length === 0) return;
    const $head = $('head');
    let lastMeta;
    const existingMetas = $head.find('meta');
    if (existingMetas.length > 0) {
        lastMeta = existingMetas.eq(existingMetas.length - 1);
    } else {
        lastMeta = HtmlParser.DOM.N_TAB + HtmlParser.DOM.getMetaElem(metaList[0]);
        lastMeta = $head.prepend(lastMeta).find('meta');
        metaList.shift(); // remove first
    }
    metaList.forEach(metaInfo => {
        const meta = HtmlParser.DOM.N_TAB + HtmlParser.DOM.getMetaElem(metaInfo);
        lastMeta = $(meta).insertAfter(lastMeta);
    });
}

/**
 *  Prepend the given element before the first existing element of same type.
 *  This is generally used for loading Docma assets first (such as docma-web.js
 *  and docma.css). Update: this is NOT used for scripts anymore, bec. jQuery
 *  2.x duplicates the scripts. For scripts, we use our
 *  `HtmlParser.DOM.insertBeforefirst()` method instead.
 *  @private
 *
 *  @param {jQuery} $container - Container jQuery element.
 *  @param {String} selector - Target element type selector. e.g. `"script"`.
 *  @param {jQuery} elem - Element to be prepended.
 */
function _insertBeforeFirst($container, selector, elem) {
    const foundElems = $container.find(selector);
    if (foundElems.length > 0) {
        foundElems.eq(0).before(elem);
    } else {
        $container.append(elem);
    }
}

// http://stackoverflow.com/a/6969486/112731
function _escapeRegExp(str) {
    return str.replace(/[-[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

// --------------------------------
// CLASS: TemplateBuilder
// --------------------------------

/**
 *  Class that processes and compiles the given Docma template.
 *  @class
 */
class TemplateBuilder {

    /**
     *  Initializes a new instance of `TemplateBuilder`.
     *
     *  @param {Object} [buildConfig={}]
     *         Docma build configuration (that also includes template configuration).
     */
    constructor(buildConfig = {}) {
        this.buildConfig = buildConfig;
        this.$debug = new Debug(buildConfig.debug);

        // dest existance is already checked by Docma.js
        this.dest = buildConfig.dest;

        this.appConfig = buildConfig.app || {};

        const templatePath = (buildConfig.template || {}).path;
        this._initTemplateModule(templatePath || 'default');
    }

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    _getModuleInfo(nameOrPath, safe = true) {
        const fn = safe
            ? utils.safeRequire(nameOrPath)
            : require(nameOrPath);
        if (!fn) return undefined;
        const modulePath = require.resolve(nameOrPath);
        return {
            fn,
            path: modulePath
        };
    }

    _initTemplateModule(nameOrPath) {
        let moduleInfo;
        if (['default', 'zebra', 'docma-template-zebra'].indexOf(nameOrPath) >= 0) {
            // first check if we have a globally installed version
            moduleInfo = this._getModuleInfo('docma-template-zebra');
            // no? then use bundled version
            if (!moduleInfo) {
                // no need for safeRequire() for the bundled
                moduleInfo = this._getModuleInfo(path.join(__dirname, '..', 'templates', 'zebra'), false);
            }

            // if given name or path does not include a sep (/ or \), we'll
            // check if we have a built-in template with that name under
            // `/templates` directory.
        } else if (nameOrPath.indexOf('/') < 0 && nameOrPath.indexOf('\\') < 0) {
            if (/^docma-template-/.test(nameOrPath) === false) {
                moduleInfo = this._getModuleInfo(`docma-template-${nameOrPath}`);
                if (!moduleInfo) moduleInfo = this._getModuleInfo(nameOrPath);
            } else {
                moduleInfo = this._getModuleInfo(nameOrPath);
            }
            if (!moduleInfo) moduleInfo = this._getModuleInfo(path.resolve(nameOrPath));
        } else {
            moduleInfo = this._getModuleInfo(path.resolve(nameOrPath));
        }

        if (!moduleInfo) {
            throw new Error(`Could not load Docma template module: ${nameOrPath}`);
        }
        if (typeof moduleInfo.fn !== 'function') {
            throw new Error('Docma template module should export a function.');
        }

        this.template = new Template({
            path: moduleInfo.path,
            buildConfig: this.buildConfig,
            docmaVersion: docmaPkg.version,
            fnLog: (...args) => {
                this.$debug.data(...args);
            },
            debug: this.$debug
        });

        // executing module fn by passing template instance, modules and
        // utilites to be used within template main module.
        moduleInfo.fn(this.template, {
            _,
            Promise,
            fs,
            dust,
            HtmlParser,
            // Paths,
            utils
        });
    }

    /**
     *  Checks whether the template is compatible with the current Docma
     *  version. Compatible version (range) is defined in `docma.template.json`.
     *  @returns {Boolean} -
     */
    checkVersion() {
        return semver.satisfies(docmaPkg.version, this.template.supportedDocmaVersion);
    }

    /**
     *  Gets template data that will be passed to the document via
     *  `docma.template`.
     *  @returns {Object} -
     */
    getData() {
        const data = _.pick(this.template, [
            'name', 'description', 'version', 'supportedDocmaVersion', 'author', 'license', 'mainHTML', 'options'
        ]);
        data.options = data.options || {};
        return data;
    }

    /**
     *  Conpiles docma.less file that contains necessary styles for specific
     *  features such as emojis used in markdown files.
     *  @returns {Promise} -
     */
    compileDocmaStyles() {
        const compileOpts = {
            filename: path.basename(Paths.DOCMA_LESS), // less file name not the path
            // paths: [path.resolve(lessDir)],
            compress: !this.$debug.noMinify
        };
        this.$debug.data('Compiling:', compileOpts.filename);
        return utils.less.compileFile(Paths.DOCMA_LESS, compileOpts)
            .then(compiled => {
                if (!compiled) return;
                const targetCss = path.join(this.dest, 'css', 'docma.css');
                // creates parent directories if they don't exist
                this.$debug.data('Writing:', path.resolve(targetCss));
                return fs.outputFile(targetCss, compiled.css, 'utf8');
            });
    }

    /**
     *  Compiles template partials into Dust.js templates.
     *  @returns {String} - Compiled javascript source of partials.
     */
    compilePartials() {
        this.$debug.info('Compiling SPA partials...');

        // glob uses forward slash only. (in Windows too)
        const partials = utils.glob.normalize(this.template.templateDir, 'partials/**/*.html');
        return utils.glob.match(partials)
            .then(files => {
                // Dust-compile all partials
                return Promise.map(files, filePath => {
                    this.$debug.data('Compiling:', path.relative(this.template.dirname, filePath));
                    return HtmlParser.fromFile(filePath)
                        .then(parser => {
                            const templateContent = parser.removeComments().content;
                            return dust.compile(templateContent, utils.path.basename(filePath));
                        });
                });
            })
            .then(results => {
                // Now we check if the template has the optional docma-content partial.
                // if not, we'll create and compile a simple docma-content partial.
                const contentPartialPath = path.join(this.template.templateDir, 'partials', `${CONTENT_PARTIAL}.html`);
                return fs.pathExists(contentPartialPath)
                    .then(exists => {
                        if (!exists) {
                            this.$debug.warn('Missing Content Partial:', contentPartialPath);
                            this.$debug.data('Creating:', contentPartialPath);
                            const compiled = dust.compile(`<div id="${CONTENT_ELEM_ID}"></div>`, CONTENT_PARTIAL);
                            results.push(compiled);
                        }
                        return results;
                    });
            })
            .then(results => {
                results.unshift('/* docma (dust) compiled templates */');
                return results.join('\n');
            });
    }

    /**
     *  Copy all template files to destination directory, except for partials
     *  and less directories.
     *
     *  @returns {Promise} -
     */
    copyToDest() {
        this.$debug.info('Copying template files/directories...');

        const templateDir = this.template.templateDir;

        // do not copy the main file (which will be parsed then created at the
        // destination) and partials (which will be compiled into javascript).
        let ignoreList = this.template.ignore || [];
        ignoreList = ignoreList.concat([
            this.template.mainHTML,
            'partials/**'
        ]);
        // normalize the globs (glob paths sep should be `/` even in windows.)
        ignoreList = ignoreList.map(item => utils.glob.normalize(templateDir, item));

        return utils.glob.match(`${templateDir}/**/*`, { ignore: ignoreList })
            // return utils.glob.match(src, { ignore: ignoreList })
            .then(files => {
                let dest;
                return Promise.each(files, filePath => {
                    dest = path.join(this.dest, path.relative(templateDir, filePath));
                    // if src is a directory, only create the directory at the destination.
                    if (fs.lstatSync(filePath).isDirectory()) {
                        this.$debug.data('Creating directory:', path.resolve(dest));
                        return fs.mkdirs(dest);
                    }
                    // otherwise, copy the file to the destination.
                    this.$debug.data('Copying:', path.relative(this.template.dirname, filePath));
                    return fs.copy(filePath, dest);
                    // we don't copy full directories at once bec. in that case,
                    // ignored files will be copied either.
                });
            });
    }

    /**
     *  Generates necessary configuration files required for "path" routing.
     *
     *  An `.htaccess` is generated if `appConfig.server` is set to `"apache"`.
     *  If `appConfig.server` is set to `"github"`, a sub-directory with a
     *  redirecting index file is generated for each content path.
     *
     *  @param {String} [routes] Only used if `appConfig.server` is set to `"github"`.
     *
     *  @returns {Promise} -
     */
    writeServerConfig(routes) {
        this.$debug.info('Evaluating server/host configuration for the SPA...');

        // This is only for "path" routing. For "query" routing, we don't need
        // to redirect paths to main index file, since query-string routing is
        // already done on the main page.
        if (this.appConfig.routing.method !== 'path') {
            return Promise.resolve();
        }

        const base = utils.path.ensureEndSlash(this.appConfig.base, '/');

        if (this.appConfig.server === 'apache') {
            // If Apache; we'll write an .htaccess file basically for
            // redirecting content paths to the main page, since we're
            // generating a SPA.
            const destHtaccess = path.join(this.dest, '.htaccess');
            this.$debug.info('Generating Apache config file (.htaccess):', destHtaccess);

            const main = this.template.mainHTML;
            const mainEsc = _escapeRegExp(this.template.mainHTML);

            return fs.readFile(Paths.APACHE_CONF, 'utf8')
                .then(content => {
                    // replace main file and base path placeholders.
                    content = (content || '')
                        .replace(/%{DOCMA_MAIN}/g, main)
                        .replace(/%{DOCMA_MAIN_ESC}/g, mainEsc)
                        .replace(/%{DOCMA_BASE}/g, base);
                    return fs.writeFile(destHtaccess, content, 'utf8');
                });
        }

        if (['github', 'static', 'windows'].indexOf(this.appConfig.server) >= 0) {
            // GitHub does not support .htaccess or .conf files since it doesn't
            // use Apache or Nginx. So we'll do the same thing as Jekyll
            // (redirect-from) by creating directories and index files for
            // redirecting with http-meta refresh. See
            // https://github.com/jekyll/jekyll-redirect-from

            if (!routes || routes.length === 0) {
                return Promise.resolve();
            }

            this.$debug.info('Generating indexed directories...');

            // read the redirect.html template file into memory.
            return fs.readFile(Paths.REDIRECT_HTML, 'utf8')
                .then(html => {
                    return Promise.each(routes, route => {
                        let p = [this.dest];
                        const routeParts = route.path.split('/');
                        // for api/ path backToBase will be '../'
                        // for api/name/ path backToBase will be '../../'
                        const backToBase = new Array(routeParts.length).join('../');
                        // e.g. guide/ or api/web/
                        p = p.concat(routeParts);
                        p.push('index.html');
                        // const routePath = utils.path.removeLeadSlash(route.path);
                        const reIndexFile = path.join(...p),
                            // replace the redirect content path placeholder
                            // (to be set in sessionStorage) so we can render it
                            // after redirected to the main page.
                            reHtml = html
                                .replace(/%\{BACK_TO_BASE\}/g, backToBase)
                                .replace(/%\{REDIRECT_PATH\}/g, utils.path.removeLeadSlash(route.path)); // utils.path.ensureLeadSlash(route.path)
                        return fs.pathExists(reIndexFile)
                            .then(exists => {
                                if (exists) return;
                                // write the redirecting index file and the
                                // directory if it does not exist.
                                return fs.outputFile(reIndexFile, reHtml, 'utf8');
                            });
                    });
                });
        }
        return Promise.resolve();
    }

    /**
     *  Parses and writes the main HTML file of the template.
     *  @returns {Promise} -
     */
    writeMainHTML() {
        const srcMainFile = path.join(this.template.templateDir, this.template.mainHTML);
        const destMainFile = path.join(this.dest, this.template.mainHTML);

        this.$debug.info('Writing SPA main file...');

        return HtmlParser.fromFile(srcMainFile)
            .then(parser => {
                return parser
                    .removeComments()
                    .edit((window, $) => {

                        const head = $('head');
                        const DOM = HtmlParser.DOM;

                        // Add meta tags
                        const docmaMeta = {
                            name: 'generator',
                            content: 'Docma - https://onury.io/docma'
                        };
                        const metas = (this.appConfig.meta || []).concat([docmaMeta]);
                        _addMetasToDoc($, metas);

                        // if base is not set, DON'T set base or bookmarks won't work
                        if (typeof this.appConfig.base === 'string') {
                            head.prepend(`<base href="${this.appConfig.base}" />`);
                        }

                        // Set title
                        const title = DOM.N_TAB + '<title>' + this.appConfig.title + '</title>' + DOM.N_TAB; // eslint-disable-line
                        head.find('title').remove().end() // .remove('title') doesn't work
                            .prepend(title);

                        if (this.appConfig.favicon) {
                            const favicon = path.basename(this.appConfig.favicon);
                            head.prepend(`<link rel="shortcut icon" href="${favicon}" />`);
                        }

                        // prepend docma-web.js before any javascript file
                        // var docmaWeb = DOM.getScriptElem('js/docma-web.js') + DOM.N_TAB;
                        // we don't use jQuery 2x and _insertBeforeFirst()
                        // for scripts bec. jQuery 2 duplicates the script.
                        DOM.insertAsFirst(window, 'script', { src: 'js/docma-web.js' });

                        // prepend docma.css before any javascript file
                        const docmaCss = DOM.getStyleElem('css/docma.css') + DOM.N_TAB;
                        _insertBeforeFirst(head, 'link[rel=stylesheet]', docmaCss);

                    });
            })
            // some simple beautification after editing the document
            .then(parser => parser.beautify().content)
            .then(parsed => {
                this.$debug.data('Creating:', path.resolve(destMainFile));
                return fs.writeFile(destMainFile, parsed, 'utf8');
            });
    }

    // ---------------------------------------
    // Template main-module related
    // ---------------------------------------

    /**
     *  Ensures a promise of template process function (which is optional).
     *  These methods are defined in the template's main module, if any.
     *  @private
     *
     *  @param {String} fn - Name of the processor function. i.e. `preBuild`,
     *  `postBuild`, `preCompile`, `postCompile`, etc...
     *  @param {Array} [args] - Array of parameters (arguments).
     *  @param {*} [options] - Options.
     *  @param {Function} [log] - Log function to be used.
     *
     *  @returns {Promise} -
     */
    _promiseTemplateProcess(fn, args = [], options = {}) {
        const opts = _.defaults(options, {
            // `'undefined'` means, promise can resolve with any value or can be
            // omitted.
            resolveType: 'undefined',
            defaultResolveValue: undefined,
            log: null
        });

        if (!this.template || typeof this.template[fn] !== 'function') {
            return Promise.resolve(opts.defaultResolveValue);
        }

        if (typeof opts.log === 'function') opts.log();
        // ensure promise
        return Promise.resolve(this.template[fn](...args))
            .then(value => {
                if (opts.resolveType === 'undefined') return value;
                const gotType = utils.type(value);
                if (opts.resolveType !== gotType) {
                    throw new Error(`Template process '${fn}' resolved with an unexpected type of value. Expected '${opts.resolveType}', got '${gotType}'.`);
                }
                return value;
            });
    }

    /**
     *  Pre-process to be run before the whole documentation is built. This
     *  represents the optional `preBuild()` method of the template processor
     *  object, exported from the main module of the template.
     *
     *  @returns {Promise} — Always returns a promise.
     */
    preBuild() {
        return this._promiseTemplateProcess('_preBuild', [], {
            log: () => {
                this.$debug.info('Running template pre-build process...');
            }
        });
    }

    /**
     *  Post-process to be run after the whole documentation is built. This
     *  represents the optional `postBuild()` method of the template processor
     *  object, exported from the main module of the template.
     *
     *  @returns {Promise} — Always returns a promise.
     */
    postBuild() {
        return this._promiseTemplateProcess('_postBuild', [], {
            log: () => {
                this.$debug.info('Running template post-build process...');
            }
        });
    }

}

module.exports = TemplateBuilder;
