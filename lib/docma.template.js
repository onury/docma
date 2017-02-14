
// core modules
var path = require('path');

// dep modules
var _ = require('lodash'),
    Promise = require('bluebird'),
    dust = require('dustjs-linkedin');

// own modules
var utils = require('./utils'),
    HTMLParser = require('./html-parser');

var fs = utils.fs;

module.exports = (function () {

    var CONFIG_FILE_NAME = 'docma.template.json',
        // Name of content partial  (Dust template)
        // This is for misc content; (such as markdown files
        // converted to HTML), within the `/content` directory of the output.
        // This is also the id of the target element within the partial.
        CONTENT_PARTIAL = 'docma-content',
        // ID of the target element within the content partial.
        CONTENT_ELEM_ID = 'docma-content'; // same as partial name

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    /**
     *  Used for the `.compile` template option. Each key is a target file and
     *  each value is a output file. So we filter the files by extension with
     *  this method.
     *  @private
     *
     *  @param {Object} obj
     *         Object to be filtered.
     *  @param {String} keyExt
     *         File extension to be found in the keys, with the dot. e.g. `".js"`
     *  @param {String} [valExt]
     *         File extension to be found in the values, with the dot.
     *
     *  @returns {Object}
     */
    function _filterByExtension(obj, keyExt, valExt) {
        var o = {};
        valExt = valExt || keyExt;
        _.each(obj || {}, function (value, key) {
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
     *  @param {jQuery} $
     *         jQuery instance.
     *  @param {Array} metaList
     *         List of arbitrary meta objects.
     */
    function _addMetasToDoc($, metaList) {
        if (!_.isArray(metaList) || metaList.length === 0) return;
        var $head = $('head'),
            lastMeta,
            existingMetas = $head.find('meta');
        if (existingMetas.length > 0) {
            lastMeta = existingMetas.eq(existingMetas.length - 1);
        } else {
            lastMeta = HTMLParser.DOMUtil.N_TAB + HTMLParser.DOMUtil.getMetaElem(metaList[0]);
            lastMeta = $head.prepend(lastMeta).find('meta');
            metaList.shift(); // remove first
        }
        metaList.forEach(function (metaInfo) {
            var meta = HTMLParser.DOMUtil.N_TAB + HTMLParser.DOMUtil.getMetaElem(metaInfo);
            lastMeta = $(meta).insertAfter(lastMeta);
        });
    }

    /**
     *  Prepend the given element before the first existing element of same
     *  type. This is generally used for loading Docma assets first (such as
     *  docma-web.js and docma.css).
     *  Update: this is NOT used for scripts anymore, bec. jQuery 2.x duplicates
     *  the scripts. For scripts, we use our
     *  `HTMLParser.DOMUtil.insertBeforefirst()` method instead.
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
        var foundElems = container.find(selector);
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
     *
     *  @param {Object} config
     *         Template configuration.
     *  @param {Object} appConfig
     *         SPA configuration.
     *  @param {Object} paths
     *         Paths of Docma-Web scripts or assets.
     *  @param {Debug} debug
     *         Debug instance.
     */
    function DocmaTemplate(config, appConfig, paths, debug) {
        this.$debug = debug;

        config = _.defaultsDeep(config, {
            path: 'default'
        });

        // if given name or path does not include a sep (/ or \), we'll
        // check if we have a built-in template with that name under
        // `/templates` directory.
        this.src = config.path.indexOf('/') < 0 && config.path.indexOf('\\') < 0
            ? path.join(__dirname, '..', 'templates', config.path)
            : config.path;
        delete config.path;

        if (!fs.existsSync(this.src)) {
            throw new Error('Template path "' + this.src + '" does not exist!');
        }

        // dest existance is already checked by docma.js
        this.dest = config.dest;
        delete config.dest;

        this.configFile = path.join(this.src, CONFIG_FILE_NAME);
        if (!fs.existsSync(this.configFile)) {
            throw new Error('Template configuration file (' + CONFIG_FILE_NAME + ') not found!');
        }

        // merge config file and build config.
        var configFromFile = utils.json.readSync(this.configFile) || {};
        this.config = _.defaultsDeep(config, configFromFile, {
            // conf file defaults
            name: '',
            version: '1.0.0',
            author: '',
            license: '',
            main: 'index.html',
            options: {}
        });

        this.appConfig = appConfig;
        this.paths = paths;
    }

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    /**
     *  Gets template data that will be passed to the document via
     *  `docma.template`.
     *
     *  @returns {Object}
     */
    DocmaTemplate.prototype.getData = function () {
        var data = _.pick(this.config, [
            'name', 'version', 'author', 'license', 'main', 'options'
        ]);
        data.options = data.options || {};
        return data;
    };

    /**
     *  Compiles and writes `.js` files defined in `docma.json` configuration
     *  file. Note that if debug.noMinify is enabled, files are not minifed.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.compileScripts = function () {
        var $this = this;
        $this.$debug.info('Compiling SPA scripts...');

        var minifyConf = _filterByExtension(this.config.compile, '.js'),
            jsFilePaths = Object.keys(minifyConf);
        if (!jsFilePaths.length) return Promise.resolve();
        return Promise.each(jsFilePaths, function (jsFilePath) {
            var targetJs = path.join($this.dest, minifyConf[jsFilePath]);
            jsFilePath = path.join($this.src, jsFilePath);

            $this.$debug.data('Compiling:', jsFilePath);
            return fs.existsAsync(jsFilePath)
                .then(function (exists) {
                    if (!exists) return;
                    if ($this.$debug.noMinify) {
                        return fs.readFileAsync(jsFilePath, 'utf8');
                    }
                    return utils.js.minifyFile(jsFilePath)
                        .then(function (minified) {
                            return minified.code;
                        });
                })
                .then(function (code) {
                    if (!code) return;
                    // creates parent directories if they don't exist
                    return fs.outputFileAsync(targetJs, code, 'utf8');
                });
        });
    };

    /**
     *  Conpiles docma.less file that contains necessary styles for specific
     *  features such as emojis used in markdown files.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.compileDocmaStyles = function () {
        var $this = this,
            compileOpts = {
                filename: path.basename($this.paths.DOCMA_LESS), // less file name not the path
                // paths: [path.resolve(lessDir)],
                compress: !$this.$debug.noMinify
            };
        $this.$debug.data('Compiling:', $this.paths.DOCMA_LESS);
        return utils.less.compileFile($this.paths.DOCMA_LESS, compileOpts)
            .then(function (compiled) {
                if (!compiled) return;
                var targetCss = path.join($this.dest, path.join('css', 'docma.css'));
                // creates parent directories if they don't exist
                return fs.outputFileAsync(targetCss, compiled.css, 'utf8');
            });
    };

    /**
     *  Compiles `.less` files defined in `docma.json` configuration file.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.compileStyles = function () {
        var $this = this;
        $this.$debug.info('Compiling SPA styles...');

        var lessConf = _filterByExtension(this.config.compile, '.less'),
            lessFilePaths = Object.keys(lessConf);
        if (!lessFilePaths.length) return Promise.resolve();
        return Promise.each(lessFilePaths, function (filePath) {
            var targetCss = path.join($this.dest, lessConf[filePath]);
            filePath = path.join($this.src, filePath);
            var compileOpts = {
                filename: path.basename(filePath), // less file name not the path
                // paths: [path.resolve(lessDir)],
                compress: !$this.$debug.noMinify
            };
            return fs.existsAsync(filePath)
                .then(function (exists) {
                    if (!exists) {
                        $this.$debug.warn('Missing Less File:', filePath);
                        return;
                    }
                    $this.$debug.data('Compiling:', filePath);
                    return utils.less.compileFile(filePath, compileOpts);
                })
                .then(function (compiled) {
                    if (!compiled) return;
                    // creates parent directories if they don't exist
                    return fs.outputFileAsync(targetCss, compiled.css, 'utf8');
                })
                .then(function () {
                    $this.compileDocmaStyles();
                });
        });
    };

    /**
     *  Compiles template partials into Dust.js templates.
     *
     *  @returns {String} - Compiled javascript source of partials.
     */
    DocmaTemplate.prototype.compilePartials = function () {
        var $this = this;
        $this.$debug.info('Compiling SPA partials...');

        // glob uses forward slash only. (in Windows too)
        var partials = utils.glob.normalize(this.src, 'partials/**/*.html');
        return utils.glob.match(partials)
            .then(function (files) {
                // Dust-compile all partials
                return Promise.map(files, function (filePath) {
                    $this.$debug.data('Compiling:', filePath);
                    return HTMLParser.fromFile(filePath)
                        .then(function (parser) {
                            var templateContent = parser.removeComments().content;
                            return dust.compile(templateContent, utils.path.basename(filePath));
                        });
                });
            })
            .then(function (results) {
                // Now we check if the template has the optional docma-content partial.
                // if not, we'll create and compile a simple docma-content partial.
                var contentPartialPath = path.join($this.src, 'partials', CONTENT_PARTIAL + '.html');
                return fs.existsAsync(contentPartialPath)
                    .then(function (exists) {
                        if (!exists) {
                            $this.$debug.warn('Missing Content Partial:', contentPartialPath);
                            $this.$debug.data('Creating:', contentPartialPath);
                            var compiled = dust.compile('<div id="' + CONTENT_ELEM_ID + '"></div>', CONTENT_PARTIAL);
                            results.push(compiled);
                        }
                        return results;
                    });
            })
            .then(function (results) {
                results.unshift('/* docma (dust) compiled templates */');
                return results.join('\n');
            });
    };

    /**
     *  Copy all template files to destination directory, except for partials
     *  and less directories.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.copyToDest = function () {
        var $this = this;
        $this.$debug.info('Copying template files/directories...');

        // do not copy the main file (which will be parsed then created at the
        // destination) and partials (which will be compiled into javascript).
        var ignoreList = $this.config.ignore || [];
        ignoreList = ignoreList.concat([
            this.config.main,
            'docma.template.json',
            'partials/**'
        ]);
        // // normalize the globs (glob paths sep should be `/` even in windows.)
        ignoreList = ignoreList.map(function (item) {
            return utils.glob.normalize($this.src, item);
        });

        return utils.glob.match($this.src + '/**/*', { ignore: ignoreList })
        // return utils.glob.match(src, { ignore: ignoreList })
            .then(function (files) {
                var dest;
                return Promise.each(files, function (filePath) {
                    dest = path.join($this.dest, path.relative($this.src, filePath));
                    // if src is a directory, only create the directory at the destination.
                    if (fs.lstatSync(filePath).isDirectory()) {
                        $this.$debug.data('Creating directory:', filePath);
                        return fs.mkdirsAsync(dest);
                    }
                    // otherwise, copy the file to the destination.
                    $this.$debug.data('Copying:', filePath);
                    return fs.copyAsync(filePath, dest);
                    // we don't copy full directories at once bec. in that case,
                    // ignored files will be copied either.
                });
            });
    };

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
    DocmaTemplate.prototype.writeServerConfig = function (routes) {
        var $this = this;
        $this.$debug.info('Evaluating server/host configuration for the SPA...');

        // This is only for "path" routing. For "query" routing, we don't need
        // to redirect paths to main index file, since query-string routing is
        // already done on the main page.
        if ($this.appConfig.routing.method !== 'path') {
            return Promise.resolve();
        }

        if ($this.appConfig.server === 'apache') {
            // If Apache; we'll write an .htaccess file basically for
            // redirecting content paths to the main page, since we're
            // generating a SPA.
            var destHtaccess = path.join($this.dest, '.htaccess');
            $this.$debug.info('Generating Apache config file (.htaccess):', destHtaccess);

            return fs.readFileAsync($this.paths.APACHE_CONF, 'utf8')
                .then(function (content) {
                    var base = $this.appConfig.base;
                    base = _.endsWith('/') ? base : base + '/';
                    var main = $this.config.main,
                        mainEsc = _escapeRegExp($this.config.main);
                    // replace main file and base path placeholders.
                    content = content
                        .replace(/%{DOCMA_MAIN}/g, main)
                        .replace(/%{DOCMA_MAIN_ESC}/g, mainEsc)
                        .replace(/%{DOCMA_BASE}/g, base);
                    return fs.writeFileAsync(destHtaccess, content, 'utf8');
                });
        } else if ($this.appConfig.server === 'github' || $this.appConfig.server === 'static') {
            // GitHub does not support .htaccess or .conf files since it doesn't
            // use Apache or Nginx. So we'll do the same thing as Jekyll
            // (redirect-from) by creating directories and index files for
            // redirecting with http-meta refresh. See
            // https://github.com/jekyll/jekyll-redirect-from

            if (!routes || routes.length === 0) {
                return Promise.resolve();
            }

            $this.$debug.info('Generating indexed directories for GitHub...');

            // read the redirect.html template file into memory.
            return fs.readFileAsync($this.paths.REDIRECT_HTML, 'utf8')
                .then(function (html) {
                    return Promise.each(routes, function (route) {
                        var p = [$this.dest],
                            routeParts = route.path.split('/'),
                            // for /api path backToBase will be '../'
                            // for /api/name path backToBase will be '../../'
                            backToBase = new Array(routeParts.length).join('../');
                        // e.g. /guide or /api/docma-web
                        p = p.concat(routeParts);
                        p.push('index.html');
                        var reIndexFile = path.join.apply(path, p),
                            // replace the redirect content path placeholder
                            // (to be set in sessionStorage) so we can render it
                            // after redirected to the main page.
                            reHtml = html
                                .replace(/%\{BACK_TO_BASE\}/g, backToBase)
                                .replace(/%\{REDIRECT_PATH\}/g, utils.path.removeLeadSlash(route.path));
                        return fs.existsAsync(reIndexFile)
                            .then(function (exists) {
                                if (exists) return;
                                // write the redirecting index file and the
                                // directory if it does not exist.
                                return fs.outputFileAsync(reIndexFile, reHtml, 'utf8');
                            });
                    });
                });
        }
        return Promise.resolve();
    };

    /**
     *  Parses and writes the main HTML file of the template.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.writeMainHTML = function () {
        var $this = this,
            srcMainFile = path.join(this.src, this.config.main),
            destMainFile = path.join(this.dest, this.config.main);

        $this.$debug.info('Writing SPA main file...');

        return HTMLParser.fromFile(srcMainFile)
            .then(function (parser) {
                return parser
                    .removeComments()
                    .edit(function (window) {

                        var $ = window.$,
                            head = $('head'),
                            domUtil = HTMLParser.DOMUtil;

                        // Add meta tags
                        var docmaMeta = {
                                name: 'generator',
                                content: 'Docma - https://github.com/onury/docma'
                            },
                            metas = ($this.appConfig.meta || []).concat([docmaMeta]);
                        _addMetasToDoc($, metas);

                        // DON'T set base or bookmarks won't work
                        if ($this.appConfig.base) {
                            head.prepend('<base href="' + $this.appConfig.base + '" />');
                        }

                        // Set title
                        var title = domUtil.N_TAB + '<title>' + $this.appConfig.title + '</title>' + domUtil.N_TAB;
                        head.find('title').remove().end() // .remove('title') doesn't work
                            .prepend(title);

                        // prepend docma-web.js before any javascript file
                        // var docmaWeb = domUtil.getScriptElem('js/docma-web.js') + domUtil.N_TAB;
                        // we don't use jQuery 2x and _insertBeforeFirst()
                        // for scripts bec. jQuery 2 duplicates the script.
                        domUtil.insertAsFirst(window, 'script', { src: 'js/docma-web.js' });

                        // prepend docma.css before any javascript file
                        var docmaCss = domUtil.getStyleElem('css/docma.css') + domUtil.N_TAB;
                        _insertBeforeFirst(head, 'link[rel=stylesheet]', docmaCss);

                    }, [$this.paths.JQUERY]);
                    // }, ['https://code.jquery.com/jquery.min.js']);
            })
            .then(function (parser) {
                // some simple beautification after editing the document
                return parser.beautify().content;
            })
            .then(function (parsed) {
                $this.$debug.data('Creating:', path.resolve(destMainFile));
                return fs.writeFileAsync(destMainFile, parsed, 'utf8');
            });
    };

    // --------------------------------
    // EXPORT
    // --------------------------------

    return DocmaTemplate;

})();
