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
            path.join(DIR_COMPS, 'dustjs-linkedin', 'dist', 'dust-core.js'),
            path.join(DIR_COMPS, 'dustjs-helpers', 'dist', 'dust-helpers.js'),
            path.join(DIR_COMPS, 'page', 'page.js'),
            path.join(DIR_COMPS, 'eventEmitter', 'EventEmitter.js')
        ],
        // this is not compiled, used only for jsdom
        JQUERY: path.join(DIR_COMPS, 'jquery', 'dist', 'jquery.min.js'),
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

    // builds a flat array of symbol names. this can be used for building menus,
    // etc...
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

    function _promiseMarked(string, options) {
        return new Promise(function (resolve, reject) {
            marked(string, options, function (err, content) {
                if (err) return reject(err);
                resolve(content);
            });
        });
    }

    function _getMinJsFilePath(filePath) {
        filePath = filePath.toLowerCase();
        if (_.endsWith(filePath, '.min.js')) return filePath;
        return path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.min.js');
    }

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
                return minified.code;
            });
    }

    // --------------------------------
    // CLASS: Docma
    // --------------------------------

    function Docma(config) {
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
                entrance: null,
                routing: 'query',
                server: null
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
                sort: "grouped",
                // relativePath: path.join(__dirname, '/code'),
                filter: null
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

        if (this.config.app.base) {
            // this.config.app.base = utils.path.removeEndSlash(this.config.app.base);
            this.config.app.base = utils.path.ensureEndSlash(this.config.app.base);
        }

        // debug option accepts both boolean and number values.
        // 0|false - disable debug
        // 1|true - generate ...jsdoc.json output files.
        // 2 - also disable minification.
        // 3 - also output logs to console.
        this.$debug = new Debug(this.config.debug);
        // set the normalized value back
        this.config.debug = this.$debug.level;

        var templateConf = _.defaultsDeep(this.config.template, {
            dest: config.dest
        });
        this.template = new DocmaTemplate(templateConf, this.config.app, paths, this.$debug);

        // storage for content path names. Used to create directories for
        // generated HTML index files, if routing is "path" and server is
        // "github".
        this.routes = []; // see ._addRoute()
    }

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    Docma.prototype._addRoute = function (name, isApiRoute) {
        var type = isApiRoute ? 'api' : 'content',
            queryRouting = this.config.app.routing === 'query',
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
                        logsEnabled: self.$debug.logsEnabled
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

    Docma.prototype._processFiles = function () {
        var $this = this,
            files = {
                js: {},
                md: {}
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

    /**
     *  Parses given list of markdown files and generates HTML files from each.
     *  @private
     *
     *  @param {String|Array|Object} mdFiles - One or more markdown file paths.
     *  If an object is passed, each generated HTML file will be named by the
     *  key (lower-cased). Otherwise, the basename of the original markdown
     *  file, (lower-cased) without the extension will be name of the file.
     *  e.g. `README.md` is named `readme.html`.
     *
     *  @returns {Promise}
     */
    Docma.prototype._parseMD = function (mdFiles) {
        if (!mdFiles) return Promise.resolve();
        if (typeof mdFiles === 'string') mdFiles = [mdFiles];

        var oFiles = {};
        if (_.isArray(mdFiles)) {
            if (mdFiles.length === 0) return Promise.resolve();
            mdFiles.forEach(function (file) {
                var n = utils.path.basename(file).toLowerCase();
                if (!oFiles.hasOwnProperty(n)) oFiles[n] = file;
            });
        } else if (_.isPlainObject(mdFiles)) {
            oFiles = mdFiles;
        } else {
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

    Docma.prototype.build = function (callback) {
        var self = this;

        self.$debug.title('Building documentation...');
        self.$debug.log('Using Template:', self.template.config.name, '(version:', self.template.config.version + ')\n');

        return fs.ensureDirAsync(self.config.dest)
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

                if (self.$debug.logsEnabled) {
                    var numJsFiles = _.reduce(jsFileGroups, function (sum, item) {
                        return sum + item.length;
                    }, 0);
                    self.$debug.info('Parsing', numJsFiles, 'Javascript file(s)...');
                }

                return Promise.reduce(groupNames, function (memo, name) {
                    var group = jsFileGroups[name];
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
                return self._compileWebCore();
            })
            .then(function () {
                if (self.config.app.routing === 'path') {
                    return self.template.writeServerConfig(self.routes);
                }
            })
            .then(function () {
                self.$debug.log('\nDocumentation is built successfully...');
                if (self.$debug.logsEnabled) {
                    self.$debug.title('Configured SPA Routes:');
                    self.$debug.table(self.routes, ['id']);
                }

                return true;
            })
            .nodeify(callback);
    };

    // --------------------------------
    // STATIC METHODS
    // --------------------------------

    Docma.create = function (config) {
        return new Docma(config);
    };

    Docma.fromFile = function (configFilePath, callback) {
        return utils.json.read(configFilePath)
            .then(function (config) {
                return new Docma(config);
            })
            .nodeify(callback);
    };

    // --------------------------------
    // EXPORT
    // --------------------------------

    return Docma;

})();
