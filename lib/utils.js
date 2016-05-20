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

    // glob uses forward slash only. (in Windows too)
    // base is optional.
    utils.normalizeGlob = function (base, globPath) {
        globPath = arguments.length === 1 ? base : globPath;
        base = arguments.length === 1 ? '' : base;
        base.replace(/[\\/]+$/, '');
        globPath.replace(/^[\\/]+/, '');
        return (base + '/' + globPath).replace(/\\+/g, '/');
    };

    // ---------------------------
    // fs
    // ---------------------------

    utils.fs = Promise.promisifyAll(fs);

    // fs.exists does not conform to the common Node callback
    // signature (i.e. function (err, result) {..}). So instead of
    // using .promisify(), we'll write the long version.
    utils.fs.existsAsync = function (filePath, callback) {
        return new Promise(function (resolve, reject) {
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
            .then(function (fileList) {
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
        plugins: [lessCleanCssPlugin]
    };

    utils.less.compile = function (strLess, options) {
        options = _.extend(defaultLessOpts, options);
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
