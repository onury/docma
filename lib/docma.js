
// core modules
var path = require('path');

// dep modules
var _ = require('lodash'),
    Promise = require('bluebird'),
    jsdocx = require('jsdoc-x'),
    glob = require('glob');

// own modules
var DocmaTemplate = require('./docma.template'),
    utils = require('./utils');

module.exports = (function () {

    var fs = utils.fs;
    glob = Promise.promisify(glob);

    // --------------------------------
    // CLASS: Docma
    // --------------------------------

    function Docma(config) {
        this.docData = [];
        if (!config.src) {
            throw new Error('Path of the source code is not defined.');
        }
        if (!config.dest) {
            throw new Error('Destination directory is not set.');
        }
        this.config = _.defaultsDeep(config, {
            template: {
                document: {
                    title: ''
                }
            },
            // create an extra json file
            // boolean or name of the json file
            dump: true,
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
            }
        });

        var templateConf = _.defaultsDeep(this.config.template, {
            dest: config.dest
        });
        this._template = new DocmaTemplate(templateConf);
    }

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    function _getSymbolNames(data, menu) {
        menu = menu || [];
        var codeName;
        data.forEach(function (symbol) {
            codeName = utils.notate(symbol, 'meta.code.name') || symbol.longname;
            menu.push(codeName);
            if (!symbol.isEnum && symbol.$members) {
                menu = _getSymbolNames(symbol.$members, menu);
            }
        });
        return menu;
    }

    // --------------------------------
    // INSTANCE METHODS
    // --------------------------------

    // builds a flat array of symbol names. this can be used for building menus,
    // etc... This is passed to the document as `docma.symbols`.
    Docma.prototype._getSymbolNames = function () {
        return _getSymbolNames(this.docData);
    };

    Docma.prototype._compileWebCore = function () {
        var self = this,
            jsDest = path.join(this.config.dest, 'js'),
            jsSrc = path.join(__dirname, 'web'),
            dustFiles = [
                path.join(jsSrc, 'dust-core.min.js'),
                path.join(jsSrc, 'dust-helpers.min.js')
            ],
            webFiles = [
                path.join(jsSrc, 'docma.web.utils.js'),
                path.join(jsSrc, 'docma.web.filters.js'),
                path.join(jsSrc, 'docma.web.core.js')
            ];
        return fs.ensureDirAsync(jsDest)
            // binding an object to keep state/results through the promise chain
            // instead of a higher scope variable.
            // http://stackoverflow.com/a/28250700/112731
            .bind({ docmaWeb: [] })
            .then(function () {
                // read and merge core scripts
                return utils.file.merge(dustFiles);
            })
            .then(function (mergedScripts) {
                // add merged scripts to docmaWeb array
                this.docmaWeb.push(mergedScripts);
                // dust-compile partial html files
                return self._template.compilePartials();
            })
            .then(function (dustTemplates) {
                // add dust templates to docmaWeb
                this.docmaWeb.push(dustTemplates);
                // create docma object to be passed to the template
                var dm = {
                    // pass documentation and symbol list to document.
                    documentation: self.docData,
                    symbols: self._getSymbolNames(),
                    // pass template data to document. template name, title,
                    // options, etc...
                    template: self._template.getData() || {}
                };
                this.docmaWeb.push('/*!\n * Docma (Web) Core\n * https://github.com/onury/docma\n * @license MIT\n */');
                this.docmaWeb.push('var docma = ' + JSON.stringify(dm) + ';');
                // read & minify docma web files
                var $this = this;
                return Promise.each(webFiles, function (file) {
                    return utils.js.minifyFile(file)
                        .then(function (minified) {
                            return $this.docmaWeb.push(minified.code);
                        });
                });
            })
            .then(function () {
                this.docmaWeb = this.docmaWeb.join('\n');
                var d = path.join(jsDest, 'docma-web.js');
                return fs.writeFileAsync(d, this.docmaWeb, 'utf8');
            });
    };

    Docma.prototype.parseDocs = function () {
        var jdxOpts = _.extend({
            files: this.config.src
        }, this.config.jsdoc);

        if (this.config.dump) {
            jdxOpts.output = {
                path: path.join(this.config.dest, 'documentation.json'),
                indent: 2,
                force: false
            };
        }
        return jsdocx.parse(jdxOpts);
    };

    Docma.prototype.build = function (callback) {
        var self = this;
        return fs.ensureDirAsync(self.config.dest)
            .then(function () {
                return fs.emptyDirAsync(self.config.dest);
            })
            .then(function () {
                return self.parseDocs();
            })
            .then(function (docData) {
                self.docData = docData;
                // order is not guaranteed and doesn't matter here.
                return Promise.all([
                    self._compileWebCore(),
                    self._template.copyToDest(),
                    self._template.compileStyles(),
                    self._template.minifyScripts(),
                    self._template.writeMainHTML()
                ]);
            })
            .then(function () {
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
    Docma.init = Docma.create;

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
