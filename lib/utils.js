'use strict';

// core modules
const Path = require('path');

// dep modules
const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs-extra');
const marked = require('marked');
const uglify = require('uglify-js');
const stripJsonComments = require('strip-json-comments');
const Less = require('less');
const LessCleanCssPlugin = require('less-plugin-clean-css');
const gzipSize = require('gzip-size');

const GLOB = Promise.promisify(require('glob'));
const lessCleanCssPlugin = new LessCleanCssPlugin({ advanced: true });

const INVALID = {
    // https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file
    WINDOWS: {
        CHARS: /[<>:"\\|?*]/, // char / is left out (allowed in Docma as path separator)
        NAME: /^(nul|prn|aux|con|lpt[0-9]|com[0-9]|(clock|keybd|screen|idle|config)\$)(\.|$)/i,
        MAX_LEN: 260 - 12
    },
    // https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
    // https://blog.josephscott.org/2007/02/12/things-that-shouldnt-be-in-file-names-for-1000-alex/
    UNIX: {
        CHARS: /[\\|?*]/, // char / is left out (allowed in Docma as path separator)
        NAME: /^[.]+$/,
        MAX_LEN: 255
    }
};

let utils = null;

// ---------------------------
// Helpers
// ---------------------------

// used for utils._findDocmaConfigFileSync()
function getFileSync(filename, basePath = null) {
    const cPath = Path.resolve(Path.join(basePath || process.cwd(), filename));
    return fs.pathExistsSync(cPath) ? cPath : null;
}

// ---------------------------
// path
// ---------------------------

const path = {
    // filename without the extension
    basename(filepath) {
        const ext = Path.extname(filepath);
        return Path.basename(filepath, ext);
    },
    parent(p) {
        p = Path.normalize(p);
        const arr = p.split(/[\\/]+/);
        // remove last item
        arr.splice(-1, 1);
        return arr.join(Path.sep);
    },
    ensureLeadSlash(p, slash) {
        if (slash === undefined) slash = '/';
        return /^[\\/]/.test(p) === false ? `${slash}${p}` : p;
    },
    ensureEndSlash(p, slash) {
        if (slash === undefined) slash = '/';
        return /[\\/]$/.test(p) === false ? `${p}${slash}` : p;
    },
    removeEndSlash(p) {
        return p.replace(/[\\/]$/, '');
    },
    removeLeadSlash(p) {
        return p.replace(/^[\\/]/, '');
    },
    parentOfBase(p, base) {
        p = Path.normalize(path.removeEndSlash(p));
        if (!base) return p;
        base = Path.normalize(path.removeEndSlash(base));
        return p.slice(-base.length) === base
            ? p.slice(0, -base.length)
            : p;
    },
    hasValidName(p, windows) {
        const re = windows ? INVALID.WINDOWS : INVALID.UNIX;
        return p
            && p.trim() !== ''
            && !(/(^[. ]|[. ]$)/).test(p) // cannot start or end with dot or space
            && !re.CHARS.test(p)
            && !re.NAME.test(p)
            && p.length <= re.MAX_LEN;
    }
};

// ---------------------------
// fs
// ---------------------------

const _fs = {
    // currently, this method is not used.
    // mergeFiles(fileList) {
    //     const merged = [];
    //     // using Promise.each instead of Promise.map, to ensure order guarantee
    //     // in sequential execution.
    //     return Promise
    //         .each(fileList, filePath => {
    //             return fs.readFile(filePath, 'utf8')
    //                 .then(content => {
    //                     merged.push(content);
    //                 });
    //         })
    //         .then(() => { // (fileList)
    //             return merged.join('\n');
    //         });
    // },
    isEmptyDir(dirPath) {
        return Promise.resolve(fs.readdir(dirPath)) // wrap with Bluebird
            .then(files => !files.length);
    }
};

// ---------------------------
// json
// ---------------------------

const json = {
    read(filePath) {
        return fs.readFile(filePath, 'utf8')
            .then(string => JSON.parse(stripJsonComments(string)));
    },
    readSync(filePath) {
        const string = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(stripJsonComments(string));
    },
    write(object, filePath) {
        const json = JSON.stringify(object, null, '  ');
        return fs.writeFile(filePath, json, 'utf8');
    },
    removeComments(string) {
        return stripJsonComments(string);
    }
};

// ---------------------------
// script / js
// ---------------------------

// https://github.com/mishoo/UglifyJS2
const defaultMinifyOpts = {
    compress: {},
    output: {
        // only output the commets with a @license directive
        comments: /@license/g
    }
};

const js = {
    minify(strScript, options = {}) {
        const opts = _.extend({}, defaultMinifyOpts, options);
        const minified = uglify.minify(strScript, opts);
        if (minified.error instanceof Error) throw minified.error;
        return minified;
        // returns { code, map }
    },
    minifyFile(filePath, options = {}) {
        const opts = _.extend({}, defaultMinifyOpts, options);
        return fs.readFile(filePath, 'utf8')
            .then(strScript => js.minify(strScript, opts)); // returns { code, map }
    },
    /**
     *  Gets the file path for the minified version of the given file.
     *
     *  @param {String} filePath - Path of the original (unminified) file.
     *
     *  @returns {String} - Path of the minified version.
     */
    getMinPath(filePath) {
        const fPath = filePath.toLowerCase();
        if (_.endsWith(fPath, '.min.js')) return fPath;
        return Path.join(Path.dirname(fPath), `${Path.basename(fPath, '.js')}.min.js`);
    },
    /**
     *  Reads the given JS file into memory.
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
    readFile(filePath, noMinify = false, checkMinFile = false) {
        if (noMinify) return fs.readFile(filePath, 'utf8');

        if (!checkMinFile) {
            return js.minifyFile(filePath).then(minified => minified.code);
        }
        const minFilePath = js.getMinPath(filePath);
        return fs.pathExists(minFilePath)
            .then(exists => {
                if (exists) return fs.readFile(minFilePath, 'utf8');
                return js.minifyFile(filePath).then(minified => minified.code);
            });
    }
};

// ---------------------------
// Markdown
// ---------------------------

const md = {
    /**
     *  Parses the given markdown content.
     *
     *  @param {String} string - Markdown content.
     *  @param {Object} [options] - Markdown options for `marked`.
     *
     *  @returns {Promise} - Promise that returns the markdown, parsed to HTML.
     */
    parse(string, options = {}) {
        return new Promise((resolve, reject) => {
            marked(string, options, (err, content) => {
                if (err) return reject(err);
                resolve(content);
            });
        });
    }
};

// ---------------------------
// glob
// ---------------------------

const glob = {
    // glob uses forward slash only. (in Windows too)
    // base is optional.
    normalize(base, globPath) {
        const gpSet = utils.isset(globPath);
        if (!gpSet) {
            globPath = base;
            base = '';
        } else {
            base += '/';
        }
        return Path.normalize(base + globPath).replace(/\\+/g, '/');
    },

    isNegated(pattern) {
        return pattern.slice(0, 1) === '!';
    },

    inspect(pattern, options = {}) {
        const negated = glob.isNegated(pattern);
        pattern = negated ? pattern.slice(1) : pattern;
        pattern = glob.normalize(pattern);
        return {
            hasMagic: GLOB.hasMagic(pattern, options),
            negated,
            pattern
        };
    },

    /**
     *  Expands the given glob pattern(s) into file-paths array.
     *  This uses the node-glob library but unlike it, this also accepts an
     *  Array input and negated globs are allowed.
     *  @param {String|Array} patterns - One or more patterns to be expanded.
     *  @param {Object} [options] - Glob options.
     *  @returns {Array} - Expanded list of file paths.
     */
    match(patterns, options = {}) {
        patterns = utils.ensureArray(patterns);

        // normalize ignored globs (glob paths sep should be `/` even in
        // windows.)
        options.ignore = (options.ignore || []).map(item => {
            return glob.normalize(item);
        });

        let files = [];
        const properPatterns = [];

        // We'll pick negated patterns into the ignore list and proper patterns
        // into a separate array. Also, we'll add non-glob patters (normal file
        // paths) to the final output array; bec. glob() will not process
        // non-glob patterns.
        _.each(patterns, p => {
            const g = glob.inspect(p);
            if (g.negated) {
                options.ignore.push(g.pattern);
            } else if (!g.hasMagic) {
                files.push(g.pattern);
            } else {
                properPatterns.push(g.pattern);
            }
        });

        return Promise.each(properPatterns, p => {
            return GLOB(p, options) // eslint-disable-line
                .then(expandedFiles => {
                    files = files.concat(expandedFiles);
                });
        }).then(() => files);
        // .thenReturn(files); // wrong! returns the result of Promise.each
    }
};

// ---------------------------
// less
// ---------------------------

// http://lesscss.org/usage/#programmatic-usage
// http://onedayitwillmake.com/blog/2013/03/compiling-less-from-a-node-js-script/
// http://lesscss.org/#using-less-command-line-usage

const defaultLessOpts = {
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

const less = {
    updateOptions(options = {}, filePath = null) {
        const opts = _.defaults(options, defaultLessOpts);
        // also pass lessCleanCssPlugin if compress enabled.
        if (options.compress) options.plugins.push(lessCleanCssPlugin);
        if (filePath) {
            const parentDir = Path.resolve(Path.dirname(filePath));
            // http://lesscss.org/usage/#programmatic-usage
            opts.filename = Path.basename(filePath); // less file name not the path
            opts.paths = (opts.paths || []).concat([parentDir]);
        }
        return opts;
    },
    compile(strLess, options) {
        // convert promise to Bluebird promise.
        return Promise.resolve(Less.render(strLess, options));
        // resolves { css, map, imports }
    },
    // filePath: root .less file path.
    compileFile(filePath, options) {
        return fs.readFile(filePath, 'utf8')
            .then(strLess => {
                return less.compile(strLess, options);
            });
        // resolves { css, map, imports }
    }
};

// ---------------------------
// utils export
// ---------------------------

utils = {
    isset(value) {
        return value !== undefined && value !== null;
    },
    type(obj) {
        return Object.prototype.toString.call(obj).match(/\s(\w+)/i)[1].toLowerCase();
    },
    // e.g.
    // let symbol = { code: { meta: { type: "MethodDefinition" } } };
    // notate(symbol, "code.meta.type") => "MethodDefinition"
    // See https://github.com/onury/notation for an advanced library.
    notate(obj, notation) {
        if (typeof obj !== 'object') return;
        // console.log('n', notation);
        const props = !Array.isArray(notation)
            ? notation.split('.')
            : notation;
        const prop = props[0];
        if (!prop) return;
        const o = obj[prop];
        if (props.length > 1) {
            props.shift();
            return utils.notate(o, props);
        }
        return o;
    },
    ensureArray(o) {
        if (o === undefined || o === null) return o;
        return Array.isArray(o) ? o : [o];
    },
    round(num, decimals = 0) {
        if (!decimals) return Math.round(num);
        const factor = decimals * 10;
        return Math.round(num * factor) / factor;
    },
    // in KB
    getContentSize(str, gzipped = false) {
        const bytes = gzipped
            ? gzipSize.sync(str)
            : Buffer.byteLength(str, 'utf8');
        return utils.round(bytes / 1024, 1);
    },
    safeRequire(name) {
        try {
            return require(name);
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND' && err.message.indexOf(name) !== -1) {
                return undefined;
            }
            throw err;
        }
    },
    removeNewLines(string, replaceWith = '') {
        return (string || '').replace(/[\r\n]+/, replaceWith);
    },
    /**
     *  Gets a safe string ID value from the given string.
     *
     *  @param {String} [str] - String to be converted.
     *
     *  @returns {String} -
     */
    idify(str) {
        return str.trim()
            .replace(/[.,;'"`]/g, '')
            .replace(/[^a-z0-9$_]/gi, '-')
            .toLowerCase();
    },
    /**
     *  Used by CLI. Attempts to find a Docma config file with one of the
     *  default names.
     *  @private
     *
     *  @param {String} [basePath=process.cwd()] - Base directory path to search
     *  in.
     *
     *  @returns {String} - `null` if not found.
     */
    _findDocmaConfigFileSync(basePath = null) {
        return getFileSync('docma.json', basePath)
            || getFileSync('.docma.json', basePath)
            || getFileSync('.docma', basePath);
    },
    path,
    fs: _fs,
    js,
    json,
    md,
    glob,
    less
};

module.exports = utils;
