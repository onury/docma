
// core modules
var path = require('path');

// dep modules
var _ = require('lodash'),
    Promise = require('bluebird'),
    dust = require('dustjs-linkedin'),
    glob = require('glob');

// own modules
var utils = require('./utils'),
    HTMLParser = require('./html-parser');

module.exports = (function () {

    var fs = utils.fs;
    glob = Promise.promisify(glob);

    var CONFIG_FILE_NAME = 'docma.template.json',
        N_TAB = '\n    ';

    // --------------------------------
    // CLASS: DocmaTemplate
    // --------------------------------

    /**
     *  Class that processes and compiles the given Docma template.
     *  @class
     *
     *  @param {Object} config - Template configuration.
     */
    function DocmaTemplate(config) {
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

        // this is already checked by docma.js
        this.dest = config.dest;
        delete config.dest;

        this.configFile = path.join(this.src, CONFIG_FILE_NAME);
        if (!fs.existsSync(this.configFile)) {
            throw new Error('Template configuration file (docma.json) not found!');
        }

        // merge config file and build config.
        var conf = utils.json.readSync(this.configFile) || {};
        this.config = _.defaultsDeep(config, conf, {
            // conf file defaults
            name: '',
            version: '1.0.0',
            author: '',
            license: '',
            main: 'index.html',
            // build conf defaults
            document: {
                title: ''
            },
            options: {}
        });
    }

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    // Used for the `.compile` template option. Each key is a target file and
    // each value is a output file. So we filter the files by extension with
    // this method.
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

    function _addMetasToDoc($, metaList) {
        if (!Array.isArray(metaList) || metaList.length === 0) return;
        var $head = $('head'),
            lastMeta,
            existingMetas = $head.find('meta');
        if (existingMetas.length > 0) {
            lastMeta = existingMetas.eq(existingMetas.length - 1);
        } else {
            lastMeta = N_TAB + HTMLParser.DOMUtil.getMetaElem(metaList[0]);
            lastMeta = $head.prepend(lastMeta).find('meta');
            metaList.shift(); // remove first
        }
        metaList.forEach(function (metaInfo) {
            var meta = N_TAB + HTMLParser.DOMUtil.getMetaElem(metaInfo);
            lastMeta = $(meta).insertAfter(lastMeta);
        });
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
            'name', 'version', 'author', 'license', 'document', 'options'
        ]);
        data.options = data.options || {};
        return data;
    };

    /**
     *  Compiles `.less` files defined in `docma.json` configuration file.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.minifyScripts = function () {
        var $this = this,
            minifyConf = _filterByExtension(this.config.compile, '.js'),
            jsFilePaths = Object.keys(minifyConf);
        if (!jsFilePaths.length) return Promise.resolve();
        return Promise.each(jsFilePaths, function (jsFilePath) {
            var targetJs = path.join($this.dest, minifyConf[jsFilePath]);
            jsFilePath = path.join($this.src, jsFilePath);
            return utils.fs.existsAsync(jsFilePath)
                .then(function (exists) {
                    if (!exists) return;
                    return utils.js.minifyFile(jsFilePath);
                })
                .then(function (minifed) {
                    if (!minifed) return;
                    var parent = utils.path.parent(targetJs);
                    return fs.ensureDirAsync(parent)
                        .then(function () {
                            return fs.writeFileAsync(targetJs, minifed.code, 'utf8');
                        });
                });
        });
    };

    /**
     *  Compiles `.less` files defined in `docma.json` configuration file.
     *
     *  @returns {Promise}
     */
    DocmaTemplate.prototype.compileStyles = function () {
        var $this = this,
            lessConf = _filterByExtension(this.config.compile, '.less'),
            lessFilePaths = Object.keys(lessConf);
        if (!lessFilePaths.length) return Promise.resolve();
        return Promise.each(lessFilePaths, function (filePath) {
            var targetCss = path.join($this.dest, lessConf[filePath]);
            filePath = path.join($this.src, filePath);
            return utils.fs.existsAsync(filePath)
                .then(function (exists) {
                    if (!exists) return;
                    var compileOpts = {
                        filename: path.basename(filePath) // less file name not the path
                        // , paths: [path.resolve(lessDir)]
                    };
                    return utils.less.compileFile(filePath, compileOpts);
                })
                .then(function (compiled) {
                    if (!compiled) return;
                    var parent = utils.path.parent(targetCss);
                    return fs.ensureDirAsync(parent)
                        .then(function () {
                            return fs.writeFileAsync(targetCss, compiled.css, 'utf8');
                        });
                });
        });
    };

    /**
     *  Compiles template partials into Dust.js templates.
     *
     *  @returns {String} - Compiled javascript source of partials.
     */
    DocmaTemplate.prototype.compilePartials = function () {
        // glob uses forward slash only. (in Windows too)
        var partials = utils.normalizeGlob(this.src, 'partials/**/*.html');
        return glob(partials)
            .then(function (files) {
                return Promise.map(files, function (filePath) {
                    // console.log(filePath, utils.path.basename(filePath));
                    return HTMLParser.fromFile(filePath)
                        .then(function (parser) {
                            var templateContent = parser.removeComments().content;
                            return dust.compile(templateContent, utils.path.basename(filePath));
                        });
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
        var $this = this,
            src = utils.normalizeGlob($this.src, '/**/*'),
            ignoreList = $this.config.ignore || [];
        // do not copy the main file (which will be parsed then created at the
        // destination) and partials (which will be compiled into javascript).
        ignoreList = ignoreList.concat([
            this.config.main,
            'docma.template.json',
            'partials/**'
        ]);
        // normalize the globs (glob paths sep should be `/` even in windows.)
        ignoreList = ignoreList.map(function (item) {
            item = item.replace(/^\.\\/, ''); // remove leading ./
            return utils.normalizeGlob($this.src, item);
        });
        return glob(src, { ignore: ignoreList })
            .then(function (files) {
                var dest;
                return Promise.each(files, function (filePath) {
                    dest = path.join($this.dest, path.relative($this.src, filePath));
                    // if src is a directory, only create the directory at the destination.
                    if (fs.lstatSync(filePath).isDirectory()) {
                        return fs.mkdirsAsync(dest);
                    }
                    // otherwise, copy the file to the destination.
                    return fs.copyAsync(filePath, dest);
                    // we don't copy full directories at once bec. in that case,
                    // ignored files will be copied either.
                });
            });
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

        return HTMLParser.fromFile(srcMainFile)
            .then(function (parser) {
                return parser.removeComments().edit(function (window) {

                    var $ = window.$,
                        head = $('head');

                    // Add meta tags
                    var docmaMeta = {
                            name: 'generator',
                            content: 'Docma - https://github.com/onury/docma'
                        },
                        metas = ($this.config.document.meta || []).concat([docmaMeta]);
                    _addMetasToDoc($, metas);

                    // Set title
                    var title = N_TAB + '<title>' + $this.config.document.title + '</title>' + N_TAB;
                    head.find('title').remove().end() // .remove('title') doesn't work
                        .prepend(title);

                    // prepend docma-web.js before any javascript file
                    var docmaWeb = HTMLParser.DOMUtil.getScriptElem('js/docma-web.js') + N_TAB,
                        firstScript = head.find('script').eq(0);
                    if (firstScript.length > 0) {
                        firstScript.before(docmaWeb);
                    } else {
                        head.append(docmaWeb);
                    }

                }, [HTMLParser.URL.JQUERY]); // temporary scripts
            })
            .then(function (parser) {
                return parser.content
                    // some beautification after editing the document
                    .replace(/(<html>)(<)/i, '$1\n$2')
                    .replace(/(<\/body>)(<)/i, '$1\n$2')
                    .replace(/(>)(<meta)/gi, '$1' + N_TAB + '$2');
            })
            .then(function (parsed) {
                return fs.writeFileAsync(destMainFile, parsed, 'utf8');
            });
    };

    // --------------------------------
    // EXPORT
    // --------------------------------

    return DocmaTemplate;

})();
