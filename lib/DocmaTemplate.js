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
 *  Used for the `.compile` template option. Each key is a target file and each
 *  value is a output file. So we filter the files by extension with this
 *  method.
 *  @private
 *
 *  @param {Object} obj - Object to be filtered.
 *  @param {String} keyExt - File extension to be found in the keys, with the
 *  dot. e.g. `".js"`
 *  @param {String} [valExt] - File extension to be found in the values, with
 *  the dot.
 *
 *  @returns {Object}
 */
function _filterByExtension(obj, keyExt, valExt) {
    const o = {};
    valExt = valExt || keyExt;
    _.each(obj || {}, (value, key) => {
        if (_.endsWith(key.toLowerCase(), keyExt)
            || _.endsWith(String(value).toLowerCase(), valExt)) {
            o[key] = value;
        }
    });
    return o;
}

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
 *  Prepend the given element before the first existing element of same
 *  type. This is generally used for loading Docma assets first (such as
 *  docma-web.js and docma.css).
 *  Update: this is NOT used for scripts anymore, bec. jQuery 2.x duplicates
 *  the scripts. For scripts, we use our
 *  `HtmlParser.DOM.insertBeforefirst()` method instead.
 *  @private
 *
 *  @param {jQuery} container
 *         Container jQuery element.
 *  @param {String} selector
 *         Target element type selector. e.g. `"script"`.
 *  @param {jQuery} elem
 *         Element to be prepended.
 */
function _insertBeforeFirst(container, selector, elem) {
    const foundElems = container.find(selector);
    if (foundElems.length > 0) {
        foundElems.eq(0).before(elem);
    } else {
        container.append(elem);
    }
}

// http://stackoverflow.com/a/6969486/112731
function _escapeRegExp(str) {
    return str.replace(/[-[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

// --------------------------------
// CLASS: DocmaTemplate
// --------------------------------

/**
 *  Class that processes and compiles the given Docma template.
 *  @class
 */
class DocmaTemplate {

    /**
     *  Initializes a new instance of `DocmaTemplate`.
     *
     *  @param {Object} buildConfig
     *         Docma build configuration (that also includes template configuration).
     */
    constructor(buildConfig) {
        this.buildConfig = buildConfig;
        this.$debug = new Debug(buildConfig.debug);

        // dest existance is already checked by Docma.js
        this.dest = buildConfig.dest;

        // template config
        const config = _.defaultsDeep(buildConfig.template, {
            path: 'default'
        });

        this.initTemplateModule(config.path);
        const pkgTemplate = this.module.pkg.docmaTemplate || {};
        const defaultOptions = _.defaultsDeep(
            this.module.instance.defaultOptions,
            pkgTemplate.defaultOptions
        ) || {};

        this.config = _.defaultsDeep(config, {
            // conf file defaults
            name: this.module.pkg.name,
            description: this.module.pkg.description,
            version: this.module.pkg.version,
            docmaVersion: this.module.instance.docmaVersion || this.module.pkg.docmaVersion || '>=2.0.0',
            author: this.module.pkg.author || '',
            license: this.module.pkg.license || '',
            mainHTML: this.module.instance.mainHTML || pkgTemplate.mainHTML || 'index.html',
            options: defaultOptions,
            compile: this.module.instance.compile || pkgTemplate.compile || {},
            ignore: this.module.instance.ignore || pkgTemplate.ignore || []
        });

        this.appConfig = buildConfig.app || {};
    }

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    _setModuleInfo(nameOrPath) {
        const moduleFn = utils.safeRequire(nameOrPath);
        if (!moduleFn) return undefined;

        const modulePath = require.resolve(nameOrPath);
        const dirname = path.dirname(modulePath);
        const pkgPath = path.join(dirname, 'package.json');
        const pkg = utils.safeRequire(pkgPath);
        if (!pkg) {
            throw new Error(`Template package.json is not found at ${pkgPath}`);
        }

        this.module = {
            fn: moduleFn,
            path: modulePath,
            dirname,
            templateDir: path.join(dirname, 'template'),
            pkgPath,
            pkg
        };
    }

    initTemplateModule(nameOrPath) {
        if (['default', 'zebra', 'docma-template-zebra'].indexOf(nameOrPath) >= 0) {
            // first check if we have a globally installed version
            this._setModuleInfo('docma-template-zebra');
            // no? then use bundled version
            if (!this.module) {
                // no need for safeRequire() for the bundled
                this._setModuleInfo(path.join(__dirname, '..', 'templates', 'zebra'));
            }

            // if given name or path does not include a sep (/ or \), we'll
            // check if we have a built-in template with that name under
            // `/templates` directory.
        } else if (nameOrPath.indexOf('/') < 0 && nameOrPath.indexOf('\\') < 0) {
            if (/^docma-template-/.test(nameOrPath) === false) {
                this._setModuleInfo(`docma-template-${nameOrPath}`);
                if (!this.module) this._setModuleInfo(nameOrPath);
            } else {
                this._setModuleInfo(nameOrPath);
            }
            if (!this.module) this._setModuleInfo(path.resolve(nameOrPath));
        } else {
            this._setModuleInfo(path.resolve(nameOrPath));
        }

        if (!this.module) {
            throw new Error(`Could not load Docma template module: ${nameOrPath}`);
        }

        // passing buildConfig, modules and utilites to be used within template
        // main module.
        this.module.instance = this.module.fn(this.buildConfig, {
            _,
            Promise,
            fs,
            dust,
            HtmlParser,
            Paths,
            utils,
            log: this.$debug.data
        });
    }

    /**
     *  Checks whether the template is compatible with the current Docma
     *  version. Compatible version (range) is defined in `docma.template.json`.
     *
     *  @returns {Boolean}
     */
    checkVersion() {
        return semver.satisfies(docmaPkg.version, this.config.docmaVersion);
    }

    /**
     *  Gets template data that will be passed to the document via
     *  `docma.template`.
     *
     *  @returns {Object}
     */
    getData() {
        const data = _.pick(this.config, [
            'name', 'description', 'version', 'docmaVersion', 'author', 'license', 'mainHTML', 'options'
        ]);
        data.options = data.options || {};
        return data;
    }

    /**
     *  Compiles and writes `.js` files defined in `docma.json` configuration
     *  file. Note that if debug.noMinify is enabled, files are not minifed.
     *
     *  @returns {Promise}
     */
    compileScripts() {
        this.$debug.info('Compiling SPA scripts...');

        const minifyConf = _filterByExtension(this.config.compile, '.js');
        const jsFilePaths = _.keys(minifyConf);

        if (!jsFilePaths.length) return Promise.resolve();

        return Promise.each(jsFilePaths, jsFilePath => {
            const targetJs = path.join(this.dest, minifyConf[jsFilePath]);

            this.$debug.data('Compiling:', jsFilePath);
            jsFilePath = path.join(this.module.templateDir, jsFilePath);

            return fs.pathExists(jsFilePath)
                .then(exists => {
                    if (!exists) {
                        this.$debug.warn('Missing script:', jsFilePath);
                        return;
                    }
                    if (this.$debug.noMinify) {
                        return fs.readFile(jsFilePath, 'utf8');
                    }
                    return utils.js.minifyFile(jsFilePath)
                        .then(minified => minified.code);
                })
                .then(code => {
                    if (!code) {
                        this.$debug.warn('No script content:', jsFilePath);
                        return;
                    }
                    // creates parent directories if they don't exist
                    return fs.outputFile(targetJs, code, 'utf8');
                });
        });
    }

    /**
     *  Conpiles docma.less file that contains necessary styles for specific
     *  features such as emojis used in markdown files.
     *
     *  @returns {Promise}
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
     *  Compiles `.less` files defined in `docma.json` configuration file.
     *
     *  @returns {Promise}
     */
    compileStyles() {
        this.$debug.info('Compiling SPA styles...');

        const lessConf = _filterByExtension(this.config.compile, '.less');
        const lessFilePaths = Object.keys(lessConf);

        if (!lessFilePaths.length) return Promise.resolve();

        return Promise.each(lessFilePaths, filePath => {
            const targetCss = path.join(this.dest, lessConf[filePath]);
            filePath = path.join(this.module.templateDir, filePath);
            const compileOpts = utils.less.updateOptions({
                compress: !this.$debug.noMinify
            }, filePath);
            return fs.pathExists(filePath)
                .then(exists => {
                    if (!exists) {
                        this.$debug.warn('Missing Less File:', filePath);
                        return null;
                    }
                    return fs.readFile(filePath, 'utf8')
                        .then(content => {
                            return this.preCompile(content, filePath, targetCss);
                        })
                        .then(modifiedContent => {
                            this.$debug.data('Compiling:', path.relative(this.module.dirname, filePath));
                            return utils.less.compile(modifiedContent, compileOpts);
                        });
                })
                .then(compiled => {
                    if (!compiled) return;
                    return this.postCompile(compiled.css, filePath, targetCss);
                })
                .then(modifiedContent => {
                    // creates parent directories if they don't exist
                    return fs.outputFile(targetCss, modifiedContent, 'utf8');
                })
                .then(() => {
                    return this.compileDocmaStyles();
                });
        });
    }

    /**
     *  Compiles template partials into Dust.js templates.
     *
     *  @returns {String} - Compiled javascript source of partials.
     */
    compilePartials() {
        this.$debug.info('Compiling SPA partials...');

        // glob uses forward slash only. (in Windows too)
        const partials = utils.glob.normalize(this.module.templateDir, 'partials/**/*.html');
        return utils.glob.match(partials)
            .then(files => {
                // Dust-compile all partials
                return Promise.map(files, filePath => {
                    this.$debug.data('Compiling:', path.relative(this.module.dirname, filePath));
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
                const contentPartialPath = path.join(this.module.templateDir, 'partials', `${CONTENT_PARTIAL}.html`);
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
     *  @returns {Promise}
     */
    copyToDest() {
        this.$debug.info('Copying template files/directories...');

        const templateDir = this.module.templateDir;

        // do not copy the main file (which will be parsed then created at the
        // destination) and partials (which will be compiled into javascript).
        let ignoreList = this.config.ignore || [];
        ignoreList = ignoreList.concat([
            this.config.mainHTML,
            'docma.template.json',
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
                    this.$debug.data('Copying:', path.relative(this.module.dirname, filePath));
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
     *  @param {String} [pathNames]
     *         Only used if `appConfig.server` is set to `"github"`.
     *
     *  @returns {Promise}
     */
    writeServerConfig(routes) {
        this.$debug.info('Evaluating server/host configuration for the SPA...');

        // This is only for "path" routing. For "query" routing, we don't need
        // to redirect paths to main index file, since query-string routing is
        // already done on the main page.
        if (this.appConfig.routing.method !== 'path') {
            return Promise.resolve();
        }

        const base = utils.ensureEndSlash(this.appConfig.base, '/');

        if (this.appConfig.server === 'apache') {
            // If Apache; we'll write an .htaccess file basically for
            // redirecting content paths to the main page, since we're
            // generating a SPA.
            const destHtaccess = path.join(this.dest, '.htaccess');
            this.$debug.info('Generating Apache config file (.htaccess):', destHtaccess);

            const main = this.config.mainHTML;
            const mainEsc = _escapeRegExp(this.config.mainHTML);

            return fs.readFile(Paths.APACHE_CONF, 'utf8')
                .then(content => {
                    // replace main file and base path placeholders.
                    content = content
                        .replace(/%{DOCMA_MAIN}/g, main)
                        .replace(/%{DOCMA_MAIN_ESC}/g, mainEsc)
                        .replace(/%{DOCMA_BASE}/g, base);
                    return fs.writeFile(destHtaccess, content, 'utf8');
                });
        }

        if (this.appConfig.server === 'github' || this.appConfig.server === 'static') {
            // GitHub does not support .htaccess or .conf files since it doesn't
            // use Apache or Nginx. So we'll do the same thing as Jekyll
            // (redirect-from) by creating directories and index files for
            // redirecting with http-meta refresh. See
            // https://github.com/jekyll/jekyll-redirect-from

            if (!routes || routes.length === 0) {
                return Promise.resolve();
            }

            this.$debug.info('Generating indexed directories for GitHub...');

            // read the redirect.html template file into memory.
            return fs.readFile(Paths.REDIRECT_HTML, 'utf8')
                .then(html => {
                    return Promise.each(routes, route => {
                        let p = [this.dest];
                        const routeParts = route.path.split('/');
                        // for /api path backToBase will be '../'
                        // for /api/name path backToBase will be '../../'
                        const backToBase = new Array(routeParts.length).join('../');
                        // e.g. /guide or /api/docma-web
                        p = p.concat(routeParts);
                        p.push('index.html');
                        const reIndexFile = path.join(...p),
                            // replace the redirect content path placeholder
                            // (to be set in sessionStorage) so we can render it
                            // after redirected to the main page.
                            reHtml = html
                                .replace(/%\{BACK_TO_BASE\}/g, backToBase)
                                .replace(/%\{REDIRECT_PATH\}/g, utils.path.ensureLeadSlash(route.path));
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
     *
     *  @returns {Promise}
     */
    writeMainHTML() {
        const srcMainFile = path.join(this.module.templateDir, this.config.mainHTML);
        const destMainFile = path.join(this.dest, this.config.mainHTML);

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
                            content: 'Docma - https://github.com/onury/docma'
                        };
                        const metas = (this.appConfig.meta || []).concat([docmaMeta]);
                        _addMetasToDoc($, metas);

                        // DON'T set base or bookmarks won't work
                        if (this.appConfig.base) {
                            head.prepend(`<base href="${this.appConfig.base}" />`);
                        }

                        // Set title
                        const title = DOM.N_TAB + '<title>' + this.appConfig.title + '</title>' + DOM.N_TAB; // eslint-disable-line
                        head.find('title').remove().end() // .remove('title') doesn't work
                            .prepend(title);

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
     *  @param {*} [defaultResolveValue=true] - If this template process method
     *  (represented by `fn`) is omitted in the process module, this default
     *  resolve value will be used.
     *  @param {Function} [log] - Log function to be used.
     *
     *  @returns {Promise}
     */
    _promiseTemplateProcess(fn, args = [], options = {}) {
        const opts = _.defaults(options, {
            // `'undefined'` means, promise can resolve with any value or can be
            // omitted.
            resolveType: 'undefined',
            defaultResolveValue: undefined,
            log: null
        });

        if (!this.module || !this.module.instance || typeof this.module.instance[fn] !== 'function') {
            return Promise.resolve(opts.defaultResolveValue);
        }

        if (typeof opts.log === 'function') opts.log();
        // ensure promise
        return Promise.resolve(this.module.instance[fn](...args))
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
        return this._promiseTemplateProcess('preBuild', [], {
            log: () => {
                this.$debug.info(`Running template pre-build process...`);
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
        return this._promiseTemplateProcess('postBuild', [], {
            log: () => {
                this.$debug.info(`Running template post-build process...`);
            }
        });
    }

    /**
     *  Pre-process to be run before each source in `compile` option of the
     *  template is compiled. This represents the optional `preCompile()` method
     *  of the template processor object, exported from the main module of the
     *  template.
     *
     *  @returns {Promise} — Always returns a promise.
     */
    preCompile(rawContent, src, dest) {
        return this._promiseTemplateProcess(
            'preCompile',
            [rawContent, src, dest],
            {
                resolveType: 'string',
                defaultResolveValue: rawContent,
                log: () => {
                    this.$debug.data(`Running pre-compile process for ${path.relative(this.module.dirname, src)}`);
                }
            }
        );
    }

    /**
     *  Pre-process to be run before each source in `compile` option of the
     *  template is compiled. This represents the optional `postCompile()`
     *  method of the template processor object, exported from the main
     *  module of the template.
     *
     *  @returns {Promise} — Always returns a promise.
     */
    postCompile(compiledContent, src, dest) {
        return this._promiseTemplateProcess(
            'postCompile',
            [compiledContent, src, dest],
            {
                resolveType: 'string',
                defaultResolveValue: compiledContent,
                log: () => {
                    this.$debug.data(`Running post-compile process for ${path.relative(this.module.dirname, src)}`);
                }
            }
        );
    }

}

module.exports = DocmaTemplate;
