/* eslint no-nested-ternary:0 */

// core modules
var path = require('path');

// dep modules
var _ = require('lodash'),
    Promise = require('bluebird'),
    jsdocx = require('jsdoc-x'),
    marked = require('marked');

// own modules
var DocmaTemplate = require('./docma.template'),
    HTMLParser = require('./html-parser'),
    utils = require('./utils'),
    Debug = require('./debug');

var fs = utils.fs;

module.exports = (function () {

    // Directory paths for various assets/components of the web core.
    var DIR_WEB = path.join(__dirname, 'web'),
        DIR_ASSETS = path.join(DIR_WEB, 'assets'),
        DIR_WEB_CONF = path.join(DIR_WEB, 'config'),
        DIR_COMPS = path.join(DIR_WEB, 'components'),
        DIR_DATA = path.join(__dirname, 'data');

    var paths = {
        // docma-web parts
        DOCMA_CORE: path.join(DIR_WEB, 'core.js'),
        DOCMA_CORE_PARTS: path.join(DIR_WEB, 'core.*.js'),
        // components to be compiled into docma-web (unminified files)
        DOCMA_COMPS: [
            path.join(DIR_COMPS, 'dust-core.js'),
            path.join(DIR_COMPS, 'dust-helpers.js'),
            path.join(DIR_COMPS, 'page.js'),
            path.join(DIR_COMPS, 'EventEmitter.js')
        ],
        // this is not compiled, used only for jsdom
        JQUERY: path.join(DIR_COMPS, 'jquery.min.js'),
        // docma base styles (for layout generally, not for styling)
        DOCMA_LESS: path.join(DIR_ASSETS, 'docma.less'),
        // JSON that includes emoji code to twemoji SVG filename mapping
        EMOJI_JSON: path.join(DIR_DATA, 'emoji.json'),
        // Server config files
        APACHE_CONF: path.join(DIR_WEB_CONF, 'htaccess'),
        REDIRECT_HTML: path.join(DIR_WEB_CONF, 'redirect.html')
    };

    var DEFAULT_JS_GROUP = '_def_',
        JSDOC_OUT_SUFFIX = 'jsdoc.json',
        TWEMOJI_BASE_URL = 'https://twemoji.maxcdn.com/svg/';

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    /**
     *  Builds a flat array of symbol names. this can be used for building
     *  menus, etc..
     *  @private
     *
     *  @param {Array} data - JSDoc documentation data.
     *
     *  @returns {Array} - Array of symbol names.
     */
    function _getSymbolNames(data, memo) {
        memo = memo || [];
        data.forEach(function (symbol) {
            // var longName = jsdocx.utils.getFullName(symbol);
            memo.push(symbol.$longname);
            if (!symbol.isEnum && symbol.$members) {
                memo = _getSymbolNames(symbol.$members, memo);
            }
        });
        return memo;
    }

    /**
     *  Parses the given markdown content.
     *  @private
     *
     *  @param {String} string - Markdown content.
     *  @param {Object} options - Markdown options for `marked`.
     *
     *  @returns {Promise} - Promise that returns the markdown, parsed to HTML.
     */
    function _promiseMarked(string, options) {
        return new Promise(function (resolve, reject) {
            marked(string, options, function (err, content) {
                if (err) return reject(err);
                resolve(content);
            });
        });
    }

    /**
     *  Gets the file path for the minified version of the given file.
     *  @private
     *
     *  @param {String} filePath - Path of the original (unminified) file.
     *
     *  @returns {String} - Path of the minified version.
     */
    function _getMinJsFilePath(filePath) {
        filePath = filePath.toLowerCase();
        if (_.endsWith(filePath, '.min.js')) return filePath;
        return path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.min.js');
    }

    /**
     *  Reads the given JS file into memory.
     *  @private
     *
     *  @param {String} filePath
     *         Path of the JS file.
     *  @param {Boolean} [noMinify=false]
     *         Whether not to minify the JS content.
     *  @param {Boolean} [checkMinFile=false]
     *         Whether to first check for an existing minified file (with a
     *         `min.js` suffix).
     *
     *  @returns {Promise} - Promise that returns JS code content.
     */
    function _readJsFile(filePath, noMinify, checkMinFile) {
        if (noMinify) return fs.readFileAsync(filePath, 'utf8');
        return Promise.resolve()
            .then(function () {
                if (!checkMinFile) return utils.js.minifyFile(filePath); // minified.code
                var minFilePath = _getMinJsFilePath(filePath);
                return fs.existsAsync(minFilePath).then(function (exists) {
                    if (exists) return fs.readFileAsync(minFilePath, 'utf8');
                    return utils.js.minifyFile(filePath);
                });
            })
            .then(function (minified) {
                return minified.code || minified;
            });
    }

    // --------------------------------
    // CLASS: Docma
    // --------------------------------

    /**
     *  Docma (builder) class for generating HTML documentation from the given
     *  Javascript and/or markdown source files.
     *
     *  This documentation you're reading is built with Docma.
     *  @class
     *
     *  @example
     *  var Docma = require('docma'),
     *  	docma = new Docma();
     */
    function Docma() {}

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    /**
     *  Configures the Docma instance with the given build configuration.
     *  @private
     *
     *  @param {Object} config - Build configuration.
     *  @returns {Object} - Config object with default values set.
     */
    Docma.prototype._init = function (config) {
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
            app: {
                title: '',
                meta: null,
                base: '',
                entrance: 'api',
                routing: { method: 'query', caseSensitive: true },
                server: 'static'
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
                hierarchy: true,
                sort: 'grouped',
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
                tasks: true,
                emoji: true
            }
        });

        // routing config accepts both `String` or `Object`
        var routing = this.config.app.routing;
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

        var templateConf = _.defaultsDeep(this.config.template, {
            dest: config.dest
        });
        this.template = new DocmaTemplate(templateConf, this.config.app, paths, this.$debug);

        // storage for content path names. Used to create directories for
        // generated HTML index files, if routing method is "path" and server is
        // "github".
        this.routes = []; // see ._addRoute()
    };

    /**
     *  Adds a new route information object to existing routes.
     *  These objects define the type and route path for the related content.
     *  @private
     *
     *  @param {String} name
     *         Name of the content.
     *  @param {Boolean} [isApiRoute=false]
     *         Specifies whether this is an API route which will render JSDoc
     *         generated documentation content.
     */
    Docma.prototype._addRoute = function (name, isApiRoute) {
        if (!this.config.app.routing.caseSensitive) name = name.toLowerCase();
        var type = isApiRoute ? 'api' : 'content',
            queryRouting = this.config.app.routing.method === 'query',
            rName = isApiRoute
                ? (name === DEFAULT_JS_GROUP ? '' : name)
                : name;
        this.routes.push({
            id: type + ':' + rName,
            type: type,
            name: name,
            path: queryRouting
                ? '/?' + type + (rName ? '=' + rName : '')
                : (isApiRoute ? '/api' : '') + (rName ? '/' + rName : ''),
            // if this is not api route, generated HTML content is placed in the
            // content directory.
            contentPath: !isApiRoute
                ? 'content/' + name + '.html'
                : null
        });
    };

    /**
     *  Compiles Docma Web Core object and writes `docma-web.js` file which is
     *  the core engine of the generated SPA. This object also includes Dustjs
     *  engine, partials, other components such as `page.js` and
     *  `EventEmitter` and parsed documentation data.
     *  @private
     *
     *  @see {@link ?api=docma-web|Docma Web API}
     *
     *  @returns {Promise}
     */
    Docma.prototype._compileWebCore = function () {
        var self = this,
            jsDest = path.join(this.config.dest, 'js');

        self.$debug.info('Compiling Docma (Web) Core...');

        return fs.ensureDirAsync(jsDest)
            // binding an object to keep state/results through the promise chain
            // instead of a higher scope variable.
            // http://stackoverflow.com/a/28250700/112731
            .bind({
                comp: [],
                docmaWeb: []
            })
            .then(function () {
                self.$debug.data('Compiling components...');
                var $this = this;
                return Promise.each(paths.DOCMA_COMPS, function (file) {
                    self.$debug.data('Compiling:', file);
                    return _readJsFile(file, self.$debug.noMinify, true)
                        .then(function (code) {
                            return $this.comp.push(code);
                        });
                });
            })
            .then(function () {
                // dust-compile partial html files
                return self.template.compilePartials();
            })
            .then(function (dustTemplates) {
                // add dust templates
                this.comp.push(dustTemplates);

                // create docma object to be passed to the template
                var dm = {
                    // pass routes information to document.
                    routes: self.routes,
                    // pass api documentation(s) and symbol list(s) to document.
                    apis: self.apisData,
                    // pass SPA app config
                    app: self.config.app || {},
                    // pass template data to document. template name, title,
                    // options, etc...
                    template: self.template.getData() || {},
                    // storage for private fields
                    _: {
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
                        // enable logs for web core
                        logsEnabled: self.$debug.webLogs
                    }
                };
                this.docmaWeb.push('var docma = ' + JSON.stringify(dm) + ';');
                // read & minify docma web core files
                var $this = this;

                return utils.glob.match(paths.DOCMA_CORE_PARTS)
                    .then(function (docmaCoreParts) {
                        return Promise.each(docmaCoreParts, function (file) {
                            return _readJsFile(file, self.$debug.noMinify, false)
                                .then(function (code) {
                                    return $this.docmaWeb.push(code);
                                });
                        });
                    })
                    .then(function () {
                        // core.js should be the last
                        return _readJsFile(paths.DOCMA_CORE, self.$debug.noMinify, false);
                    })
                    .then(function (code) {
                        return $this.docmaWeb.push(code);
                    });
            })
            .then(function () {
                self.$debug.info('Writing docma-web.js ...');
                // add docma license at the top
                this.docmaWeb.unshift('/*!\n * Docma (Web) Core\n * https://github.com/onury/docma\n * @license MIT\n */');
                // freeze docma object
                this.docmaWeb.push('docma = Object.freeze(docma);');
                // add components code before docma.
                this.docmaWeb = this.comp.concat(this.docmaWeb);
                var d = path.join(jsDest, 'docma-web.js'),
                    script = this.docmaWeb.join('\n');
                self.$debug.data(
                    'Script Size:',
                    utils.getContentSize(script), 'KB',
                    self.$debug.noMinify ? '(unminifed, fully documented)' : '(minified)'
                );
                return fs.writeFileAsync(d, script, 'utf8');
            });
    };

    /**
     *  Processes source files of the documentation to be built; and determines
     *  how they should be parsed.
     *  @private
     *
     *  @returns {Promise} - Promise that returns grouped files.
     */
    Docma.prototype._processFiles = function () {
        var $this = this,
            files = {
                js: {},
                md: {},
                html: {}
            };
        // default for unnamed group of js files
        files.js[DEFAULT_JS_GROUP] = [];

        $this.$debug.info('Expanding source files...');

        // expands the glob src then picks each file by it's extension. Markdown
        // files are directly moved to files.md:Array. JS files, if no jsGroup
        // is defined; are moved into files.js._def_:Array. If jsGroup is
        // defined, they will be moved into a new group
        // files.js[groupName]:Array. Duplicate .js or .md files are ingnored.
        function pick(memo, src, name) {
            var into = name ? 'into "' + name + '"' : '';
            $this.$debug.info('Expanding:', src, into);

            return utils.glob.match(src)
                .then(function (srcFiles) {
                    _.each(srcFiles, function (filePath) {
                        filePath = path.resolve(filePath);
                        var ext = path.extname(filePath).toLowerCase();
                        if (ext === '.js') {
                            var jsGroupName = name || DEFAULT_JS_GROUP; // default js file group name
                            // set js-group if it doesn't exist
                            var grp = memo.js[jsGroupName] = memo.js[jsGroupName] || [];
                            if (grp.indexOf(filePath) === -1) {
                                $this.$debug.data('Queued:', filePath);
                                grp.push(filePath);
                            } else {
                                $this.$debug.warn('Duplicate ignored:', filePath);
                            }
                        } else if (ext === '.md') {
                            var mdName = (name || utils.path.basename(filePath)).toLowerCase();
                            if (!memo.md.hasOwnProperty(mdName)) {
                                $this.$debug.data('Queued:', filePath);
                                memo.md[mdName] = filePath;
                            } else {
                                $this.$debug.warn('Duplicate ignored:', filePath);
                            }
                        } else if (ext === '.html' || ext === '.htm') {
                            var htmlName = (name || utils.path.basename(filePath)).toLowerCase();
                            if (!memo.html.hasOwnProperty(htmlName)) {
                                $this.$debug.data('Queued:', filePath);
                                memo.html[htmlName] = filePath;
                            } else {
                                $this.$debug.warn('Duplicate ignored:', filePath);
                            }
                        } else {
                            $this.$debug.warn('Unsupported file ignored:', filePath);
                        }
                    });
                    return memo;
                });
        }

        // $this.config.src is ensured to be an array, in the constructor
        return Promise.reduce($this.config.src, function (memo, src) {
            // if this item is a string, this means it's a .js file with no
            // group name defined or an .md file.
            if (typeof src === 'string') {
                return pick(memo, src);
            }
            // if this item is an object, it's a named-group of .js files.
            if (_.isPlainObject(src)) {
                return Promise.each(_.keys(src), function (key) {
                    return pick(memo, src[key], key);
                }).thenReturn(memo);
            }
            return memo;

        }, files).then(function (files) {
            $this.files = files; // e.g. { js: { groupName: [..] }, md: { name: ".." } }
            return files;
        });
    };

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
    Docma.prototype._parseJS = function (jsFiles, filePrefix) {
        jsFiles = utils.ensureArray(jsFiles);
        if (!jsFiles || jsFiles.length === 0) {
            return Promise.resolve([]);
        }

        var jdxOpts = _.extend({
            files: jsFiles
        }, this.config.jsdoc);

        // output json files if debugging
        if (this.$debug.jsdocOutput) {
            var filename = (filePrefix && filePrefix !== DEFAULT_JS_GROUP) ? filePrefix + '.' : '';
            filename += JSDOC_OUT_SUFFIX;
            jdxOpts.output = {
                path: path.join(this.config.dest, filename),
                indent: 2,
                force: false
            };
        }
        return jsdocx.parse(jdxOpts);
    };

    Docma.prototype._getFilesHashMap = function (files) {
        if (typeof files === 'string') files = [files];

        if (_.isArray(files)) {
            var oFiles = {};
            if (files.length === 0) return Promise.resolve();
            files.forEach(function (file) {
                var n = utils.path.basename(file).toLowerCase();
                if (!oFiles.hasOwnProperty(n)) oFiles[n] = file;
            });
            return oFiles;
        }
        if (_.isPlainObject(files)) return files;
        return null;
    };

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
     *  @returns {Promise}
     */
    Docma.prototype._parseMD = function (mdFiles) {
        if (!mdFiles) return Promise.resolve();
        var oFiles = this._getFilesHashMap(mdFiles);
        if (!oFiles) {
            return Promise.reject(new Error('Invalid markdown file(s) passed.'));
        }

        var markedOpts = _.extend({}, this.config.markdown, {
            renderer: new marked.Renderer()
        });
        // marked.setOptions(markedOpts);

        var $this = this,
            fileNames = _.keys(oFiles);

        $this.$debug.info('Parsing', fileNames.length, 'Markdown file(s)...');

        return Promise.each(fileNames, function (name) {
            var file = oFiles[name];
            $this.$debug.data('Parsing (' + name + '):', file);
            return fs.readFileAsync(file, 'utf8')
                .then(function (mdString) {
                    return _promiseMarked(mdString, markedOpts);
                })
                .then(function (html) {
                    // some extra markdown flavor by Docma
                    if ($this.config.markdown.tasks) {
                        return HTMLParser.create(html)
                            .parseMarkdownTasks('docma task-item')
                            .edit(function (window) {
                                window.$('.docma.task-item')
                                    .parents('ul')
                                    .addClass('docma task-list');
                            }, [paths.JQUERY])
                            .then(function (parser) {
                                return parser.content;
                            });
                    }
                    return html;
                })
                .then(function (html) {
                    // additional GFM: add horiziontal line right after each
                    // <h1/>, just like GitHub.
                    if ($this.config.markdown.gfm) {
                        html = html.replace(/<\/h1>/g, '</h1>\n<hr />');
                    }
                    // if emoji enabled, find and replace :emoji_code: with <img src=svg />
                    if ($this.config.markdown.emoji) {
                        var re = /:([^:\s]+):/g;
                        return utils.json.read(paths.EMOJI_JSON)
                            .then(function (emojiMap) {
                                return html.replace(re, function (match, p1) { // , offset, string
                                    var code = emojiMap[p1];
                                    return code
                                        ? '<img class="docma emoji" src="' + TWEMOJI_BASE_URL + code + '.svg" />'
                                        : match;
                                });
                            });
                    }
                })
                .then(function (html) {
                    var outPath = path.join($this.config.dest, 'content', name + '.html');
                    $this._addRoute(name, false);
                    // creates parent directories if they don't exist
                    return fs.outputFileAsync(outPath, html, 'utf8');
                });
        });

    };

    Docma.prototype._processHTML = function (htmlFiles) {
        if (!htmlFiles) return Promise.resolve();
        var oFiles = this._getFilesHashMap(htmlFiles);
        if (!oFiles) {
            return Promise.reject(new Error('Invalid HTML file(s) passed.'));
        }

        var $this = this,
            fileNames = _.keys(oFiles);

        $this.$debug.info('Processing', fileNames.length, 'HTML file(s)...');

        return Promise.each(fileNames, function (name) {
            var file = oFiles[name];
            $this.$debug.data('Processing (' + name + '):', file);
            return fs.readFileAsync(file, 'utf8')
                .then(function (html) {
                    var outPath = path.join($this.config.dest, 'content', name + '.html');
                    $this._addRoute(name, false);
                    // creates parent directories if they don't exist
                    return fs.outputFileAsync(outPath, html, 'utf8');
                });
        });
    };

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
     *  @returns {Promise}
     *           Promise that returns a `Boolean` value for whether the build
     *           operation is successful. This will always returns `true` if
     *           no errors occur. You should `.catch()` the errors of the
     *           promise chain.
     *
     *  @example
     *  var docma = new Docma();
     *  docma.build(config)
     *  	.then(function (success) {
     *  		console.log('Documentation is built successfully.');
     *  	})
     *  	.catch(function (error) {
     *  		console.log(error);
     *  	});
     */
    Docma.prototype.build = function (config) {
        var self = this;

        return Promise.resolve()
            .then(function () {
                if (_.isPlainObject(config)) return config;
                return utils.json.read(config);
            })
            .then(function (conf) {
                self._init(conf);

                self.$debug.title('Building documentation...');
                self.$debug.log('Using Template:', self.template.config.name, '(version:', self.template.config.version + ')\n');

                return fs.ensureDirAsync(self.config.dest);
            })
            .then(function () {
                return fs.emptyDirAsync(self.config.dest);
            })
            .then(function () {
                return self._processFiles();
            })
            .then(function () {
                // JS files are picked into self.files.js object. Each property
                // is a group of JS files. Each key is the name of that group.
                // Now, we'll jsdoc-parse each group of js fils and form the an
                // object with the following signature for each:
                // { documentation:Array, symbols:Array }
                // final apisData will be { group1:Object, group2:Object, ... }
                var jsFileGroups = self.files.js || {},
                    groupNames = _.keys(jsFileGroups);

                if (groupNames.length === 0) return Promise.resolve({});

                if (self.$debug.buildLogs) {
                    var numJsFiles = _.reduce(jsFileGroups, function (sum, item) {
                        return sum + item.length;
                    }, 0);
                    self.$debug.info('Parsing', numJsFiles, 'Javascript file(s)...');
                }

                var caseSensitiveRouting = self.config.app.routing.caseSensitive;
                return Promise.reduce(groupNames, function (memo, name) {
                    var group = jsFileGroups[name];
                    if (!caseSensitiveRouting) name = name.toLowerCase();
                    self.$debug.data('Parsing (' + name + '):', group.length + ' files');
                    return self._parseJS(group, name)
                        .then(function (data) {
                            self._addRoute(name, true); // e.g. name=docma-web —> api:docma-web
                            memo[name] = {
                                documentation: data,
                                symbols: _getSymbolNames(data)
                            };
                            return memo;
                        });
                }, {});
            })
            .then(function (apisData) {
                self.apisData = apisData;
                // console.log('apisData', _.keys(apisData));
            })
            // executing promise chain in order for debugging purposes.
            // otherwise, we could use Promise.all(...)
            .then(function () {
                return self.template.copyToDest();
            })
            .then(function () {
                return self.template.compileStyles();
            })
            .then(function () {
                return self.template.compileScripts();
            })
            .then(function () {
                return self.template.writeMainHTML();
            })
            .then(function () {
                return self._parseMD(self.files.md);
            })
            .then(function () {
                return self._processHTML(self.files.html);
            })
            .then(function () {
                return self._compileWebCore();
            })
            .then(function () {
                if (self.config.app.routing.method === 'path') {
                    return self.template.writeServerConfig(self.routes);
                }
            })
            .then(function () {
                self.$debug.log('\nDocumentation is built successfully...');
                if (self.$debug.buildLogs) {
                    self.$debug.title('Configured SPA Routes:');
                    self.$debug.table(self.routes, ['id']);
                }

                return true;
            });
    };

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
         *  the generated documentation will be accessible at `/?api=mylib`.
         *  Ungrouped JS documentation will be accessible at `/?api`.
         *  And for other HTML content such as files generated from markdown
         *  files (e.g. README.md) will be accessible at `/?content=readme`.
         *  @type {String}
         */
        QUERY: 'query',
        /**
         *  Indicates that the SPA routes are based on path params rather than
         *  query-strings. For example, for a named group of JS source files
         *  (e.g. `"mylib"`), the generated documentation will be accessible at
         *  `/api/mylib`. Ungrouped JS documentation will be accessible at `/api`.
         *  And for other HTML content such as files generated from markdown
         *  files (e.g. README.md) will be accessible at `/readme`.
         *  @type {String}
         */
        PATH: 'path'
    };

    /**
     *  Enumerates Docma SPA route types.
     *  @enum {String}
     *  @readonly
     *
     *  @example
     *  // routing method: query
     *  type     name              path
     *  -------  ----------------  --------------------------
     *  api      _def_             /?api
     *  api      docma-web         /?api=docma-web
     *  content  templates         /?content=templates
     *  content  guide             /?content=guide
     *
     *  @example
     *  // routing method: path
     *  type     name              path
     *  -------  ----------------  --------------------------
     *  api      _def_             /api
     *  api      docma-web         /api/docma-web
     *  content  templates         /templates
     *  content  guide             /guide
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
     *  (sub) routes. For GitHub, sub-dirctories will be generated
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
        STATIC: 'static'
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

    // --------------------------------
    // STATIC METHODS
    // --------------------------------

    /**
     *  Creates a new instance of `Docma`.
     *  This is equivalent to `new Docma()`.
     *
     *  @returns {Docma} - Docma instance.
     */
    Docma.create = function () {
        return new Docma();
    };

    // --------------------------------
    // EXPORT
    // --------------------------------

    return Docma;

})();

// --------------------------------
// ADDITIONAL DOCUMENTATION
// --------------------------------

/**
 *  Docma build configuration object that defines parse options for the given
 *  source files; and and templating options for the Single Page Application to
 *  be generated.
 *
 *  This is very configurable but, you're only required to define very few
 *  options such as the source files (`src`) and the destination directory
 *  (`dest`) for a simple build.
 *
 *  See the example at the bottom or for a real example; check out Docma's own
 *  build configuration file, that generates this documentation you're reading
 *  {@link https://github.com/onury/docma/blob/master/doc/docma.config.json|here}.
 *
 *  @typedef Docma~BuildConfiguration
 *  @type Object
 *
 *  @param {String|Array|Object} src
 *         One or more file/directory paths to be processed. This also accepts
 *         {@link https://github.com/isaacs/node-glob|Glob} strings or array of
 *         globs. e.g. `./src/&#x2A;&#x2A;/&#x2A;.js` will produce an array of
 *         all `.js` files under `./src` directory and sub-directories. See
 *         examples below for how to <b>name-group</b> source files.
 *  @param {String} dest
 *         Destination output directory path. <b>CAUTION:</b> This directory
 *         will be emptied before the build. Make sure you set this to a correct
 *         path.
 *  @param {Boolean|Number} [debug=false]
 *         Specifies debug settings for build operation and generated SPA.
 *         This takes a bitwise numeric value so you can combine flags to
 *         your liking. If a `Boolean` value set, `false` means
 *         `Docma.Debug.DISABLED` and `true` means `Docma.Debug.ALL` which
 *         enables all debugging options.
 *         See {@link #Docma.Debug|`Debug` flags enumeration} for all possible
 *         values.
 *  @param {Object} [jsdoc] - JSDoc parse options.
 *  @param {String} [jsdoc.encoding="utf8"]
 *         Encoding to be used when reading JS source files.
 *  @param {Boolean} [jsdoc.recurse=false]
 *         Specifies whether to recurse into sub-directories when scanning for
 *         source files.
 *  @param {Boolean} [jsdoc.pedantic=false]
 *         Specifies whether to treat errors as fatal errors, and treat warnings
 *         as errors.
 *  @param {String|Array} [jsdoc.access]
 *         Specifies which symbols to be processed with the given access
 *         property. Possible values: `"private"`, `"protected"`, `"public"` or
 *         `"all"` (for all access levels). By default, all except private
 *         symbols are processed. Note that, if access is not set for a
 *         documented symbol, it will still be included, regardless of this
 *         option.
 *  @param {Boolean} [jsdoc.private=false] -
 *  @param {String} [jsdoc.package]
 *         The path to the `package.json` file that contains the project name,
 *         version, and other details. If set to `true` instead of a path
 *         string, the first `package.json` file found in the source paths.
 *  @param {Boolean} [jsdoc.module=true]
 *         Specifies whether to include `module.exports` symbols.
 *  @param {Boolean} [jsdoc.undocumented=true]
 *         Specifies whether to include undocumented symbols.
 *  @param {Boolean} [jsdoc.undescribed=true]
 *         Specifies whether to include symbols without a description.
 *  @param {String} [jsdoc.relativePath]
 *         When set, all `symbol.meta.path` values will be relative to this path.
 *  @param {Function} [jsdoc.predicate]
 *         This is used to filter the parsed documentation output array. If a
 *         `Function` is passed; it's invoked for each included `symbol`. e.g.
 *         `function (symbol) { return symbol; }` Returning a falsy value will
 *         remove the symbol from the output. Returning `true` will keep the
 *         original symbol. To keep the symbol and alter its contents, simply
 *         return an altered symbol object.
 *  @param {Boolean} [jsdoc.hierarchy=false]
 *         Specifies whether to arrange symbols by their hierarchy. This will
 *         find and move symbols that have a `memberof` property to a `$members`
 *         property of their corresponding owners. Also the constructor symbol
 *         will be moved to a `$constructor` property of the `ClassDeclaration`
 *         symbol; if any.
 *  @param {Boolean|String} [jsdoc.sort=false]
 *         Specifies whether to sort the documentation symbols. For alphabetic
 *         sort, set to `true` or `"alphabetic"`. To additionally group by scope
 *         (static/instance) set to `"grouped"`. Set to `false` to disable.
 *  @param {Object} [markdown] - Markdown parse options.
 *  @param {Boolean} [markdown.gfm=true]
 *         Whether to enable {@link https://help.github.com/categories/writing-on-github|GitHub flavored markdown}.
 *  @param {Boolean} [markdown.tables=true]
 *         Whether to enable enable GFM {@link https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables|tables}.
 *         This option requires the `gfm` option to be `true`.
 *  @param {Boolean} [markdown.breaks=false]
 *         Whether to enable enable GFM {@link https://help.github.com/articles/basic-writing-and-formatting-syntax/#paragraphs-and-line-breaks|line breaks}.
 *         This option requires the `gfm` option to be `true`.
 *  @param {Boolean} [markdown.pedantic=false]
 *         Whether to conform with obscure parts of `markdown.pl` as much as
 *         possible. Don't fix any of the original markdown bugs or poor
 *         behavior.
 *  @param {Boolean} [markdown.sanitize=false]
 *         Whether to use smarter list behavior than the original markdown. May
 *         eventually be default with the old behavior moved into `pedantic`.
 *  @param {Boolean} [markdown.smartypants=false]
 *         Whether to use "smart" typographic punctuation for things like quotes
 *         and dashes.
 *  @param {Boolean} [markdown.tasks=true]
 *         Whether to parse GitHub style task markdown (e.g. `- [x] task`) into
 *         checkbox elements.
 *  @param {Boolean} [markdown.emoji=true]
 *         If set to `true`, emoji shortcuts (e.g. `&#x3A;smiley&#x3A;`) are
 *         parsed into `&lt;img /&gt;` elements with
 *         {@link http://twitter.github.io/twemoji|twemoji} SVG URLs.
 *  @param {Object} [app]
 *         Configuration for the generated SPA (Single Page Application).
 *  @param {String} [app.title=""]
 *         Title of the main HTML document of the generated web app.
 *         (Sets the value of the `&lt;title&gt;` element.)
 *  @param {Array|Object} [app.meta]
 *         One or more meta elements to be set for the main HTML document of
 *         the generated web app. Set arbitrary object(s) for each meta element
 *         to be added. e.g. `[{ charset: "utf-8"}, { name: "robots", "content": "index, follow" }]`.
 *  @param {String} [app.base="/"]
 *         Sets the base path of the generated web app. For example if the app
 *         will operate within `/doc/*` set the base path to `"/doc"`.
 *  @param {String} [app.entrance="api"]
 *         Defines the home content to be displayed for the application root
 *         (when you enter the base path i.e. `"/"`). Pass the type and name of
 *         the route in `{type}:{name}` format. There are 2 types of routes: `api`
 *         for JS source documentation and `content` for other HTML content such
 *         as parsed markdown files. For example, if you have a grouped JS files
 *         documented with a name `mylib`; to define this as the entrance of the
 *         app, set this to `"api:mylib"`. If you have `"README.md"` in your
 *         source files; to define this as the entrance, set this to
 *         `"content:readme"`.
 *  @param {String|Object} [app.routing]
 *         Either a `String` defining the route method or an `Object` defining
 *         both the method and whether the routes should be case-sensitive.
 *         @param {String} [app.routing.method="query"]
 *                Indicates the routing method for the generated SPA (Single
 *                Page Application).
 *                See {@link #Docma.RoutingMethod|`RoutingMethod` enumeration}.
 *         @param {Boolean} [app.routing.caseSensitive=true]
 *                Indicates whether the routes should be case-sensitive.
 *                Note that if this is set to `false`, same route names will
 *                overwrite the previous, even if they have different case.
 *  @param {String} [app.server="static"]
 *         Server or host type for the SPA. This information helps Docma
 *         determine how to configure the generated SPA, especially if
 *         `routing.method` is set to `"path"`.
 *         See {@link #Docma.ServerType|`ServerType` enumeration} for details.
 *  @param {Object} [template] - SPA template configuration.
 *  @param {String} [template.path="default"]
 *         Either the path of a custom Docma template or the name of a built-in
 *         template. Omit to use the default built-in template.
 *  @param {Object} [template.options]
 *         SPA template options. This is defined by the template itself.
 *         Refer to the template's documentation for options to be set at
 *         build-time. (If any option is omitted in the build, default values
 *         within the `docma.template.json` configuration file of the template
 *         are used.)
 *
 *  @example
 *  {
 *  	src: [
 *  	    {
 *  	    	// including js ("api") files
 *  	    	// grouping JS files under a name.
 *  	    	// This name also defines the api route name.
 *  	    	// i.e. /?api=my-lib
 *  	    	'my-lib': [
 *  	    		'./src/** /*.js', // recurse
 *  	    		'./lib/some-other.js',
 *  	    		'!./lib/ignored.js' // notice the bang!
 *  	    	],
 *  	    	// naming another api route
 *  	    	'other-lib': './other/*.js', // /?api=other-lib
 *  	    },
 *  	    // unnamed js files
 *  	    './src/main.js', // /?api or /?api=_def_
 *  	    './src/main.utils.js', // merged into same /?api or /?api=_def_
 *  	    // including markdown ("content") files
 *  	    './src/CHANGELOG.md', // this will have 'changelog' as route name. i.e. /?content=changelog
 *  	    // including markdown and renaming the route
 *  	    {
 *  	    	// this will have 'guide' as content route name
 *  	    	// i.e. /?content=guide
 *  	    	guide: './src/README.md'
 *  	    }
 *  	],
 *  	dest: './output/docs',
 *  	app: {
 *  		title: 'My Documentation',
 *  		routing: 'query',
 *  		entrance: 'content:guide'
 *  	},
 *  	template: {
 *  		path: 'default'
 *  	}
 *  }
 */
