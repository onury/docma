/* eslint no-nested-ternary:0 */

'use strict';

// core modules
const path = require('path');

// dep modules
const _ = require('lodash');
const Promise = require('bluebird');
const jsdocx = require('jsdoc-x');
const marked = require('marked');
const fs = require('fs-extra');
const semver = require('semver');

// own modules
const TemplateBuilder = require('./TemplateBuilder');
const TemplateDoctor = require('./TemplateDoctor');
const HtmlParser = require('./HtmlParser');
const Paths = require('./Paths');
const utils = require('./utils');
const Debug = require('./Debug');
const pkg = require('../package.json');

// constants
const DEFAULT_JS_GROUP = '_def_';
const JSDOC_OUT_SUFFIX = 'jsdoc.json';
const TWEMOJI_BASE_URL = 'https://twemoji.maxcdn.com/svg/';
const RE_INVALID_GROUP_CHARS = /[#~&^`'"]/;
// cannot be "api" or start with "api/"
const RE_INVALID_GROUP_NAME = /^api(\/|$)/;

// --------------------------------
// CLASS: Docma
// --------------------------------

/**
 *  Docma (builder) class for generating HTML documentation from the given
 *  Javascript and/or markdown source files. This is the default object exported
 *  from the `docma` Node module.
 *
 *  <blockquote>This documentation you're reading is built with Docma.</blockquote>
 *  @class
 *
 *  @example
 *  const Docma = require('docma');
 */
class Docma {

    /**
     *  Initializes a new instance of `Docma`.
     *  @example
     *  const docma = new Docma();
     */
    constructor() { } // eslint-disable-line

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    /**
     *  Configures the Docma instance with the given build configuration.
     *  @private
     *
     *  @param {Object} config - Build configuration.
     */
    _init(config) {
        // documentation data
        this.apisData = {}; // will have a key for each group of documented js files.
        if (!config.src) {
            throw new Error('Source path(s) is not defined or invalid.');
        }
        config.src = utils.ensureArray(config.src);

        if (!config.dest) {
            throw new Error('Destination directory is not set.');
        }

        this.config = _.defaultsDeep(config, {
            debug: Debug.DISABLED,
            clean: false,
            app: {
                title: '',
                meta: null,
                base: '/',
                entrance: 'api',
                routing: {
                    method: 'query',
                    caseSensitive: true
                },
                server: 'static',
                favicon: ''
            },
            template: {
                path: 'default',
                options: {}
            },
            jsdoc: {
                encoding: 'utf8',
                recurse: false,
                pedantic: false,
                access: null, // ['private'],
                package: null,
                module: true,
                undocumented: false,
                undescribed: false,
                ignored: false,
                hierarchy: true,
                sort: 'alphabetic',
                // relativePath: path.join(__dirname, '/code'),
                filter: null,
                allowUnknownTags: true,
                dictionaries: ['jsdoc', 'closure'],
                includePattern: '.+\\.js(doc|x)?$',
                excludePattern: '(^|\\/|\\\\)_',
                plugins: []
            },
            markdown: {
                gfm: true,
                tables: true,
                breaks: false,
                pedantic: false,
                sanitize: true,
                smartLists: true,
                smartypants: false,
                xhtml: false,
                tasks: true,
                emoji: true,
                langPrefix: ''
            }
        });

        // routing config accepts both `String` or `Object`
        let routing = this.config.app.routing;
        if (_.isString(routing)) routing = { method: routing };
        if (!_.isBoolean(routing.caseSensitive)) routing.caseSensitive = true;
        this.config.app.routing = routing;

        if (this.config.app.base) {
            this.config.app.base = utils.path.ensureEndSlash(this.config.app.base);
        }

        // debug option accepts both boolean and numeric (bitwise) values.
        this.$debug = new Debug(this.config.debug);
        // set the normalized value back
        this.config.debug = this.$debug.level;

        this.templateBuilder = new TemplateBuilder(this.config);

        // storage for content path names. Used to create directories for
        // generated HTML index files, if routing method is "path" and server is
        // "github".
        this.routes = []; // see ._addRoute()

        // storage for some useful build-statistics...
        this.stats = {
            // docma-web.js
            scriptSize: 0,
            scriptSizeGZipped: 0,
            // routes
            apiRouteCount: 0,
            contentRouteCount: 0
        };
    }

    /**
     *  Adds a new route information object to existing routes.
     *  These objects define the type and route path for the related content.
     *  @private
     *
     *  @param {String} name
     *         Name of the content.
     *  @param {String} [sourceType="js"]
     *         Type of the source. Possible values: `"js"`, `"md"`, `"html".
     */
    _addRoute(name, sourceType) {
        if (!this.config.app.routing.caseSensitive) name = name.toLowerCase();
        // trim and remove leading & trailing slashes if any.
        name = name.trim().replace(/(^\/|\/$)/g, '');

        const isApiRoute = sourceType === 'js';
        const type = isApiRoute ? 'api' : 'content';
        const queryRouting = this.config.app.routing.method === 'query';
        const rName = isApiRoute
            ? (name === DEFAULT_JS_GROUP ? '' : name)
            : name;

        if (RE_INVALID_GROUP_NAME.test(name)) {
            throw new Error('Route/path name "api" is a reserved word. Any ungrouped JS files will already be merged under "api" default route.');
        }

        if (RE_INVALID_GROUP_CHARS.test(name)) {
            throw new Error(`'${name}' has some invalid characters for valid Docma path name.`);
        }

        const isApache = this.config.app.server === Docma.ServerType.APACHE;
        // we only create directories when server is NOT Apache and routing
        // method is "path". if so, we'll check path names for safety.
        if (!queryRouting && !isApache) {
            const isWin = this.config.app.server === Docma.ServerType.WINDOWS;
            if (!utils.path.hasValidName(name, isWin)) {
                throw new Error(`'${name}' is not a valid path name for the configured server type '${this.config.app.server}'.`);
            }
        }

        if (_.find(this.routes, { type, name })) {
            throw new Error(`Cannot have duplicate route name '${name}' with the same route type '${type}'.`);
        }

        if (isApiRoute) {
            this.stats.apiRouteCount += 1;
        } else {
            this.stats.contentRouteCount += 1;
        }

        let routePath;
        if (queryRouting) {
            routePath = '?' + type + (rName ? '=' + rName : '');
        } else {
            const parts = [];
            if (isApiRoute) parts.push('api');
            if (rName) parts.push(rName);
            routePath = parts.join('/') + '/';
        }

        this.routes.push({
            id: `${type}:${rName}`,
            type,
            name,
            path: routePath,
            // if this is not api route, generated HTML content is placed in the
            // content directory.
            contentPath: !isApiRoute
                ? `content/${name}.html`
                : null,
            sourceType
        });
    }

    /**
     *  Compiles Docma Web Core object and writes `docma-web.js` file which is
     *  the core engine of the generated SPA. This object also includes Dustjs
     *  engine, partials, other components such as `page.js` and
     *  `EventEmitter` and parsed documentation data.
     *  @private
     *
     *  @see {@link api/web|Docma Web API}
     *
     *  @returns {Promise} -
     */
    _compileWebCore() {
        const jsDest = path.join(this.config.dest, 'js');

        this.$debug.info('Compiling Docma (Web) Core...');

        const comp = [];
        let docmaWeb = [];

        return fs.ensureDir(jsDest)
            .then(() => {
                return Promise.each(Paths.DOCMA_COMPS, file => {
                    this.$debug.data('Compiling:', path.relative(Paths.DIR_WEB, file));
                    return utils.js.readFile(file, this.$debug.noMinify, true)
                        .then(code => {
                            return comp.push(code);
                        });
                });
            })
            // dust-compile partial html files
            .then(() => this.templateBuilder.compilePartials())
            .then(dustTemplates => {
                // add dust templates
                comp.push(dustTemplates);

                // create a data object to be passed to the DocmaWeb
                // constructor.
                const docmaData = {
                    version: pkg.version,
                    // pass routes information to document.
                    routes: this.routes,
                    // pass api documentation(s) and symbol list(s) to document.
                    apis: this.apisData,
                    // pass SPA app config
                    app: this.config.app || {},
                    // pass template data to document. template name, title,
                    // options, etc...
                    template: this.templateBuilder.getData() || {},
                    // storage for private fields
                    partials: {
                        // Name of the api partial (Dust template). JSDoc
                        // generated content is rendered with this partial.
                        api: 'docma-api',
                        // Name of content partial  (Dust template) This is
                        // for misc content; (such as markdown files
                        // converted to HTML), within the `/content`
                        // directory of the output. This is also the id of
                        // the target element within the partial.
                        content: 'docma-content',
                        // Partial for 404 errors
                        notFound: 'docma-404'
                    },
                    // Docma DOM element ID in the main file.
                    elementID: 'docma-main',
                    // ID of the target element within the content partial.
                    contentElementID: 'docma-content',
                    defaultApiName: DEFAULT_JS_GROUP,
                    // enable logs for web core
                    logsEnabled: this.$debug.webLogs
                };

                // read & minify docma-web files
                return Promise.resolve()
                    .then(() => {
                        return Promise.each(Paths.DOCMA_WEB_CORE, file => {
                            return utils.js.readFile(file, this.$debug.noMinify, false)
                                .then(code => {
                                    docmaWeb.push(code);
                                    return docmaWeb;
                                });
                        });
                    })
                    .then(() => {
                        // join docma-web core scripts
                        const code = docmaWeb.join('\n\n');
                        // reset and add docma license at the top
                        docmaWeb = ['/*!\n * Docma (Web) Core\n * https://github.com/onury/docma\n * @license MIT\n */'];
                        // wrap in IIFE
                        docmaWeb.push('var DocmaWeb = (function () {\n\'use strict\';\n');
                        docmaWeb.push(`${code}\n`);
                        docmaWeb.push(`DocmaWeb.version = "${pkg.version}";`);
                        docmaWeb.push('return DocmaWeb;\n})();');
                        docmaWeb.push(`var docma = Object.freeze(new DocmaWeb(${JSON.stringify(docmaData)}));\n`);
                    })
                    // DocmaWeb-SPA.js should be the last
                    .then(() => utils.js.readFile(Paths.DOCMA_WEB_SPA, this.$debug.noMinify, false))
                    .then(code => {
                        docmaWeb.push(code);
                        return docmaWeb;
                    });
            })
            .then(() => {
                this.$debug.info('Writing docma-web.js...');
                // add components code before docma.
                docmaWeb = comp.concat(docmaWeb);
                const d = path.join(jsDest, 'docma-web.js');
                const script = docmaWeb.join('\n');
                this.stats.scriptSize = utils.getContentSize(script);
                this.stats.scriptSizeGZipped = utils.getContentSize(script, true);
                return fs.writeFile(d, script, 'utf8');
            })
            .then(() => {
                this.$debug.data('Done.');
            });
    }

    _getParserType(str) {
        return /^\.?(javascript|jsdoc|jsx?)$/i.test(str) ? 'JSDoc'
            : /^\.?(md|markdown)?$/i.test(str) ? 'Markdown'
                : /^\.?html?$/i.test(str) ? 'HTML'
                    : null;
    }

    /**
     *  Get an object that defines parse info, from the given source path.
     *  @private
     *  @param {String} src - Source path.
     *
     *  @returns {Object} - Parse information.
     */
    _getParseInfo(src) {
        // check for :ext suffix to force specific parser
        // e.g. "LICENSE:md" will be force-parsed to markdown
        // e.g. "file.ext:html" will be force-parsed to html
        // e.g. "normal/path/file.md"
        // this could also be "glob/paths/**/*.ext"
        const m = src.match(/(.*):([a-z]+)$/i);
        const forced = Boolean(m && m.length >= 2);
        const srcPath = forced ? m[1] : src;
        const ext = path.extname(src).toLowerCase();
        const parserType = this._getParserType(forced ? m[2] : ext);
        return {
            forced,
            srcPath,
            ext,
            parserType
        };
    }

    /**
     *  Processes source files of the documentation to be built; and determines
     *  how they should be parsed.
     *  @private
     *
     *  @returns {Promise} - Promise that returns grouped files.
     */
    _processFiles() {
        const files = {
            js: {},
            md: {},
            html: {}
        };
        // default for unnamed group of js files
        files.js[DEFAULT_JS_GROUP] = [];

        this.$debug.info('Expanding source files...');

        const $this = this;

        // expands the glob src then picks each file by it's extension. Markdown
        // files are directly moved to files.md:Array. JS files, if no jsGroup
        // is defined; are moved into files.js._def_:Array. If jsGroup is
        // defined, they will be moved into a new group
        // files.js[groupName]:Array. Duplicate .js or .md files are ingnored.
        function pick(memo, src, name) {
            const into = name ? `into "${name}"` : '';
            $this.$debug.info('Expanding:', src, into);
            const patt = typeof $this.config.jsdoc.includePattern === 'string'
                ? new RegExp($this.config.jsdoc.includePattern)
                : null;

            let pinfo;
            if (typeof src === 'string') pinfo = $this._getParseInfo(src);
            const srcPath = pinfo ? pinfo.srcPath : src;

            return utils.glob.match(srcPath)
                .then(srcFiles => {
                    _.each(srcFiles, filePath => {
                        // if no parser info, it means parent definition was not
                        // a string/path. glob.match will not return suffixed
                        // results but single item (string) can passthrough here.
                        if (!pinfo) {
                            pinfo = $this._getParseInfo(filePath);
                            filePath = path.resolve(pinfo.srcPath);
                        } else {
                            filePath = path.resolve(filePath);
                        }

                        if (pinfo.forced && pinfo.parserType) {
                            $this.$debug.warn(` » ${pinfo.parserType} parser will be forced on: "${filePath}"`);
                        }

                        const jsdocInclude = patt ? patt.test(filePath) : false;

                        if (jsdocInclude || pinfo.parserType === 'JSDoc') {
                            const jsGroupName = name || DEFAULT_JS_GROUP; // default js file group name
                            // set js-group if it doesn't exist
                            const grp = memo.js[jsGroupName] = memo.js[jsGroupName] || []; // eslint-disable-line
                            if (grp.indexOf(filePath) === -1) {
                                $this.$debug.data('Queued:', filePath);
                                grp.push(filePath);
                            } else {
                                $this.$debug.warn(' » Duplicate ignored:', filePath);
                            }
                        } else if (pinfo.parserType === 'Markdown') {
                            const mdName = (name || utils.path.basename(filePath)).toLowerCase();
                            if (!memo.md.hasOwnProperty(mdName)) {
                                $this.$debug.data('Queued:', filePath);
                                memo.md[mdName] = filePath;
                            } else {
                                $this.$debug.warn(' » Duplicate ignored:', filePath);
                            }
                        } else if (pinfo.parserType === 'HTML') {
                            const htmlName = (name || utils.path.basename(filePath)).toLowerCase();
                            if (!memo.html.hasOwnProperty(htmlName)) {
                                $this.$debug.data('Queued:', filePath);
                                memo.html[htmlName] = filePath;
                            } else {
                                $this.$debug.warn(' » Duplicate ignored:', filePath);
                            }
                        } else {
                            $this.$debug.warn(' » Unsupported source ignored:', filePath);
                        }
                    });
                    return memo;
                });
        }

        // $this.config.src is ensured to be an array, in the constructor
        return Promise.reduce(this.config.src, (memo, src) => {
            // if this item is a string, this means it's a .js file with no
            // group name defined or an .md/.html file.
            if (typeof src === 'string') return pick(memo, src);

            // if this item is an object, it's a named-group of .js files.
            if (_.isPlainObject(src)) {
                return Promise
                    .each(_.keys(src), key => pick(memo, src[key], key))
                    .thenReturn(memo);
            }
            return memo;

        }, files).then(files => {
            this.files = files; // e.g. { js: { groupName: [..] }, md: { name: ".." } }
            return files;
        });
    }

    /**
     *  Parses the JSDoc documentation within the given JS files.
     *  @private
     *
     *  @param {Array} jsFiles
     *         Array of JS file paths.
     *  @param {String} [filePrefix]
     *         File name prefix for the JSON output.
     *
     *  @returns {Promise} - Promise that returns JSDoc data.
     */
    _parseJS(jsFiles, filePrefix) {
        jsFiles = utils.ensureArray(jsFiles);
        if (!jsFiles || jsFiles.length === 0) {
            return Promise.resolve([]);
        }

        const jdxOpts = _.extend({
            files: jsFiles
        }, this.config.jsdoc);

        // output json files if debugging
        if (this.$debug.jsdocOutput) {
            let filename = (filePrefix && filePrefix !== DEFAULT_JS_GROUP) ? filePrefix + '.' : ''; // eslint-disable-line
            filename = filename.replace(/\//g, '_') // some route names might have / (deep path name)
                + JSDOC_OUT_SUFFIX;
            jdxOpts.output = {
                path: path.join(this.config.dest, filename),
                indent: 2,
                force: false
            };
        }

        const isQuery = this.config.app.routing.method === 'query';

        // compile original predicate/filter into a function
        let originalPredicate = jdxOpts.predicate || jdxOpts.filter;
        if (_.isString(originalPredicate)) {
            const re = new RegExp(String(originalPredicate));
            originalPredicate = symbol => re.test(symbol.longname);
        } else if (!_.isFunction(originalPredicate)) {
            originalPredicate = _.identity;
        }

        function predicate(symbol) {
            // first filter by the original predicate
            const sym = originalPredicate(symbol);
            // exclude if falsy
            if (!sym) return false;
            // update symbol if a (symbol) object is returned
            if (typeof sym !== 'boolean') symbol = sym;

            // add docma links to each symbol and member
            // consider `_def_` which is the default name for unnamed JS group.
            // ?api=_def_ is better represented as ?api
            const apiName = filePrefix === '_def_' ? '' : filePrefix;
            if (isQuery) {
                const aName = !apiName ? '' : `=${apiName}`;
                symbol.$docmaLink = `?api${aName}`;
            } else {
                const aName = !apiName ? '' : `${apiName}/`;
                symbol.$docmaLink = `api/${aName}`;
                // if routing = path, no leading slash, or won't work with
                // relative links with app.base
            }
            symbol.$docmaLink += `#${symbol.$longname}`;

            // also set a $hide property. this is used if jsdoc hideconstructor
            // = true and the symbol is actually a constructor.

            if (symbol.$kind === 'constructor' && symbol.hideconstructor) {
                symbol.$hide = true;
            }

            return symbol;
        }

        jdxOpts.predicate = predicate;
        return jsdocx.parse(jdxOpts);
    }

    _getFilesHashMap(files) {
        if (typeof files === 'string') files = [files];

        if (_.isArray(files)) {
            const oFiles = {};
            if (files.length === 0) return Promise.resolve();
            files.forEach(file => {
                const n = utils.path.basename(file).toLowerCase();
                if (!oFiles.hasOwnProperty(n)) oFiles[n] = file;
            });
            return oFiles;
        }
        if (_.isPlainObject(files)) return files;
        return null;
    }

    /**
     *  Parses given list of markdown files and generates HTML files from each.
     *  @private
     *
     *  @param {String|Array|Object} mdFiles
     *         One or more markdown file paths. If an object is passed, each
     *         generated HTML file will be named by the key (lower-cased).
     *         Otherwise, the basename of the original markdown file,
     *         (lower-cased) without the extension will be name of the file.
     *         e.g. `README.md` is named `readme.html`.
     *
     *  @returns {Promise} -
     */
    _parseMD(mdFiles) {
        if (!mdFiles) return Promise.resolve();
        const oFiles = this._getFilesHashMap(mdFiles);
        if (!oFiles) {
            return Promise.reject(new Error('Invalid markdown file(s) passed.'));
        }

        const markedOpts = _.extend({}, this.config.markdown, {
            renderer: new marked.Renderer()
        });
        // marked.setOptions(markedOpts);

        const fileNames = _.keys(oFiles);

        this.$debug.info(`Parsing ${fileNames.length} Markdown file(s)...`);

        return Promise.each(fileNames, name => {
            const file = oFiles[name];
            this.$debug.data(`Parsing (${name}):`, file);

            return fs.readFile(file, 'utf8')
                .then(mdString => utils.md.parse(mdString, markedOpts))
                .then(html => {
                    // some extra markdown flavor by Docma
                    const parser = HtmlParser.create(html);
                    const mdTasks = this.config.markdown.tasks;
                    if (mdTasks) parser.parseMarkdownTasks('docma task-item');

                    return parser.edit((window, $) => {
                        if (mdTasks) {
                            $('.docma.task-item')
                                .parents('ul')
                                .addClass('docma task-list');
                        }

                        $('.docma-hide, .docma-ignore').hide();
                        $('.docma-remove').remove();

                        // wrap and add class for collapsable details element's
                        // content right after the summary tag.
                        $('details > summary').each(function () {
                            $(this).nextAll().wrapAll('<div class="details-content" />');
                        });

                        // limit image width to 100% while keeping
                        // aspect ratio
                        $('img').css('max-width', '100%');

                        // marked already sets the id for headings (h1,h2..) but
                        // it doesn't ignore/remove other HTML tags (i.e.
                        // <a></a>) from the generated id.
                        $(':header').each(function () { // no arrow func here
                            const bmHeading = $(this);
                            const bmId = bmHeading.attr('id');
                            if (bmId) {
                                // re-set the heading id
                                bmHeading.attr('id', utils.idify(bmHeading.text()));
                            }
                        });

                    }).then(parser => parser.content);
                })
                .then(html => {
                    html = html || '';
                    // additional GFM: add horiziontal line right after each
                    // <h1/> and <h2/>, just like GitHub.
                    if (this.config.markdown.gfm) {
                        html = html.replace(/(<\/h[12]>)/g, '$1\n<hr />');
                    }
                    // if emoji enabled, find and replace :emoji_code: with <img src=svg />
                    if (this.config.markdown.emoji) {
                        const re = /:([^:\s]+):/g;
                        return utils.json.read(Paths.EMOJI_JSON)
                            .then(emojiMap => {
                                return html.replace(re, (match, p1) => { // , offset, string
                                    const code = emojiMap[p1];
                                    return code
                                        ? `<img class="docma emoji" src="${TWEMOJI_BASE_URL + code}.svg" />`
                                        : match;
                                });
                            });
                    }
                })
                .then(html => {
                    const outPath = path.join(this.config.dest, 'content', `${name}.html`);
                    this._addRoute(name, 'md');
                    // creates parent directories if they don't exist
                    return fs.outputFile(outPath, html, 'utf8');
                });
        });

    }

    _processHTML(htmlFiles) {
        if (!htmlFiles) return Promise.resolve();
        const oFiles = this._getFilesHashMap(htmlFiles);
        if (!oFiles) {
            return Promise.reject(new Error('Invalid HTML file(s) passed.'));
        }

        const fileNames = _.keys(oFiles);

        this.$debug.info('Processing', fileNames.length, 'HTML file(s)...');

        return Promise.each(fileNames, name => {
            const file = oFiles[name];
            this.$debug.data(`Processing (${name}):`, file);

            return fs.readFile(file, 'utf8')
                .then(html => {
                    const outPath = path.join(this.config.dest, 'content', `${name}.html`);
                    this._addRoute(name, 'html');
                    // creates parent directories if they don't exist
                    return fs.outputFile(outPath, html, 'utf8');
                });
        });
    }

    /**
     *  Copy assets to build directory. This does not compile or parse any of
     *  the files. Files/directories are simply copied over to the build
     *  directory.
     *  @private
     *
     *  @returns {Promise} -
     */
    _copyAssets() {
        const assets = this.config.assets || {};
        const favicon = this.config.app.favicon;
        if (favicon) {
            assets['/'] = utils.ensureArray(assets['/'] || []);
            assets['/'].push(favicon);
        }

        const targetDirs = Object.keys(assets);
        if (targetDirs.length === 0) {
            this.$debug.info('No assets to be copied over...');
            return Promise.resolve();
        }

        this.$debug.info('Copying assets...');

        let copyList, dest, fPath, basename;
        return Promise.each(targetDirs, dir => {
            copyList = utils.ensureArray(assets[dir]);
            return utils.glob.match(copyList)
                .then(files => {
                    return Promise.each(files, filePath => {
                        fPath = path.resolve(filePath);
                        basename = path.basename(filePath);
                        dest = path.join(this.config.dest, dir, basename);
                        this.$debug.data('Copying:', fPath, '\n\tto:', path.resolve(dest));
                        return fs.copy(fPath, dest);
                    });
                });
        });
    }

    /**
     *  Parses the given source files and builds a Single Page Application (SPA)
     *  with the given Docma template.
     *
     *  For a verbose build, `debug` option should be {@link #Docma.Debug|enabled}.
     *
     *  @param {Object|String} config
     *         Either a build configuration object or the file path of a
     *         configuration JSON file.
     *         See {@link #Docma~BuildConfiguration|`BuildConfiguration`} for details.
     *
     *  @returns {Promise<Boolean>}
     *           Promise that resolves to a `Boolean` value for whether the build
     *           operation is successful. This will always return `true` if
     *           no errors occur. You should `.catch()` the errors of the
     *           promise chain.
     *
     *  @example
     *  const docma = new Docma();
     *  docma.build(config)
     *  	.then(success => {
     *  		console.log('Documentation is built successfully.');
     *  	})
     *  	.catch(error => {
     *  		console.log(error.stack);
     *  	});
     */
    build(config) {
        return Promise.resolve()
            .then(() => {
                if (_.isPlainObject(config)) return config;
                return utils.json.read(config);
            })
            .then(conf => {
                this._init(conf);
                this.$debug.title('Building documentation...');
                this.$debug.log('Docma Version: ', pkg.version);
                this.$debug.log('Using Template:', this.templateBuilder.template.name, `(version: ${this.templateBuilder.template.version})`);
                if (semver.lt(this.templateBuilder.template.version, '1.0.0')) {
                    this.$debug.warn('Note that this template may not be production-ready since it has a version less than 1.0.0');
                }
                // console.log(this.config);
                if (!this.templateBuilder.checkVersion()) {
                    const vmsg = `Template requires Docma version ${this.templateBuilder.template.supportedDocmaVersion}`;
                    this.$debug.warn(`${vmsg}\n`);
                    throw new Error(`Incompatible Docma template. ${vmsg}`);
                } else {
                    console.log('');
                }

                return fs.ensureDir(this.config.dest);
            })
            .then(() => {
                // fix #34
                if (this.config.clean) {
                    return fs.emptyDir(this.config.dest);
                }
            })
            .then(() => this.templateBuilder.preBuild())
            .then(() => this._processFiles())
            .then(() => {
                // JS files are picked into self.files.js object. Each property
                // is a group of JS files. Each key is the name of that group.
                // Now, we'll jsdoc-parse each group of js fils and form the an
                // object with the following signature for each:
                // { documentation:Array, symbols:Array }
                // final apisData will be { group1:Object, group2:Object, ... }
                const jsFileGroups = this.files.js || {};
                const groupNames = _.keys(jsFileGroups);

                if (groupNames.length === 0) return Promise.resolve({});

                if (this.$debug.buildLogs) {
                    const numJsFiles = _.reduce(jsFileGroups, (sum, item) => sum + item.length, 0);
                    this.$debug.info('Parsing', numJsFiles, 'Javascript file(s)...');
                }

                const caseSensitiveRouting = this.config.app.routing.caseSensitive;
                return Promise.reduce(groupNames, (memo, name) => {
                    const group = jsFileGroups[name];
                    if (!caseSensitiveRouting) name = name.toLowerCase();
                    this.$debug.data(`Parsing (${name}): ${group.length} files`);
                    return this._parseJS(group, name)
                        .then(data => {
                            this._addRoute(name, 'js'); // e.g. name=web —> api:web
                            memo[name] = {
                                documentation: data,
                                symbols: jsdocx.utils.getSymbolNames(data, this.config.jsdoc.sort)
                            };
                            return memo;
                        });
                }, {});
            })
            .then(apisData => {
                this.apisData = apisData;
            })
            // executing promise chain in order for debugging purposes.
            // otherwise, we could use Promise.all(...)
            .then(() => this.templateBuilder.copyToDest())
            .then(() => this.templateBuilder.compileDocmaStyles())
            .then(() => this.templateBuilder.writeMainHTML())
            .then(() => this._parseMD(this.files.md))
            .then(() => this._processHTML(this.files.html))
            .then(() => this._copyAssets())
            .then(() => this._compileWebCore())
            .then(() => this.templateBuilder.writeServerConfig(this.routes))
            .then(() => this.templateBuilder.postBuild())
            .then(() => {
                this.$debug.log('\nDocumentation is built successfully...');
                this.$debug.data(
                    'Script Size: ',
                    this.stats.scriptSize, 'KB',
                    this.$debug.noMinify ? '(unminifed, fully documented),' : '(minified),',
                    this.stats.scriptSizeGZipped, 'KB', '(gzipped)'
                );
                this.$debug.data(
                    'Total Routes:',
                    (this.stats.apiRouteCount + this.stats.contentRouteCount),
                    '(' + this.stats.apiRouteCount + ' API, ' + this.stats.contentRouteCount + ' content)'
                );
                if (this.$debug.buildLogs) {
                    this.$debug.title('Configured SPA Routes:');
                    // console.log(JSON.stringify(this.routes, null, '  '));
                    this.$debug.table(this.routes, ['id'], 2);
                }
                if (this.$debug.noMinify || this.$debug.webLogs) {
                    let msg = [];
                    if (this.$debug.noMinify) msg.push('minification is turned off');
                    if (this.$debug.webLogs) msg.push('web-logs is enabled');
                    msg = msg.join(' and ');
                    msg = `Before you publish your docs, note that ${msg}.`;
                    const note = 'Use the \'debug\' option in your build configuration to change this.\n';
                    if (this.$debug.buildLogs) {
                        this.$debug.warn(msg);
                        this.$debug.data(note);
                    } else {
                        console.warn(msg);
                        console.log(note);
                    }
                }
                return true;
            });
    }

    // --------------------------------
    // STATIC METHODS
    // --------------------------------

    /**
     *  Creates a new instance of `Docma`.
     *  This is equivalent to `new Docma()`.
     *
     *  @returns {Docma} - Docma instance.
     */
    static create() {
        return new Docma();
    }
}

// --------------------------------
// STATIC MEMBERS
// --------------------------------

/**
 *  Enumerates the routing methods for a Docma generated web application.
 *  @enum {String}
 *  @readonly
 */
Docma.RoutingMethod = {
    /**
     *  Indicates that the SPA routes are based on query-strings.
     *  For example, for a named group of JS source files (e.g. `"mylib"`),
     *  the generated documentation will be accessible at `?api=mylib`.
     *  Ungrouped JS documentation will be accessible at `?api`.
     *  And for other HTML content such as files generated from markdown
     *  files (e.g. README.md) will be accessible at `?content=readme`.
     *  @type {String}
     */
    QUERY: 'query',
    /**
     *  Indicates that the SPA routes are based on path params rather than
     *  query-strings. For example, for a named group of JS source files
     *  (e.g. `"mylib"`), the generated documentation will be accessible at
     *  `api/mylib/`. Ungrouped JS documentation will be accessible at `api/`.
     *  And for other HTML content such as files generated from markdown
     *  files (e.g. README.md) will be accessible at `readme/`.
     *  @type {String}
     */
    PATH: 'path'
};

/**
 *  Enumerates Docma SPA route types.
 *  @enum {String}
 *  @readonly
 *
 *  @example <caption>Routing Method: <code>"query"</code></caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             ?api
 *  api      web               ?api=web
 *  content  templates         ?content=templates
 *  content  guide             ?content=guide
 *
 *  @example <caption>Routing Method: <code>"path"</code></caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             api/
 *  api      web               api/web/
 *  content  templates         templates/
 *  content  guide             guide/
 */
Docma.RouteType = {
    /**
     *  Indicates a route for API documentation content, generated from
     *  Javascript source files via JSDoc.
     *  @type {String}
     */
    API: 'api',
    /**
     *  Indicates a route for other content, such as HTML files generated
     *  from markdown.
     *  @type {String}
     */
    CONTENT: 'content'
};

/**
 *  Enumerates the server/host types for Docma generated SPA.
 *  The generated SPA is not limited to these hosts but Docma will generate
 *  additional server config files for these hosts; especially if the
 *  routing method is set to `"path"`. For example, for Apache;
 *  an `.htaccess` file will be auto-generated with redirect rules for
 *  (sub) routes. For GitHub, sub-directories will be generated
 *  (just like Jekyll) with index files for redirecting via http-meta
 *  refresh.
 *  @enum {String}
 *  @readonly
 */
Docma.ServerType = {
    /**
     *  Indicates that an Apache server will be hosting the generated SPA.
     *  @type {String}
     */
    APACHE: 'apache',
    /**
     *  Indicates that SPA will be hosted via
     *  {@link https://pages.github.com|GitHub Pages}.
     *  @type {String}
     */
    GITHUB: 'github',
    /**
     *  Indicates that SPA will be hosted as static HTML files.
     *  Similar to `Docma.ServerType.GITHUB`.
     *  @type {String}
     */
    STATIC: 'static',
    /**
     *  Indicates that SPA will be hosted on a Windows server.
     *  @type {String}
     */
    WINDOWS: 'windows'
};

/**
 *  Enumerates bitwise debug flags.
 *  @enum {Number}
 */
Docma.Debug = {
    /**
     *  Disables debugging.
     *  @type {Number}
     */
    DISABLED: 0,
    /**
     *  Outputs build logs to the Node console.
     *  @type {Number}
     */
    BUILD_LOGS: 1,
    /**
     *  Outputs app logs to the browser console.
     *  @type {Number}
     */
    WEB_LOGS: 2,
    /**
     *  Outputs verbose logs to consoles.
     *  @type {Number}
     */
    VERBOSE: 4,
    /**
     *  Disables minification for the generated web app assets such as
     *  Javascript files. This is useful if you're debugging a custom
     *  Docma template.
     *  @type {Number}
     */
    NO_MINIFY: 8,
    /**
     *  Outputs one or more `[name.]jsdoc.json` files that include
     *  documentation data for each (grouped) javascript source.
     *  `name` is the group name you give when you define the source
     *  files. This is useful for investigating the raw JSDoc output.
     *  @type {Number}
     */
    JSDOC_OUTPUT: 16,
    /**
     *  Enables all debug flags.
     *  @type {Number}
     */
    ALL: 31
};

/**
 *  @private
 */
Docma.TemplateDoctor = TemplateDoctor;

// --------------------------------
// EXPORT
// --------------------------------

module.exports = Docma;

// --------------------------------
// ADDITIONAL DOCUMENTATION
// --------------------------------

/**
 *  Docma build configuration object that defines parse options for the given
 *  source files; and templating options for the Single Page Application to be
 *  generated.
 *
 *  This is very configurable but, you're only required to define very few
 *  options such as the source files (`src`) and the destination directory
 *  (`dest`) for a simple build.
 *
 *  <blockquote>See the example at the bottom or for a real example; check out Docma's own
 *  build configuration file, that generates this documentation you're reading
 *  {@link https://github.com/onury/docma/blob/master/docma.json|here}.</blockquote>
 *
 *  @typedef Docma~BuildConfiguration
 *  @type Object
 *
 *  @param {String|Array|Object} src One or more source file/directory paths to
 *         be processed. This also accepts
 *         {@link https://github.com/isaacs/node-glob|Glob} strings or array of
 *         globs. e.g. `./src/&#x2A;&#x2A;/&#x2A;.js` will produce an array of
 *         all `.js` files under `./src` directory and sub-directories.
 *
 *         JavaScript files will be parsed with JSDoc and files with `.md`, `.htm`
 *         and `.html` extensions will be automatically parsed to proper formats.
 *         But if you need; you can force a specific parser on defined files.
 *         e.g. `./LICENSE:md` will be force-parsed to markdown.
 *
 *         See examples at the bottom for a better understanding.
 *  @param {Object} [assets] Non-source, static asset files/directories to be
 *         copied over to build directory; so you can use/link to files such as
 *         images, ZIPs, PDFs, etc... Keys of this object define the target
 *         directory, relative to the build destination directory. Value of each
 *         key can either be a single file path string or an array. This also
 *         accepts {@link https://github.com/isaacs/node-glob|Glob} strings or
 *         array of globs. e.g. `{ "/": ["./&#x2A;.png"] }` will copy all PNG
 *         files of the current relative directory to the root of destination
 *         directory. <b>CAUTION:</b> Each copy operation will overwrite the
 *         file if it already exists.
 *  @param {String} dest Destination output directory path. <b>CAUTION:</b>
 *         Files in this directory will be overwritten. If `clean` option is
 *         enabled, all contents will be removed. Make sure you set this to
 *         a correct path.
 *  @param {Boolean} [clean=false] Whether the destination directory should be
 *         emptied before the build.
 *  @param {Boolean|Number} [debug=false] Specifies debug settings for build
 *         operation and generated SPA. This takes a bitwise numeric value so
 *         you can combine flags to your liking. If a `Boolean` value set,
 *         `false` means `Docma.Debug.DISABLED` and `true` means
 *         `Docma.Debug.ALL` which enables all debugging options. See
 *         {@link #Docma.Debug|`Debug` flags enumeration} for all possible
 *         values.
 *  @param {Object} [jsdoc] - JSDoc parse options.
 *  @param {String} [jsdoc.encoding="utf8"] Encoding to be used when reading JS
 *         source files.
 *  @param {Boolean} [jsdoc.recurse=false] Specifies whether to recurse into
 *         sub-directories when scanning for source files.
 *  @param {Boolean} [jsdoc.pedantic=false] Specifies whether to treat errors as
 *         fatal errors, and treat warnings as errors.
 *  @param {String|Array} [jsdoc.access] Specifies which symbols to be processed
 *         with the given access property. Possible values: `"private"`,
 *         `"protected"`, `"public"` or `"all"` (for all access levels). By
 *         default, all except private symbols are processed. Note that, if
 *         access is not set for a documented symbol, it will still be included,
 *         regardless of this option.
 *  @param {Boolean} [jsdoc.private=false] -
 *  @param {String} [jsdoc.package] The path to the `package.json` file that
 *         contains the project name, version, and other details. If set to
 *         `true` instead of a path string, the first `package.json` file found
 *         in the source paths.
 *  @param {Boolean} [jsdoc.module=true] Specifies whether to include
 *         `module.exports` symbols.
 *  @param {Boolean} [jsdoc.undocumented=false] Specifies whether to include
 *         undocumented symbols.
 *  @param {Boolean} [jsdoc.undescribed=false] Specifies whether to include
 *         symbols without a description.
 *  @param {Boolean} [jsdoc.ignored=false] Specifies whether to include symbols
 *         marked with `ignore` tag.
 *  @param {String} [jsdoc.relativePath] When set, all `symbol.meta.path` values
 *         will be relative to this path.
 *  @param {Function} [jsdoc.predicate] This is used to filter the parsed
 *         documentation output array. If a `Function` is passed; it's invoked
 *         for each included `symbol`. e.g. `function (symbol) { return symbol;
 *         }` Returning a falsy value will remove the symbol from the output.
 *         Returning `true` will keep the original symbol. To keep the symbol
 *         and alter its contents, simply return an altered symbol object.
 *  @param {Boolean} [jsdoc.hierarchy=false] Specifies whether to arrange
 *         symbols by their hierarchy. This will find and move symbols that have
 *         a `memberof` property to a `$members` property of their corresponding
 *         owners. Also the constructor symbol will be moved to a `$constructor`
 *         property of the `ClassDeclaration` symbol; if any.
 *  @param {Boolean|String} [jsdoc.sort="alphabetic"] Specifies whether to sort
 *         the documentation symbols. For alphabetic sort, set to `true` or
 *         `"alphabetic"`. To group-sort set to `"grouped"`. <i>(Group sorting
 *         is done in the following order: by memberof, by scope, by access
 *         type, by kind, alphabetic.)</i> To sort by only `"scope"` or
 *         `"access"` or `"kind"`, set to corresponding string. <i>(Sorting by
 *         kind is done in the following order: constant, package/module,
 *         namespace, class, constructor, method, property, enum, typedef,
 *         event, interface, mixin, external, other members.)</i> Set to `false`
 *         to disable. <i>Note that this sorts the documentation symbols data,
 *         how it's displayed might be altered by the Docma template you're
 *         using.</i>
 *  @param {Boolean} [jsdoc.allowUnknownTags=true] Specifies whether to allow
 *         unrecognized tags. If set to `false` parsing will fail on unknown
 *         tags.
 *  @param {Array} [jsdoc.dictionaries=["jsdoc", "closure"]] Indicates the
 *         dictionaries to be used. By default, both standard JSDoc tags and
 *         Closure Compiler tags are enabled.
 *  @param {String} [jsdoc.includePattern=".+\\.js(doc|x)?$"] String pattern for
 *         defining sources to be included. By default, only files ending in
 *         `".js"`, "`.jsdoc"`, and `".jsx"` will be processed.
 *  @param {String} [jsdoc.excludePattern="(^|\\/|\\\\)_"] String pattern for
 *         defining sources to be ignored. By default, any file starting with an
 *         underscore or in a directory starting with an underscore will be
 *         ignored.
 *  @param {Array} [jsdoc.plugins=[]] Defines the JSDoc plugins to be used. See
 *         {@link http://usejsdoc.org/about-plugins.html|this guide} on JSDoc
 *         plugins.
 *  @param {Object} [markdown] - Markdown parse options.
 *  @param {Boolean} [markdown.gfm=true] Whether to enable
 *         {@link https://help.github.com/categories/writing-on-github|GitHub flavored markdown}.
 *  @param {Boolean} [markdown.tables=true] Whether to enable enable GFM
 *         {@link https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables|tables}.
 *         This option requires the `gfm` option to be `true`.
 *  @param {Boolean} [markdown.breaks=false] Whether to enable enable GFM
 *         {@link https://help.github.com/articles/basic-writing-and-formatting-syntax/#paragraphs-and-line-breaks|line breaks}.
 *         This option requires the `gfm` option to be `true`.
 *  @param {Boolean} [markdown.pedantic=false] Whether to conform with obscure
 *         parts of `markdown.pl` as much as possible. Don't fix any of the
 *         original markdown bugs or poor behavior.
 *  @param {Boolean} [markdown.sanitize=false] Whether to use smarter list
 *         behavior than the original markdown. May eventually be default with
 *         the old behavior moved into `pedantic`.
 *  @param {Boolean} [markdown.smartypants=false] Whether to use "smart"
 *         typographic punctuation for things like quotes and dashes.
 *  @param {Boolean} [markdown.xhtml=false] Self-close the tags for void
 *         elements (`<br/>`, `<img/>`, etc.) with a `"/"` as required by XHTML.
 *  @param {Boolean} [markdown.tasks=true] Whether to parse GitHub style task
 *         markdown (e.g. `- [x] task`) into checkbox elements.
 *  @param {Boolean} [markdown.emoji=true] If set to `true`, emoji shortcuts
 *         (e.g. `&#x3A;smiley&#x3A;`) are parsed into `&lt;img /&gt;` elements
 *         with {@link http://twitter.github.io/twemoji|twemoji} SVG URLs.
 *  @param {Object} [app] Configuration for the generated SPA (Single Page
 *         Application).
 *  @param {String} [app.title=""] Title of the main HTML document of the
 *         generated web app. (Sets the value of the `&lt;title&gt;` element.)
 *  @param {Array|Object} [app.meta] One or more meta elements to be set for the
 *         main HTML document of the generated web app. Set arbitrary object(s)
 *         for each meta element to be added. e.g. `[{ charset: "utf-8"}, {
 *         name: "robots", "content": "index, follow" }]`.
 *  @param {String} [app.base="/"] Sets the base path of the generated web app.
 *         For example if the app will operate within `/doc/*` set the base path
 *         to `"/doc"`.
 *  @param {String} [app.favicon] Local path to a `favicon.ico` file to be used
 *          with the web app.
 *  @param {String} [app.entrance="api"] Defines the home content to be
 *         displayed for the application root (when you enter the base path i.e.
 *         `"/"`). Pass the type and name of the route in `{type}:{name}`
 *         format. There are 2 types of routes: `api` for JS source
 *         documentation and `content` for other HTML content such as parsed
 *         markdown files. For example, if you have a grouped JS files
 *         documented with a name `mylib`; to define this as the entrance of the
 *         app, set this to `"api:mylib"`. If you have `"README.md"` in your
 *         source files; to define this as the entrance, set this to
 *         `"content:readme"`.
 *  @param {String|Object} [app.routing] Either a `String` defining the route
 *         method or an `Object` defining both the method and whether the routes
 *         should be case-sensitive.
 *         @param {String} [app.routing.method="query"]
 *                Indicates the routing method for the generated SPA (Single
 *                Page Application).
 *                See {@link #Docma.RoutingMethod|`RoutingMethod` enumeration}.
 *         @param {Boolean} [app.routing.caseSensitive=true]
 *                Indicates whether the routes should be case-sensitive.
 *                Note that if this is set to `false`, same route names will
 *                overwrite the previous, even if they have different case.
 *  @param {String} [app.server="static"] Server or host type for the SPA. This
 *         information helps Docma determine how to configure the generated SPA,
 *         especially if `routing.method` is set to `"path"`. See
 *         {@link #Docma.ServerType|`ServerType` enumeration} for details.
 *  @param {Object} [template] - SPA template configuration.
 *  @param {String} [template.path="default"] Either the path of a custom Docma
 *         template or the name of a built-in template. Omit to use the default
 *         built-in template.
 *  @param {Object} [template.options] SPA template options. This is defined by
 *         the template itself. Refer to the template's documentation for
 *         options to be set at build-time. See
 *         {@link templates/zebra/#template-options|Default Template options}.
 *
 *  @example
 *  const buildConfig = {
 *      src: [
 *          // using an object to define (group) names for JS files.
 *          {
 *              // grouping JS files under the name "my-lib".
 *              // This name also defines the api route name: e.g. ?api=my-lib or api/my-lib/
 *              'my-lib': [
 *                  './src/** /*.js',           // recurse all JS files under /src
 *                  './lib/some-other.js',
 *                  '!./lib/ignored.js'         // notice the bang! prefix to exclude this file
 *              ],
 *              // naming another api route
 *              'other-lib': './other/*.js',    // ?api=other-lib
 *          },
 *
 *          // ungrouped js files will be merged under default route
 *          './src/main.js',                    // ?api or ?api=_def_
 *          './src/main.utils.js',              // merged into same ?api or ?api=_def_
 *
 *          // including markdown ("content") files
 *          './CHANGELOG.md',                   // this will have 'changelog' as route name.
 *                                              // i.e. ?content=changelog
 *          // forcing specific parser on files:
 *          './LICENSE:md',                     // LICENSE file with no-extension is forced
 *                                              // to markdown via :md suffix.
 *                                              // route will be ?content=license or license/
 *          // using an object to rename the route for the given markdown files
 *          {
 *              guide: './README.md'            // this will have 'guide' as content route name
 *          }                                   // i.e. ?content=guide or guide/
 *      ],
 *      dest: './output/docs',                  // output directory for the generated docs
 *      app: {
 *          title: 'My Documentation',          // title of the app
 *          routing: 'query',                   // routing method "query" or "path"
 *          entrance: 'content:guide',          // initial route to load on entrance
 *          base: '/'                           // base path of the SPA
 *      },
 *
 *      // template-specific configuration.
 *      // for Zebra template, see https://onury.io/docma/templates/zebra
 *      template: {
 *          path: 'zebra',
 *          options: {
 *              title: {
 *                  label: 'My Docs',
 *                  href: '/docs/?'
 *              },
 *              navbar: true,
 *              sidebar: {
 *                  enabled: true,
 *                  outline: 'tree'
 *              }
 *          }
 *      }
 *  };
 *  // See Docma's own configuration @
 *  // https://github.com/onury/docma/blob/master/docma.json
 */

