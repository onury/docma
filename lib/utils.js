// core modules
var path = require('path');

// dep modules
var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs-extra'),
    uglify = require('uglify-js'),
    stripJsonComments = require('strip-json-comments'),
    less = require('less'),
    LessCleanCssPlugin = require('less-plugin-clean-css');

var glob = Promise.promisify(require('glob'));

module.exports = (function () {

    var utils = {},
        lessCleanCssPlugin = new LessCleanCssPlugin({ advanced: true });

    // e.g.
    // var symbol = { code: { meta: { type: "MethodDefinition" } } };
    // notate(symbol, "code.meta.type") => "MethodDefinition"
    // See https://github.com/onury/notation for an advanced library.
    utils.notate = function (obj, notation) {
        if (typeof obj !== 'object') return;
        // console.log('n', notation);
        var o,
            props = !Array.isArray(notation)
                ? notation.split('.')
                : notation,
            prop = props[0];
        if (!prop) return;
        o = obj[prop];
        if (props.length > 1) {
            props.shift();
            return utils.notate(o, props);
        }
        return o;
    };

    utils.ensureArray = function (o) {
        if (o === undefined || o === null) return o;
        return Array.isArray(o) ? o : [o];
    };

    utils.round = function (num, decimals) {
        if (!decimals) return Math.round(num);
        var factor = decimals * 10;
        return Math.round(num * factor) / factor;
    };

    utils.getContentSize = function (str) {
        var bytes = Buffer.byteLength(str, 'utf8');
        return utils.round(bytes / 1024, 1);
    };

    // ---------------------------
    // glob
    // ---------------------------

    utils.glob = {};

    // glob uses forward slash only. (in Windows too)
    // base is optional.
    utils.glob.normalize = function (base, globPath) {
        globPath = arguments.length === 1 ? base : globPath;
        base = arguments.length === 1 ? '' : base + '/';
        return path.normalize(base + globPath).replace(/\\+/g, '/');
    };

    utils.glob.isNegated = function (pattern) {
        return pattern.slice(0, 1) === '!';
    };

    utils.glob.inspect = function (pattern, options) {
        var negated = utils.glob.isNegated(pattern);
        pattern = negated ? pattern.slice(1) : pattern;
        pattern = utils.glob.normalize(pattern);
        return {
            hasMagic: glob.hasMagic(pattern, options),
            negated: negated,
            pattern: pattern
        };
    };

    /**
     *  Expands the given glob pattern(s) into file-paths array.
     *  This uses the node-glob library but unlike it, this also accepts an
     *  Array input and negated globs are allowed.
     *  @param {String|Array} patterns - One or more patterns to be expanded.
     *  @param {Object} [options] - Glob options.
     *  @returns {Array} - Expanded list of file paths.
     */
    utils.glob.match = function (patterns, options) {
        patterns = utils.ensureArray(patterns);
        options = options || {};

        // normalize ignored globs (glob paths sep should be `/` even in
        // windows.)
        options.ignore = (options.ignore || []).map(function (item) {
            return utils.glob.normalize(item);
        });

        var files = [],
            properPatterns = [];

        // We'll pick negated patterns into the ignore list and proper patterns
        // into a separate array. Also, we'll add non-glob patters (normal file
        // paths) to the final output array; bec. glob() will not process
        // non-glob patterns.
        _.each(patterns, function (p) {
            var g = utils.glob.inspect(p);
            if (g.negated) {
                options.ignore.push(g.pattern);
            } else if (!g.hasMagic) {
                files.push(g.pattern);
            } else {
                properPatterns.push(g.pattern);
            }
        });

        return Promise.each(properPatterns, function (p) {
            return glob(p, options)
                .then(function (expandedFiles) {
                    files = files.concat(expandedFiles);
                });
        })
        // .thenReturn(files); // wrong! returns the result of Promise.each
        .then(function () {
            return files;
        });
    };

    // ---------------------------
    // fs
    // ---------------------------

    utils.fs = Promise.promisifyAll(fs);

    // fs.exists does not conform to the common Node callback
    // signature (i.e. function (err, result) {..}). So instead of
    // using .promisify(), we'll write the long version.
    utils.fs.existsAsync = function (filePath, callback) {
        return new Promise(function (resolve) { // , reject
            fs.exists(filePath, function (exists) {
                resolve(exists);
            });
        }).nodeify(callback);
    };

    // ---------------------------
    // path
    // ---------------------------

    utils.path = {};

    // filename without the extension
    utils.path.basename = function (filepath) {
        var ext = path.extname(filepath);
        return path.basename(filepath, ext);
    };

    utils.path.parent = function (p) {
        p = path.normalize(p);
        var arr = p.split(/[\\\/]+/);
        // remove last item
        arr.splice(-1, 1);
        return arr.join(path.sep);
    };

    utils.path.ensureEndSlash = function (p) {
        return p.slice(-1) !== '/' ? p + '/' : p;
    };

    utils.path.removeEndSlash = function (p) {
        return p.slice(-1) === '/' ? p.slice(0, p.length - 1) : p;
    };

    utils.path.removeLeadSlash = function (p) {
        return p.slice(0, 1) === '/' ? p.slice(1) : p;
    };

    // ---------------------------
    // file
    // ---------------------------

    utils.file = {};

    utils.file.merge = function (fileList) {
        var merged = [];
        // using Promise.each instead of Promise.map, to ensure order guarantee
        // in sequential execution.
        return Promise
            .each(fileList, function (filePath) {
                return fs.readFileAsync(filePath, 'utf8')
                    .then(function (content) {
                        merged.push(content);
                    });
            })
            .then(function () { // (fileList)
                return merged.join('\n');
            });
    };

    // ---------------------------
    // json
    // ---------------------------

    utils.json = {};

    utils.json.read = function (filePath) {
        return fs.readFileAsync(filePath, 'utf8')
            .then(function (string) {
                return JSON.parse(stripJsonComments(string));
            });
    };

    utils.json.readSync = function (filePath) {
        var string = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(stripJsonComments(string));
    };

    utils.json.write = function (object, filePath) {
        var json = JSON.stringify(object, null, '  ');
        return utils.file.write(filePath, json, 'utf8');
    };

    utils.json.removeComments = function (string) {
        return stripJsonComments(string);
    };

    // ---------------------------
    // script
    // ---------------------------

    utils.js = {};

    var defaultMinifyOpts = {
        output: {
            // only output the commets with a @license directive
            comments: /@license/g
        }
    };

    utils.js.minify = function (strScript, options) {
        options = _.extend(defaultMinifyOpts, options);
        options.fromString = true;
        options.compress = true;
        return uglify.minify(strScript, options);
        // returns { code, map }
    };

    utils.js.minifyFile = function (filePath, options) {
        options = _.extend(defaultMinifyOpts, options);
        options.fromString = false;
        options.compress = true;
        return fs.readFileAsync(filePath, 'utf8')
            .then(function (strScript) {
                return utils.js.minify(strScript, options);
                // returns { code, map }
            });
    };

    // ---------------------------
    // less
    // ---------------------------

    utils.less = {};

    // http://lesscss.org/usage/#programmatic-usage
    // http://onedayitwillmake.com/blog/2013/03/compiling-less-from-a-node-js-script/
    // http://lesscss.org/#using-less-command-line-usage

    var defaultLessOpts = {
        // root .less file name (not the path).
        // filename: 'styles.less',
        // optimization level, higher is better but more volatile - 1 is a
        // good value.
        optimization: 1,
        // minify output css
        compress: true,
        // use YUI compressor?
        yuicompress: true,
        // additional paths to look for imported less files.
        paths: [],
        // less plugins
        plugins: []
    };

    utils.less.compile = function (strLess, options) {
        options = _.defaults(options, defaultLessOpts);
        // also pass lessCleanCssPlugin if compress enabled.
        if (options.compress) options.plugins.push(lessCleanCssPlugin);
        // http://lesscss.org/usage/#programmatic-usage
        return less.render(strLess, options);
        // returns { css, map, imports }
    };

    // filePath: root .less file path.
    utils.less.compileFile = function (filePath, options) {
        options = options || {};
        return fs.readFileAsync(filePath, 'utf8')
            .then(function (strLess) {
                var parentDir = path.resolve(path.dirname(filePath));
                // http://lesscss.org/usage/#programmatic-usage
                options.filename = path.basename(filePath);
                options.paths = (options.paths || []).concat([parentDir]);
                return utils.less.compile(strLess, options);
            });
            // returns { css, map, imports }
    };

    return utils;

})();
