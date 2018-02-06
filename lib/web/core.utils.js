/* global docma */
/* eslint max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// docma.utils
// https://github.com/onury/docma

'use strict';

/**
 *  Utilities for inspecting JSDoc documentation and symbols; and parsing
 *  documentation data into proper HTML.
 *  @name docma.utils
 *  @type {Object}
 *  @namespace
 */
(function () {

    var utils = {};

    function getStr(value) {
        return value && value.trim() !== '' ? value : null;
    }

    // cleans the given symbol name.
    // e.g. <anonymous>~obj.doStuff —> obj.doStuff
    function cleanName(name) {
        return (name || '').replace(/([^>]+>)?~?(.*)/, '$2')
            .replace(/^(module\.)?exports\./, '');
    }

    function getMetaCodeName(symbol) {
        return cleanName(utils.notate(symbol, 'meta.code.name') || '');
    }

    function identity(o) {
        return o;
    }

    /**
     *  Gets the value of the target property by the given dot
     *  {@link https://github.com/onury/notation|notation}.
     *  @memberof docma.utils
     *  @name notate
     *  @function
     *
     *  @param {Object} obj - Source object.
     *  @param {String} notation - Path of the property in dot-notation.
     *
     *  @returns {*} - The value of the notation. If the given notation does
     *  not exist, safely returns `undefined`.
     *
     *  @example
     *  var symbol = { code: { meta: { type: "MethodDefinition" } } };
     *  docma.utils.notate(symbol, "code.meta.type"); // returns "MethodDefinition"
     */
    utils.notate = function (obj, notation) {
        if (typeof obj !== 'object') return;
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

    /**
     *  Gets the short name of the given symbol.
     *  JSDoc overwrites the `longname` and `name` of the symbol, if it has an
     *  alias. This returns the correct short name.
     *  @memberof docma.utils
     *  @name getName
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {String}
     */
    utils.getName = function (symbol) {
        // if @alias is set, the original (long) name is only found at meta.code.name
        if (symbol.alias) {
            var codeName = getMetaCodeName(symbol);
            if (codeName) return codeName.replace(/.*?[#.~:](\w+)$/i, '$1');
        }
        return symbol.name;
    };

    /**
     *  Gets the original long name of the given symbol.
     *  JSDoc overwrites the `longname` and `name` of the symbol, if it has an
     *  alias. This returns the correct long name.
     *  @memberof docma.utils
     *  @name getLongName
     *  @function
     *  @alias getFullName
     *  @static
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {String}
     */
    utils.getLongName = function (symbol) {
        var longName = cleanName(symbol.longname);
        var metaCodeName = getMetaCodeName(symbol) || longName;
        var memberOf = cleanName(symbol.memberof || '');

        // JSDoc bug: if the constructor is not marked with @constructs, the
        // longname is incorrect. e.g. `ClassName#ClassName`. So we return
        // (clean) meta.code.name in this case. e.g. `ClassName`
        if (symbol.name === memberOf && utils.isConstructor(symbol)) {
            return metaCodeName;
        }

        // if @alias is set, the original (long) name is generally found at
        // meta.code.name
        var codeName = symbol.alias ? metaCodeName : longName;

        if (!memberOf) return codeName;
        var re = new RegExp('^' + memberOf + '[#\\.~:]'),
            dot = symbol.scope === 'instance' ? '#' : '.';

        return re.test(codeName) ? codeName : memberOf + dot + codeName;
    };
    utils.getFullName = utils.getLongName;

    /**
     *  Gets the code name of the given symbol.
     *  @memberof docma.utils
     *  @name getCodeName
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {String} - If no code name, falls back to long name.
     */
    utils.getCodeName = function (symbol) {
        return getMetaCodeName(symbol) || utils.getLongName(symbol);
    };

    /**
     *  Gets the first matching symbol by the given name.
     *  @memberof docma.utils
     *  @name getSymbolByName
     *  @function
     *
     *  @param {Array} docs - Documentation symbols array.
     *  @param {String} name - Symbol name to be checked.
     *  @returns {Object} - Symbol object if found. Otherwise, returns `null`.
     */
    utils.getSymbolByName = function (docs, name) {
        var i, symbol;
        for (i = 0; i < docs.length; i++) {
            symbol = docs[i];
            if (symbol.name === name
                    || symbol.longname === name
                    || utils.getFullName(symbol) === name) {
                return symbol;
            }
            if (symbol.$members) {
                var sym = utils.getSymbolByName(symbol.$members, name);
                if (sym) return sym;
            }
        }
        return null;
    };

    /**
     *  Checks whether the given symbol is deprecated.
     *  @memberof docma.utils
     *  @name isDeprecated
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isDeprecated = function (symbol) {
        return symbol.deprecated;
    };

    /**
     *  Checks whether the given symbol has global scope.
     *  @memberof docma.utils
     *  @name isGlobal
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isGlobal = function (symbol) {
        return symbol.scope === 'global';
    };

    /**
     *  Checks whether the given symbol is a namespace.
     *  @memberof docma.utils
     *  @name isNamespace
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isNamespace = function (symbol) {
        return symbol.kind === 'namespace';
    };

    /**
     *  Checks whether the given symbol is a module.
     *  @memberof docma.utils
     *  @name isModule
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isModule = function (symbol) {
        return symbol.kind === 'module';
    };

    /**
     *  Checks whether the given symbol is a class.
     *  @memberof docma.utils
     *  @name isClass
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isClass = function (symbol) {
        return !utils.isConstructor(symbol)
            && (symbol.kind === 'class'
                || utils.notate(symbol, 'meta.code.type') === 'ClassDeclaration');
    };

    /**
     *  Checks whether the given symbol is a constructor.
     *  @memberof docma.utils
     *  @name isConstructor
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isConstructor = function (symbol) {
        return symbol.kind === 'class'
            && utils.notate(symbol, 'meta.code.type') === 'MethodDefinition';
    };

    /**
     *  Checks whether the given symbol is a static member.
     *  @memberof docma.utils
     *  @name isStaticMember
     *  @function
     *  @alias isStatic
     *  @static
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticMember = function (symbol) {
        return symbol.scope === 'static';
    };
    /**
     *  Alias for `utils.isStaticMember`
     *  @private
     */
    utils.isStatic = utils.isStaticMember;

    /**
     *  Checks whether the given symbol has an inner scope.
     *  @memberof docma.utils
     *  @name isInner
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInner = function (symbol) {
        return symbol.scope === 'inner';
    };

    /**
     *  Checks whether the given symbol is an instance member.
     *  @memberof docma.utils
     *  @name isInstanceMember
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceMember = function (symbol) {
        return symbol.scope === 'instance';
    };

    /**
     *  Checks whether the given symbol is a method (function).
     *  @memberof docma.utils
     *  @name isMethod
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isMethod = function (symbol) {
        var codeType = utils.notate(symbol, 'meta.code.type');
        return symbol.kind === 'function'
            || (codeType === 'MethodDefinition' || codeType === 'FunctionExpression');
    };
    utils.isFunction = utils.isMethod;

    /**
     *  Checks whether the given symbol is an instance method.
     *  @memberof docma.utils
     *  @name isInstanceMethod
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceMethod = function (symbol) {
        return utils.isInstanceMember(symbol) && utils.isMethod(symbol);
    };

    /**
     *  Checks whether the given symbol is a static method.
     *  @memberof docma.utils
     *  @name isStaticMethod
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticMethod = function (symbol) {
        return utils.isStaticMember(symbol) && utils.isMethod(symbol);
    };

    /**
     *  Checks whether the given symbol is a property.
     *  @memberof docma.utils
     *  @name isProperty
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isProperty = function (symbol) {
        return symbol.kind === 'member';
        // && notate(symbol, 'meta.code.type') === 'MethodDefinition';
    };

    /**
     *  Checks whether the given symbol is an instance property.
     *  @memberof docma.utils
     *  @name isInstanceProperty
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceProperty = function (symbol) {
        return utils.isInstanceMember(symbol) && utils.isProperty(symbol);
    };

    /**
     *  Checks whether the given symbol is a static property.
     *  @memberof docma.utils
     *  @name isStaticProperty
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticProperty = function (symbol) {
        return utils.isStaticMember(symbol) && utils.isProperty(symbol);
    };

    /**
     *  Checks whether the given symbol is a custom type definition.
     *  @memberof docma.utils
     *  @name isTypeDef
     *  @function
     *  @alias isCustomType
     *  @static
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isTypeDef = function (symbol) {
        return symbol.kind === 'typedef';
    };
    /**
     *  Alias for `utils.isTypeDef`
     *  @private
     */
    utils.isCustomType = utils.isTypeDef;

    /**
     *  Checks whether the given symbol is an enumeration.
     *  @memberof docma.utils
     *  @name isEnum
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isEnum = function (symbol) {
        return symbol.isEnum;
    };

    /**
     *  Checks whether the given symbol is read-only.
     *  @memberof docma.utils
     *  @name isReadOnly
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isReadOnly = function (symbol) {
        return symbol.readonly;
    };

    /**
     *  Checks whether the given symbol has `public` access.
     *  @memberof docma.utils
     *  @name isPublic
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isPublic = function (symbol) {
        return typeof symbol.access !== 'string' || symbol.access === 'public';
    };

    /**
     *  Checks whether the given symbol has `private` access.
     *  @memberof docma.utils
     *  @name isPrivate
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isPrivate = function (symbol) {
        return symbol.access === 'private';
    };

    /**
     *  Checks whether the given symbol has `protected` access.
     *  @memberof docma.utils
     *  @name isProtected
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isProtected = function (symbol) {
        return symbol.access === 'protected';
    };

    /**
     *  Checks whether the given symbol is undocumented.
     *  This checks if the symbol has any comments.
     *  @memberof docma.utils
     *  @name isUndocumented
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isUndocumented = function (symbol) {
        // we could use the `undocumented` property but it still seems buggy.
        // https://github.com/jsdoc3/jsdoc/issues/241
        // `undocumented` is omitted (`undefined`) for documented symbols.
        // return symbol.undocumented !== true;
        return !symbol.comments;
    };

    /**
     *  Checks whether the given symbol has description.
     *  @memberof docma.utils
     *  @name hasDescription
     *  @function
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.hasDescription = function (symbol) {
        return Boolean(getStr(symbol.classdesc) || getStr(symbol.description));
    };

    // ----

    /**
     *  GGets the types of the symbol as a string (joined with pipes `|`).
     *  @memberof docma.utils
     *  @name getTypes
     *  @function
     *
     *  @param {Object} symbol - Target documentation symbol.
     *  @returns {String}
     *
     *  @example
     *  var symbol = { "type": { "names": ["Number", "String"] } };
     *  docma.util.getTypes(symbol); // Number|String
     */
    utils.getTypes = function (symbol) {
        if (symbol.kind === 'class') return 'class';
        var types = utils.notate(symbol, 'type.names') || [];
        // remove dots from types such as Array.<String>
        types = types.map(function (t) {
            return t.replace(/\.</g, '<');
        }).join('|');
        return symbol.isEnum ? 'enum<' + types + '>' : types;
    };

    // e.g.
    // "returns": [
    //   {
    //     "type": { "names": ["Date"] },
    //     "description": "- Current date."
    //   }
    // ]

    /**
     *  Gets the return types of the symbol as a string (joined with pipes `|`).
     *  @memberof docma.utils
     *  @name getReturnTypes
     *  @function
     *
     *  @param {Object} symbol - Target documentation symbol.
     *  @returns {String}
     */
    utils.getReturnTypes = function (symbol) {
        var ret = symbol.returns;
        if (!Array.isArray(ret)) return 'void';
        var names;
        var allNames = ret.reduce(function (memo, r) {
            names = utils.notate(r, 'type.names');
            if (Array.isArray(names)) {
                return memo.concat(names);
            }
            return memo;
        }, []);
        return allNames.length > 0
            ? allNames.join('|')
            : 'void';
    };

    /**
     *  Removes leading spaces and dashes. Useful when displaying symbol
     *  descriptions.
     *  @memberof docma.utils
     *  @name trimLeft
     *  @function
     *
     *  @param {String} string - String to be trimmed.
     *  @returns {String}
     */
    utils.trimLeft = function (string) {
        // remove leading space and dashes.
        return string.replace(/^[\s\n\r\-—]*/, '');
    };

    /**
     *  Removes leading and trailing new lines.
     *  @memberof docma.utils
     *  @name trimNewLines
     *  @function
     *
     *  @param {String} string - String to be trimmed.
     *  @returns {String}
     */
    utils.trimNewLines = function (string) {
        return string.replace(/^[\r\n]+|[\r\n]+$/, '');
    };

    /**
     *  Converts back-ticks to HTML code tags.
     *  @memberof docma.utils
     *  @name parseTicks
     *  @function
     *
     *  @param {String} string
     *         String to be parsed.
     *
     *  @returns {String}
     */
    utils.parseTicks = function (string) {
        return string
            .replace(/(```\s*)([\s\S]*?)(\s*```)/g, function (match, p1, p2) { // , p3, offset, string
                return utils.normalizeTabs(utils._wrapEscapeCode(p2, true).replace(/`/g, '&#x60;'));
            })
            .replace(/(`)(.*?)(`)/g, function (match, p1, p2) { // , p3, offset, string
                return utils._wrapEscapeCode(p2);
            });
    };

    /**
     *  Converts new lines to HTML paragraphs.
     *  @memberof docma.utils
     *  @name parseNewLines
     *  @function
     *
     *  @param {String} string
     *         String to be parsed.
     *  @param {Object} [options]
     *         Parse options.
     *         @param {Boolean} [options.keepIfSingle=false]
     *                If `true`, lines will not be converted to paragraphs.
     *
     *  @returns {String}
     */
    utils.parseNewLines = function (string, options) {
        options = options || {};
        return utils._tokenize(string, function (block, isCode) {
            if (isCode) return block;
            var parts = block.split(/[\r\n]{2,}/);
            if (parts.length <= 1 && options.keepIfSingle) return block;
            return parts.map(function (part) {
                return '<p>' + part + '</p>';
            }).join('');
        }).join('');
    };

    /**
     *  Converts JSDoc `@link` directives to HTML anchor tags.
     *  @memberof docma.utils
     *  @name parseLinks
     *  @function
     *
     *  @param {String} string
     *         String to be parsed.
     *  @param {Object} [options]
     *         Parse options.
     *         @param {String} [options.target]
     *                Href target. e.g. `"_blank"`
     *
     *  @returns {String}
     */
    utils.parseLinks = function (string, options) { // TODO: base path
        options = options || {};
        var re = /\{@link +([^}]*?)\}/g;
        var out = string.replace(re, function (match, p1) { // , offset, string
            var link, label,
                parts = p1.split('|');
            if (parts.length === 1) {
                link = label = parts[0].trim(); // eslint-disable-line
            } else {
                link = parts[0].trim();
                label = parts[1].trim();
            }
            // label = utils.parseTicks(label);
            // if the link is a symbol, prepend with a hash to trigger the bookmark when clicked
            // if (symbolNames && symbolNames.indexOf(link) >= 0) {..}
            // if no slash, treat this as a bookmark
            // if ((/\//i).test(link) === false) {
            //     return '<a href="#' + link + '">' + label + '</a>';
            // }
            var target = options.target
                ? ' target="' + options.target + '"'
                : '';
            return '<a href="' + link + '"' + target + '>' + label + '</a>';
        });
        return utils.parseTicks(out);
    };

    /**
     *  Parses the given string into proper HTML. Removes leading whitespace,
     *  converts new lines to paragraphs, ticks to code tags and JSDoc links to
     *  anchors.
     *  @memberof docma.utils
     *  @name parse
     *  @function
     *
     *  @param {String} string
     *         String to be parsed.
     *  @param {Object} [options]
     *         Parse options.
     *         @param {Object} [options.keepIfSingle=false]
     *                If enabled, single lines will not be converted to paragraphs.
     *         @param {String} [options.target]
     *                Href target for links. e.g. `"_blank"`
     *
     *  @returns {String}
     */
    utils.parse = function (string, options) {
        options = options || {};
        string = utils.trimLeft(string);
        string = utils.parseNewLines(string, options);
        string = utils.parseTicks(string);
        return utils.parseLinks(string, options);
    };

    /**
     *  Normalizes the number of spaces/tabs to multiples of 2 spaces, in the
     *  beginning of each line. Useful for fixing mixed indets of a description
     *  or example.
     *  @memberof docma.utils
     *  @name normalizeTabs
     *  @function
     *
     *  @param {String} string
     *         String to process.
     *
     *  @returns {String}
     */
    utils.normalizeTabs = function (string) {
        var m = string.match(/^\s*/gm),
            min = Infinity;

        m.forEach(function (wspace, index) {
            // tabs to spaces
            wspace = wspace.replace(/\t/g, '  ');
            // ignoring first line's indent
            if (index > 0) min = Math.min(wspace.length, min);
        });

        // replace the minimum indent from all lines (except first)
        if (min !== Infinity) {
            var re = new RegExp('^\\s{' + min + '}', 'g');
            string = string.replace(re, '');
        }
        // replace all leading spaces from first line
        string = string.replace(/^\s*/, '');

        var spaces;
        return string.replace(/([\r\n]+)(\s+)/gm, function (match, p1, p2) { // , offset, string
            // convert tabs to spaces
            spaces = p2.replace(/\t/g, '  ');
            // convert indent to multiples of 2
            spaces = new Array(spaces.length - (spaces.length % 2) + 1).join(' ');
            return p1 + spaces;
        });
    };

    /**
     *  Builds a string of keywords from the given symbol.
     *  This is useful for filter/search features of a template.
     *  @memberof docma.utils
     *  @name getKeywords
     *  @function
     *
     *  @param {Object} symbol - Target documentation symbol.
     *  @returns {String}
     */
    utils.getKeywords = function (symbol) {
        if (typeof symbol === 'string') return symbol.toLowerCase();
        var k = utils.getFullName(symbol) + ' '
            + symbol.longname + ' '
            + symbol.name + ' '
            + (symbol.alias || '') + ' '
            + (symbol.memberOf || '') + ' '
            + (symbol.kind || '') + ' '
            + (symbol.scope || '') + ' '
            + (symbol.classdesc || '') + ' '
            + (symbol.description || '') + ' '
            + (symbol.filename || '') + ' '
            + (symbol.readonly ? 'readonly' : '')
            + (symbol.isEnum ? 'enum' : '');
        if (utils.isConstructor(symbol)) k += ' constructor';
        if (utils.isMethod(symbol)) k += ' method';
        if (utils.isProperty(symbol)) k += ' property';
        return k.replace(/[><"'`\n\r]/g, '').toLowerCase();
    };

    /**
     *  Gets code file information from the given symbol.
     *  @memberof docma.utils
     *  @name getCodeFileInfo
     *  @function
     *
     *  @param {Object} symbol - Target documentation symbol.
     *  @returns {Object}
     */
    utils.getCodeFileInfo = function (symbol) {
        return {
            filename: utils.notate(symbol, 'meta.filename'),
            lineno: utils.notate(symbol, 'meta.lineno'),
            path: utils.notate(symbol, 'meta.path')
        };
    };

    /**
     *  Gets HTML formatted, delimeted code tags.
     *  @memberof docma.utils
     *  @name getCodeTags
     *  @function
     *
     *  @param {Array} list - String list of values.
     *  @param {String} [delimeter=","] - String delimeter.
     *
     *  @returns {String}
     */
    utils.getCodeTags = function (list, demileter) {
        return list.map(function (item) {
            return utils._wrapEscapeCode(item); // '<code>' + item + '</code>';
        }).join(demileter || ',');
    };

    /**
     *  Gets HTML formatted list of types from the given symbols list. Type
     *  items are wrapped with code tags. If multiple, formatted as an HTML
     *  unordered list.
     *  @memberof docma.utils
     *  @name getFormattedTypeList
     *  @function
     *
     *  @param {Array} list - List of symbols.
     *  @param {Object} [options] - Format options.
     *  @param {String} [options.delimeter="|"] - Types delimeter.
     *  @param {Boolean} [options.descriptions=true] - Whether to include descriptions.
     *  @param {String} [options.descDelimeter="  —  "] - Description delimiter.
     *
     *  @returns {String}
     */
    utils.getFormattedTypeList = function (list, options) {
        if (!list || list.length === 0) return '';

        var opts = options || {};
        var delim = opts.delimeter || '|';
        var addDesc = typeof opts.descriptions !== 'boolean' ? true : opts.descriptions;
        var descDelim = opts.descDelimeter || '&nbsp;&nbsp;—&nbsp;&nbsp;';

        var desc = '';
        var pList = list.map(function (item) {
            if (addDesc) {
                desc = utils.parse(item.description || '', { keepIfSingle: true });
                if (desc) desc = descDelim + desc;
            }
            return utils._wrapEscapeCode(item.type.names.join(delim)) + desc; // '<code>' + item.type.names.join('|') + '</code>' + desc;
        });
        if (pList.length > 1) {
            return '<ul>\n' + pList.join('</li>\n<li>') + '\n</ul>';
        }
        return pList; // single item
    };

    // ----------------------
    // PRIVATE
    // ----------------------

    /**
     *  Iterates and gets the first matching item in the array.
     *  @memberof docma.utils
     *  @name _find
     *  @function
     *  @private
     *
     *  @param {Array} array
     *         Source array.
     *  @param {Object} map
     *         Key/value mapping for the search.
     *
     *  @returns {*} - First matching result. `null` if not found.
     */
    utils._find = function (array, map) {
        // don't type check
        if (!array || !map) return null;
        var i, item,
            found = null;
        for (i = 0; i < array.length; i++) {
            item = array[i];
            if (item && typeof item === 'object') {
                for (var prop in map) {
                    // we also ignore undefined !!!
                    if (map[prop] !== undefined && map.hasOwnProperty(prop)) {
                        if (map[prop] !== item[prop]) {
                            found = null;
                            break;
                        } else {
                            found = item;
                        }
                    }
                }
                if (found) break; // exit
            }
        }
        return found;
    };

    /**
     *  Assignes the source properties to the target object.
     *  @memberof docma.utils
     *  @name _assign
     *  @function
     *  @private
     *
     *  @param {Object} target
     *         Target object.
     *  @param {Object} source
     *         Source object.
     *  @param {Boolean} [enumerable=false]
     *         Whether the assigned properties should be enumerable.
     *
     *  @returns {Object} - Modified target object.
     */
    utils._assign = function (target, source, enumerable) {
        target = target || {};
        var prop;
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                if (enumerable) {
                    Object.defineProperty(target, prop, {
                        enumerable: true,
                        value: source[prop]
                    });
                } else {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    };

    /**
     *  Gets the values of the source object as an `Array`.
     *  @memberof docma.utils
     *  @name _values
     *  @function
     *  @private
     *
     *  @param {Object} source - Source object.
     *
     *  @returns {Array}
     */
    utils._values = function (source) {
        if (Array.isArray(source)) return source;
        var prop,
            values = [];
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                values.push(source[prop]);
            }
        }
        return values;
    };

    /**
     *  Escapes the HTML tags in the given code with entities and wraps the
     *  whole string with `&lt;code&gt;` tags.
     *  @memberof docma.utils
     *  @name _wrapEscapeCode
     *  @function
     *  @private
     *
     *  @param {String} code - Code to be processed.
     *  @param {Boolean} [pre=false] - Whether to also wrap the code with
     *         `&lt;pre&gt;` tags.
     *
     *  @returns {String}
     */
    utils._wrapEscapeCode = function (code, pre) {
        code = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        code = '<code>' + code + '</code>';
        return pre ? '<pre>' + code + '</pre>' : code;
    };

    /**
     *  Tokenizes the given string into blocks.
     *  Each block is either a multiline code block (e.g. ```code```) or
     *  regular string block.
     *  @memberof docma.utils
     *  @name _tokenize
     *  @function
     *  @private
     *
     *  @param {String} string - String to be tokenized.
     *  @param {Function} [callback=identity] - Function to be executed
     *         on each block. Two arguments are passed; `block`, `isCode`.
     *  @returns {Array}
     *           Array of tokenized blocks.
     */
    utils._tokenize = function (string, callback) {
        if (typeof callback !== 'function') callback = identity;
        var mark = '```';
        if (string.indexOf(mark) < 0) return [callback(string, false)];
        var i,
            len = mark.length,
            token = '',
            mem = '',
            blocks = [],
            entered = false;
        for (i = 0; i < string.length; i++) {
            token += string[i];
            mem += string[i];
            if (token.length > len) token = token.slice(-len);
            if (token === mark) {
                entered = !entered;
                if (entered) {
                    blocks.push(callback(mem.slice(0, -len), false));
                    mem = token;
                } else {
                    blocks.push(callback(mem, true));
                    mem = '';
                }
            }
        }
        return blocks;
    };

    // ----------------------

    docma.utils = utils;

})();
