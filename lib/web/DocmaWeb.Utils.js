/* global */
/* eslint max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

/**
 *  Docma (web) core class.
 *  See {@link api/web|documentation}.
 *  @name DocmaWeb
 *  @class
 */

// --------------------------------
// NAMESPACE: DocmaWeb.Utils
// https://github.com/onury/docma
// --------------------------------

/**
 *  Utilities for inspecting JSDoc documentation and symbols; and parsing
 *  documentation data into proper HTML.
 *  @name DocmaWeb.Utils
 *  @type {Object}
 *  @namespace
 */
var Utils = {};

function getStr(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function bracket(prop) {
    var re = /^[a-z$_][a-z\d$_]*$/i; // non-bracket notation
    return re.test(prop) ? '.' + prop : '["' + prop + '"]';
}
// fixes a jsdoc bug
// e.g. MyClass.Enum."STATE"] —» MyClass.Enum.STATE
function fixBracket(notation) {
    return notation.replace(/(.*?)\."([^"]+)"\]?$/, function (str, $1, $2) {
        return $2 ? $1 + bracket($2) : notation;
    });
}

/**
 *  Cleans the given symbol name.
 *  @private
 *  @param {String} name - Symbol name to be cleaned.
 *  @returns {String} -
 */
function cleanName(name) {
    // e.g. <anonymous>~obj.doStuff —» obj.doStuff
    name = getStr(name)
        .replace(/([^>]+>)?~?(.*)/, '$2')
        // e.g. '"./node_modules/eventemitter3/index.js"~EventEmitter'.
        .replace(/^"[^"]+"\.?~?([^"]+)$/, '$1')
        .replace(/^(module\.)?exports\./, '')
        .replace(/^module:/, '');
    return fixBracket(name);
}

function getMetaCodeName(symbol) {
    return cleanName(Utils.notate(symbol, 'meta.code.name') || '');
}

function identity(o) {
    return o;
}

function hasConstructorTag(symbol) {
    return /\*\s+@construct(s|or)\b/.test(symbol.comment);
}

/**
 *  Gets the type of the given object.
 *  @name DocmaWeb.Utils.type
 *  @function
 *  @static
 *
 *  @param {*} obj - Object to be inspected.
 *  @returns {String} - Lower-case name of the type.
 */
Utils.type = function (obj) {
    return Object.prototype.toString.call(obj).match(/\s(\w+)/i)[1].toLowerCase();
};

/**
 *  Gets the value of the target property by the given dot
 *  {@link https://github.com/onury/notation|notation}.
 *  @name DocmaWeb.Utils.notate
 *  @function
 *  @static
 *
 *  @param {Object} obj - Source object.
 *  @param {String} notation - Path of the property in dot-notation.
 *
 *  @returns {*} - The value of the notation. If the given notation does
 *  not exist, safely returns `undefined`.
 *
 *  @example
 *  var symbol = { code: { meta: { type: "MethodDefinition" } } };
 *  DocmaWeb.Utils.notate(symbol, "code.meta.type"); // returns "MethodDefinition"
 */
Utils.notate = function (obj, notation) {
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
        return Utils.notate(o, props);
    }
    return o;
};

/**
 *  Gets the short name of the given symbol.
 *  JSDoc overwrites the `longname` and `name` of the symbol, if it has an
 *  alias. This returns the correct short name.
 *  @name DocmaWeb.Utils.getName
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} -
 */
Utils.getName = function (symbol) {
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
 *  @name DocmaWeb.Utils.getLongName
 *  @function
 *  @alias getFullName
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} -
 */
Utils.getLongName = function (symbol) {
    var longName = cleanName(symbol.longname);
    var metaCodeName = getMetaCodeName(symbol) || longName;
    var memberOf =  symbol.memberof || '';
    // if memberOf is like "\"./some/file.js\""
    memberOf = /^".*"$/.test(memberOf) ? '' : cleanName(memberOf);

    // JSDoc bug: if the constructor is not marked with @constructs, the
    // longname is incorrect. e.g. `ClassName#ClassName`. So we return
    // (clean) meta.code.name in this case. e.g. `ClassName`
    if (symbol.name === memberOf && Utils.isConstructor(symbol)) {
        return metaCodeName;
    }

    // if @alias is set, the original (long) name is generally found at
    // meta.code.name
    var codeName = symbol.alias ? metaCodeName : longName;

    if (!memberOf) return codeName;
    var re = new RegExp('^' + memberOf + '[#.~:]'),
        dot = symbol.scope === 'instance' ? '#' : '.';

    return re.test(codeName) ? codeName : memberOf + dot + codeName;
};
Utils.getFullName = Utils.getLongName;

/**
 *  Gets the code name of the given symbol.
 *  @name DocmaWeb.Utils.getCodeName
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {String} - If no code name, falls back to long name.
 */
Utils.getCodeName = function (symbol) {
    return getMetaCodeName(symbol) || Utils.getLongName(symbol);
};

/**
 *  Gets the first matching symbol by the given name.
 *  @name DocmaWeb.Utils.getSymbolByName
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {String} name - Symbol name to be checked. Better, pass the
 *  `longname` (or `$longname`). It will still find a short name but it'll
 *  return the first occurence if there are multiple symbols with the same
 *  short name. e.g. `create` is ambiguous but `Docma.create` is unique.
 *
 *  @returns {Object} - Symbol object if found. Otherwise, returns `null`.
 */
Utils.getSymbolByName = function (docsOrApis, name) {
    var i, symbol, docs, found;
    if (Utils.type(docsOrApis) === 'object') {
        var apiNames = Object.keys(docsOrApis);
        for (i = 0; i < apiNames.length; i++) {
            docs = docsOrApis[apiNames[i]].documentation;
            found = Utils.getSymbolByName(docs, name);
            if (found) return found;
        }
        return null;
    }

    docs = docsOrApis;
    for (i = 0; i < docs.length; i++) {
        symbol = docs[i];
        if (symbol.name === name
                || symbol.longname === name
                || Utils.getFullName(symbol) === name) {
            return symbol;
        }
        if (symbol.$members) {
            found = Utils.getSymbolByName(symbol.$members, name);
            if (found) return found;
        }
    }
    return null;
};

/**
 *  Gets the number of levels for the given symbol or name. e.g.
 *  `mylib.prop` has 2 levels.
 *  @name DocmaWeb.Utils.getLevels
 *  @function
 *
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {Number} -
 */
Utils.getLevels = function (symbol) {
    var longname = (typeof symbol === 'string' ? symbol : symbol.$longname) || '';
    longname = cleanName(longname);
    // colon (:) is not a level separator. JSDoc uses colon in cases like:
    // `obj~event:ready` or `module:someModule`
    return longname
        ? ((longname || '').split(/[.#~]/) || []).length
        : 0;
};

/**
 *  Gets the parent symbol name from the given symbol object or symbol's name
 *  (notation). Note that, this will return the parent name even if the parent
 *  symbol does not exist in the documentation. If there is no parent, returns
 *  `""` (empty string).
 *  @name DocmaWeb.Utils.getParentName
 *  @function
 *
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {Number} -
 */
Utils.getParentName = function (symbol) {
    var longname;
    if (typeof symbol !== 'string') {
        if (symbol.memberof
                // if memberOf is like "\"./some/file.js\""
                && /^".*"$/.test(symbol.memberof) === false) {
            return cleanName(symbol.memberof);
        }
        longname = cleanName(symbol.$longname);
    } else {
        longname = cleanName(symbol);
    }
    // colon (:) is not a level separator. JSDoc uses colon in cases like:
    // `obj~event:ready` or `module:someModule`
    if (!longname || !(/[.#~]/g).test(longname)) return '';
    return longname.replace(/[.#~][^.#~]*$/, '');
};

/**
 *  Gets the parent symbol object from the given symbol object or symbol's
 *  name.
 *  @name DocmaWeb.Utils.getParent
 *  @function
 *
 *  @param {Array|Object} docs - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object|String} symbol - Documented symbol object or long name.
 *  @returns {String} - `null` if symbol has no parent.
 */
Utils.getParent = function (docs, symbol) {
    var sym = typeof symbol === 'string'
        ? Utils.getSymbolByName(docs, symbol)
        : symbol;
    if (!sym) return null;
    // var parentName = (sym && cleanName(sym.memberof)) || Utils.getParentName(symbol);
    var parentName = Utils.getParentName(sym);
    if (parentName) return Utils.getSymbolByName(docs, parentName);
    return null;
};

/**
 *  Checks whether the given symbol is deprecated.
 *  @name DocmaWeb.Utils.isDeprecated
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isDeprecated = function (symbol) {
    return symbol.deprecated;
};

/**
 *  Checks whether the given symbol has global scope.
 *  @name DocmaWeb.Utils.isGlobal
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isGlobal = function (symbol) {
    return symbol.scope === 'global';
};

/**
 *  Checks whether the given symbol is a namespace.
 *  @name DocmaWeb.Utils.isNamespace
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isNamespace = function (symbol) {
    return symbol.kind === 'namespace';
};

/**
 *  Checks whether the given symbol is a module.
 *  @name DocmaWeb.Utils.isModule
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isModule = function (symbol) {
    return symbol.kind === 'module';
};

/**
 *  Checks whether the given symbol is marked as a mixin (is intended to be
 *  added to other objects).
 *  @name DocmaWeb.Utils.isMixin
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isMixin = function (symbol) {
    return symbol.kind === 'mixin';
};

/**
 *  Checks whether the given symbol is a class.
 *  @name DocmaWeb.Utils.isClass
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isClass = function (symbol) {
    return symbol.kind === 'class'
        && Utils.notate(symbol, 'meta.code.type') !== 'MethodDefinition' // constructor if MethodDefinition
        && !hasConstructorTag(symbol);
    // && Utils.notate(symbol, 'meta.code.type') === 'ClassDeclaration';
};

/**
 *  Checks whether the given symbol is marked as a constant.
 *  @name DocmaWeb.Utils.isConstant
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isConstant = function (symbol) {
    return symbol.kind === 'constant';
};

/**
 *  Checks whether the given symbol is a constructor.
 *  @name DocmaWeb.Utils.isConstructor
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isConstructor = function (symbol) {
    return symbol.kind === 'class'
        && (Utils.notate(symbol, 'meta.code.type') === 'MethodDefinition' || hasConstructorTag(symbol));
};

/**
 *  Checks whether the given symbol is a static member.
 *  @name DocmaWeb.Utils.isStaticMember
 *  @function
 *  @alias isStatic
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticMember = function (symbol) {
    return symbol.scope === 'static';
};
/**
 *  Alias for `Utils.isStaticMember`
 *  @private
 */
Utils.isStatic = Utils.isStaticMember;

/**
 *  Checks whether the given symbol has an inner scope.
 *  @name DocmaWeb.Utils.isInner
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInner = function (symbol) {
    return symbol.scope === 'inner';
};

/**
 *  Checks whether the given symbol is an instance member.
 *  @name DocmaWeb.Utils.isInstanceMember
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceMember = function (symbol) {
    return symbol.scope === 'instance';
};

/**
 *  Checks whether the given symbol is marked as an interface that other symbols
 *  can implement.
 *  @name DocmaWeb.Utils.isInterface
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInterface = function (symbol) {
    return symbol.scope === 'interface';
};

/**
 *  Checks whether the given symbol is a method (function).
 *  @name DocmaWeb.Utils.isMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isMethod = function (symbol) {
    var codeType = Utils.notate(symbol, 'meta.code.type');
    return symbol.kind === 'function'
        || codeType === 'FunctionExpression'
        || codeType === 'FunctionDeclaration';
    // for getters/setters codeType might return 'MethodDefinition'
    // so we leave it out.
};
Utils.isFunction = Utils.isMethod;

/**
 *  Checks whether the given symbol is an instance method.
 *  @name DocmaWeb.Utils.isInstanceMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceMethod = function (symbol) {
    return Utils.isInstanceMember(symbol) && Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is a static method.
 *  @name DocmaWeb.Utils.isStaticMethod
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticMethod = function (symbol) {
    return Utils.isStaticMember(symbol) && Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is a property (and not a method/function).
 *  @name DocmaWeb.Utils.isProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isProperty = function (symbol) {
    return symbol.kind === 'member' && !Utils.isMethod(symbol);
};

/**
 *  Checks whether the given symbol is an instance property.
 *  @name DocmaWeb.Utils.isInstanceProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isInstanceProperty = function (symbol) {
    return Utils.isInstanceMember(symbol) && Utils.isProperty(symbol);
};

/**
 *  Checks whether the given symbol is a static property.
 *  @name DocmaWeb.Utils.isStaticProperty
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isStaticProperty = function (symbol) {
    return Utils.isStaticMember(symbol) && Utils.isProperty(symbol);
};

/**
 *  Checks whether the given symbol is a custom type definition.
 *  @name DocmaWeb.Utils.isTypeDef
 *  @function
 *  @alias isCustomType
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isTypeDef = function (symbol) {
    return symbol.kind === 'typedef';
};
/**
 *  Alias for `Utils.isTypeDef`
 *  @private
 */
Utils.isCustomType = Utils.isTypeDef;

/**
 *  Checks whether the given symbol is a callback definition.
 *  @name DocmaWeb.Utils.isCallback
 *  @function
 *  @static
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isCallback = function (symbol) {
    var typeNames = (symbol.type || {}).names || [];
    return symbol.kind === 'typedef'
        && (symbol.comment || '').indexOf('@callback ' + symbol.longname) >= 0
        && (typeNames.length === 1 && typeNames[0] === 'function');
};

/**
 *  Checks whether the given symbol is an enumeration.
 *  @name DocmaWeb.Utils.isEnum
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isEnum = function (symbol) {
    return Boolean(symbol.isEnum);
};

/**
 *  Checks whether the given symbol is an event.
 *  @name DocmaWeb.Utils.isEvent
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isEvent = function (symbol) {
    return symbol.kind === 'event';
};

/**
 *  Checks whether the given symbol is defined outside of the current package.
 *  @name DocmaWeb.Utils.isExternal
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isExternal = function (symbol) {
    return symbol.kind === 'external';
};

/**
 *  Checks whether the given symbol is a generator function.
 *  @name DocmaWeb.Utils.isGenerator
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isGenerator = function (symbol) {
    return symbol.generator && symbol.kind === 'function';
};

/**
 *  Checks whether the given symbol is read-only.
 *  @name DocmaWeb.Utils.isReadOnly
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isReadOnly = function (symbol) {
    return symbol.readonly;
};

/**
 *  Checks whether the given symbol has `public` access.
 *  @name DocmaWeb.Utils.isPublic
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPublic = function (symbol) {
    return typeof symbol.access !== 'string' || symbol.access === 'public';
};

/**
 *  Checks whether the given symbol has `private` access.
 *  @name DocmaWeb.Utils.isPrivate
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPrivate = function (symbol) {
    return symbol.access === 'private';
};

/**
 *  Checks whether the given symbol has `package` private access; indicating
 *  that the symbol is available only to code in the same directory as the
 *  source file for this symbol.
 *  @name DocmaWeb.Utils.isPackagePrivate
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isPackagePrivate = function (symbol) {
    return symbol.access === 'package';
};

/**
 *  Checks whether the given symbol has `protected` access.
 *  @name DocmaWeb.Utils.isProtected
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isProtected = function (symbol) {
    return symbol.access === 'protected';
};

/**
 *  Checks whether the given symbol is undocumented.
 *  This checks if the symbol has any comments.
 *  @name DocmaWeb.Utils.isUndocumented
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.isUndocumented = function (symbol) {
    // we could use the `undocumented` property but it still seems buggy.
    // https://github.com/jsdoc3/jsdoc/issues/241
    // `undocumented` is omitted (`undefined`) for documented symbols.
    // return symbol.undocumented !== true;
    return !symbol.comments;
};

/**
 *  Checks whether the given symbol has description.
 *  @name DocmaWeb.Utils.hasDescription
 *  @function
 *
 *  @param {Object} symbol - Documented symbol object.
 *  @returns {Boolean} -
 */
Utils.hasDescription = function (symbol) {
    return Boolean(getStr(symbol.classdesc) || getStr(symbol.description));
};

/**
 *  Removes leading spaces and dashes. Useful when displaying symbol
 *  descriptions.
 *  @name DocmaWeb.Utils.trimLeft
 *  @function
 *
 *  @param {String} string - String to be trimmed.
 *  @returns {String} -
 */
Utils.trimLeft = function (string) {
    // remove leading space and dashes.
    return string.replace(/^[\s\n\r\-—]*/, '');
};

/**
 *  Removes leading and trailing new lines.
 *  @name DocmaWeb.Utils.trimNewLines
 *  @function
 *
 *  @param {String} string - String to be trimmed.
 *  @returns {String} -
 */
Utils.trimNewLines = function (string) {
    return string.replace(/^[\r\n]+|[\r\n]+$/, '');
};

/**
 *  Converts back-ticks to HTML code tags.
 *  @name DocmaWeb.Utils.parseTicks
 *  @function
 *
 *  @param {String} string
 *         String to be parsed.
 *
 *  @returns {String} -
 */
Utils.parseTicks = function (string) {
    if (typeof string !== 'string') return '';
    return string
        .replace(/(```\s*)([\s\S]*?)(\s*```)/g, function (match, p1, p2) { // , p3, offset, string
            return Utils.normalizeTabs(Utils._wrapCode(p2, true, true).replace(/`/g, '&#x60;'));
        })
        .replace(/(`)(.*?)(`)/g, function (match, p1, p2) { // , p3, offset, string
            return Utils._wrapCode(p2, true);
        });
};

/**
 *  Converts new lines to HTML paragraphs.
 *  @name DocmaWeb.Utils.parseNewLines
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *         @param {Boolean} [options.keepIfSingle=false]
 *         If `true`, lines will not be converted to paragraphs.
 *
 *  @returns {String} -
 */
Utils.parseNewLines = function (string, options) {
    options = options || {};
    return Utils._tokenize(string, function (block, isCode) {
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
 *  @name DocmaWeb.Utils.parseLinks
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *  @param {String} [options.target] - Href target. e.g. `"_blank"`
 *
 *  @returns {String} -
 */
Utils.parseLinks = function (string, options) {
    if (typeof string !== 'string') return '';
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
        // if does not look like a URL path, treat this as a symbol bookmark.
        // instead, we could check like this:
        // if (symbolNames && symbolNames.indexOf(link) >= 0) {..}
        // but it has too much overhead...
        if ((/[/?&=]/).test(link) === false && link[0] !== '#') link = '#' + link;

        var target = options.target
            ? ' target="' + options.target + '" rel="noopener noreferrer"'
            : '';
        return '<a href="' + link + '"' + target + '>' + label + '</a>';
    });
    return Utils.parseTicks(out);
};

/**
 *  Parses the given string into proper HTML. Removes leading whitespace,
 *  converts new lines to paragraphs, ticks to code tags and JSDoc links to
 *  anchors.
 *  @name DocmaWeb.Utils.parse
 *  @function
 *
 *  @param {String} string - String to be parsed.
 *  @param {Object} [options] - Parse options.
 *         @param {Object} [options.keepIfSingle=false]
 *         If enabled, single lines will not be converted to paragraphs.
 *         @param {String} [options.target]
 *         Href target for links. e.g. `"_blank"`
 *
 *  @returns {String} -
 */
Utils.parse = function (string, options) {
    options = options || {};
    string = Utils.trimLeft(string);
    string = Utils.parseNewLines(string, options);
    string = Utils.parseTicks(string);
    return Utils.parseLinks(string, options);
};

/**
 *  Normalizes the number of spaces/tabs to multiples of 2 spaces, in the
 *  beginning of each line. Useful for fixing mixed indets of a description
 *  or example.
 *  @name DocmaWeb.Utils.normalizeTabs
 *  @function
 *
 *  @param {String} string - String to process.
 *
 *  @returns {String} -
 */
Utils.normalizeTabs = function (string) {
    if (typeof string !== 'string') return '';
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
 *  @name DocmaWeb.Utils.getKeywords
 *  @function
 *
 *  @param {Object} symbol - Target documentation symbol.
 *  @returns {String} -
 */
Utils.getKeywords = function (symbol) {
    if (typeof symbol === 'string') return symbol.toLowerCase();
    var k = Utils.getFullName(symbol) + ' '
        + symbol.longname + ' '
        + symbol.name + ' '
        + (symbol.alias || '') + ' '
        + (symbol.memberOf || '') + ' '
        + (symbol.$kind || '') + ' '
        + (symbol.scope || '') + ' '
        + (symbol.classdesc || '') + ' '
        + (symbol.description || '') + ' '
        + (symbol.filename || '') + ' '
        + (symbol.readonly ? 'readonly' : '')
        + (symbol.isEnum ? 'enum' : '');
    if (Utils.isConstructor(symbol)) k += ' constructor';
    if (Utils.isMethod(symbol)) k += ' method';
    if (Utils.isProperty(symbol)) k += ' property';
    return k.replace(/[><"'`\n\r]/g, '').toLowerCase();
};

/**
 *  Gets code file information from the given symbol.
 *  @name DocmaWeb.Utils.getCodeFileInfo
 *  @function
 *
 *  @param {Object} symbol - Target documentation symbol.
 *  @returns {Object} -
 */
Utils.getCodeFileInfo = function (symbol) {
    return {
        filename: Utils.notate(symbol, 'meta.filename'),
        lineno: Utils.notate(symbol, 'meta.lineno'),
        path: Utils.notate(symbol, 'meta.path')
    };
};

/**
 *  Gets Docma route link for the given symbol or symbol name.
 *  @name DocmaWeb.Utils.getSymbolLink
 *  @function
 *  @static
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object|String} symbolOrName - Either the symbol itself or the
 *  name of the symbol.
 *
 *  @returns {String} - Empty string if symbol is not found.
 */
Utils.getSymbolLink = function (docsOrApis, symbolOrName) {
    if (typeof symbolOrName !== 'string') {
        return symbolOrName.$docmaLink;
    }
    var symbol = Utils.getSymbolByName(docsOrApis, symbolOrName);
    return symbol ? symbol.$docmaLink : '';
};

var reEndBrackets = /\[\]$/;
// regexp for inspecting type parts such as `Map<String, Object>`,
// `Promise<Boolean|String>[]` or simply `Boolean`. this also
// removes/ignores dots from types such as Array.<String>
var reTypeParts = /^([^<]+?)(?:\.)?(?:<\(([^>)]+)\)>)?(?:<([^>]+)>)?(\[\])?$/;

function _link(docsOrApis, type, options) {
    var endBrackets = reEndBrackets.test(type) ? '[]' : '';
    var t = (type || '').replace(reEndBrackets, '');
    var opts = options || {};
    var link;
    var target = '';
    if (opts.linkType !== 'internal') {
        link = Utils._getTypeExternalLink(t);
        if (link) target = ' target="_blank" rel="noopener noreferrer"';
    }
    if (!link && opts.linkType !== 'external') link = Utils.getSymbolLink(docsOrApis, t);
    if (link) type = '<a href="' + link + '"' + target + '>' + (opts.displayText || t) + endBrackets + '</a>';
    return type;
}

/**
 *  Gets Docma route link for the given symbol or symbol name and returns a
 *  string with anchor tags.
 *  @private
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {String} strType - Symbol type.
 *  @param {String} [options] - Options
 *      @param {String} [options.displayText] - Alternative display text to
 *      be placed within the anchor tag.
 *      @param {String} [options.linkType] - Set to `"internal"` (Docma
 *      symbol link) or `"external"` (JS or Web-API MDN link), or omit to
 *      get any of them, if found.
 *
 *  @returns {String} -
 */
Utils._parseAnchorLinks = function (docsOrApis, strType, options) {
    // see reTypeParts and reEndBrackets
    var m = strType.match(reTypeParts);
    if (!m || !m[1]) return '';
    // maybe we have end brackets e.g. Boolean[] or Promise<Boolean>[]
    var endBrackets = m[4] || '';
    var sTypes = m[2] || m[3] || '';
    // check for multiple types e.g. Map<String, String>
    if (sTypes) {
        sTypes = sTypes.split(',').map(function (outerT) {
            // check for sub-types e.g. Promise<Boolean|String>
            return outerT
                .trim()
                .split('|')
                .map(function (t) {
                    return _link(docsOrApis, t, options);
                })
                .join('<span class="code-delim">|</span>');
        }).join('<span class="code-delim">, </span>');
    }
    if (sTypes) sTypes = '&lt;' + sTypes + '&gt;';
    // check for sub-types e.g. Promise<Boolean|String>
    return _link(docsOrApis, m[1], options) + sTypes + endBrackets;
};

/**
 *  Gets the types of the symbol as a string (joined with pipes `|`).
 *  @name DocmaWeb.Utils.getTypes
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object} symbol - Target documentation symbol.
 *  @param {Object} [options] - Options.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 *
 *  @example
 *  var symbol = { "type": { "names": ["Number", "String"] } };
 *  DocmaWeb.Utils.getTypes(docs, symbol); // "Number|String"
 */
Utils.getTypes = function (docsOrApis, symbol, options) {
    var opts = options || {};
    var types = symbol.kind === 'class'
        ? ['class']
        : Utils.notate(symbol, 'type.names') || [];
    types = types.map(function (type) {
        if (opts.links) type = Utils._parseAnchorLinks(docsOrApis, type, { linkType: opts.links });
        return type;
    }).join('<span class="code-delim">|</span>');
    return symbol.isEnum ? 'enum&lt;' + types + '&gt;' : types;
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
 *  @name DocmaWeb.Utils.getReturnTypes
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Object} symbol - Target documentation symbol.
 *  @param {Object} [options] - Options.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getReturnTypes = function (docsOrApis, symbol, options) {
    var ret = symbol.returns;
    if (!Array.isArray(ret)) return 'void';
    var opts = options || {};

    var allTypes = ret.reduce(function (memo, r) {
        var types = Utils.notate(r, 'type.names') || [];
        if (opts.links) {
            types = types.map(function (type) {
                return Utils._parseAnchorLinks(docsOrApis, type, { linkType: opts.links });
            });
        }
        return memo.concat(types);
    }, []);
    return allTypes.length > 0
        ? allTypes.join('<span class="code-delim">|</span>')
        : 'void';
};

/**
 *  Gets HTML formatted, delimeted code tags.
 *  @name DocmaWeb.Utils.getCodeTags
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - String list of values to be placed within code
 *  tags.
 *  @param {Object} [options] - Options.
 *      @param {String} [options.delimeter=","] - String delimeter.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getCodeTags = function (docsOrApis, list, options) {
    var opts = options || {};
    return list.map(function (item) {
        if (opts.links) {
            var parsed = Utils._parseAnchorLinks(docsOrApis, item, {
                linkType: opts.links
            });
            return Utils._wrapCode(parsed, false);
        }
        return Utils._wrapCode(item, true);
    }).join(opts.demileter || ',');
};

/**
 *  Gets HTML formatted list of types from the given symbols list. Type
 *  items are wrapped with code tags. If multiple, formatted as an HTML
 *  unordered list.
 *  @name DocmaWeb.Utils.getFormattedTypeList
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - List of symbols to be converted to formatted
 *  string.
 *  @param {Object} [options] - Format options.
 *      @param {String} [options.delimeter="|"] - Types delimeter.
 *      @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *      @param {Boolean} [options.descriptions=true] - Whether to include descriptions.
 *      @param {String} [options.descDelimeter="  —  "] - Description delimiter.
 *
 *  @returns {String} -
 */
Utils.getFormattedTypeList = function (docsOrApis, list, options) {
    if (!Array.isArray(list) || list.length === 0) return '';

    var opts = options || {};
    var delim = '<span class="code-delim">' + (opts.delimeter || '|') + '</span>';
    var addDesc = typeof opts.descriptions !== 'boolean' ? true : opts.descriptions;
    var descDelim = opts.descDelimeter || '&nbsp;&nbsp;—&nbsp;&nbsp;';

    var desc = '';
    var pList = list.map(function (item) {
        if (addDesc) {
            desc = Utils.parse(item.description || '', { keepIfSingle: true });
            if (desc) desc = descDelim + desc;
        }
        if (item.type) {
            // https://github.com/onury/docma/issues/55
            var types = (item.type.names || []).map(function (type) {
                if (opts.links) {
                    var parsed = Utils._parseAnchorLinks(docsOrApis, type, {
                        linkType: opts.links
                    });
                    return Utils._wrapCode(parsed, false);
                }
                return Utils._wrapCode(type, true);
            });
            return types.join(delim) + desc;
        }
        // no type names, returning desc only
        return desc ? '— ' + desc : '';
    });
    if (pList.length > 1) {
        return '<ul><li>' + pList.join('</li><li>') + '</li></ul>';
    }
    return pList; // single item
};

/**
 *  Gets HTML formatted list of emitted events from the given list. Event
 *  names items are wrapped with code tags. If multiple, formatted as an
 *  HTML unordered list.
 *  @name DocmaWeb.Utils.getEmittedEvents
 *  @function
 *
 *  @param {Array|Object} docsOrApis - Documentation array or APIs object
 *  with signature `{ documentation:Array, symbols:Array }`.
 *  @param {Array} list - List of emitted (fired) events.
 *  @param {Object} [options] - Options.
 *  @param {String} [options.delimeter=", "] - Events delimeter.
 *  @param {Boolean|String} [options.links=false] - Whether to add
 *      HTML anchor links to output. Set to `"internal"` to link
 *      internally (to Docma route with symbol hash, if found) or
 *      `"external"` to link externally (to MDN URL if this is a
 *      JS/Web-API built-in type/object) or `true` to try linking either
 *      to an internal or external target, which ever is found.
 *
 *  @returns {String} -
 */
Utils.getEmittedEvents = function (docsOrApis, list, options) {
    if (!list || list.length === 0) return '';

    var opts = options || {};
    var delim = opts.delimeter || ', ';

    // example:
    // "fires": [
    //     "event:render - some desc." // this is incorrect. no desc allowed here.
    // ]
    var parts, name;
    var events = (list || []).map(function (event) {
        parts = event.split(/\s*[\s-—]\s*/g);
        name = (parts[0] || '').trim(); // .replace(/event:/, '').trim()
        if (opts.links) {
            var parsed = Utils._parseAnchorLinks(docsOrApis, name, {
                linkType: opts.links
            });
            return Utils._wrapCode(parsed, false);
        }
        return Utils._wrapCode(name, true);
    });
    return events.join(delim);
};

// ----------------------
// PRIVATE
// ----------------------

/**
 *  Iterates and gets the first matching item in the array.
 *  @name DocmaWeb.Utils._find
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
Utils._find = function (array, map) {
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
 *  @name DocmaWeb.Utils._assign
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
Utils._assign = function (target, source, enumerable) {
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
 *  @name DocmaWeb.Utils._values
 *  @function
 *  @private
 *
 *  @param {Object} source - Source object.
 *
 *  @returns {Array} -
 */
Utils._values = function (source) {
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
 *  Wraps the whole string within `&lt;code&gt;` tags.
 *  @name DocmaWeb.Utils._wrapCode
 *  @function
 *  @private
 *
 *  @param {String} code - Code to be processed.
 *  @param {Boolean} [escape=true] - Whether to escape open/close tags. i.e.
 *  `&lt;` and `&gt;`.
 *  @param {Boolean} [pre=false] - Whether to also wrap the code with
 *         `&lt;pre&gt;` tags.
 *
 *  @returns {String} -
 */
Utils._wrapCode = function (code, escape, pre) {
    if (typeof code !== 'string') return '';
    if (escape === undefined || escape === true) {
        code = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    code = '<code>' + code + '</code>';
    return pre ? '<pre>' + code + '</pre>' : code;
};

/**
 *  Tokenizes the given string into blocks.
 *  Each block is either a multiline code block (e.g. ```code```) or
 *  regular string block.
 *  @name DocmaWeb.Utils._tokenize
 *  @function
 *  @private
 *
 *  @param {String} string - String to be tokenized.
 *  @param {Function} [callback=identity] - Function to be executed
 *         on each block. Two arguments are passed; `block`, `isCode`.
 *  @returns {Array}
 *           Array of tokenized blocks.
 */
Utils._tokenize = function (string, callback) {
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

/**
 *  Ensures left and/or right slashes for the given string.
 *  @name DocmaWeb.Utils._ensureSlash
 *  @function
 *  @private
 *
 *  @param {Boolean} left - Whether to ensure left slash.
 *  @param {String} str - String to be checked and modified.
 *  @param {Boolean} right - Whether to ensure right slash.
 *
 *  @returns {String} -
 */
Utils._ensureSlash = function (left, str, right) {
    if (!str) return left || right ? '/' : '';
    if (left && str.slice(0, 1) !== '/') str = '/' + str;
    if (right && str.slice(-1) !== '/') str += '/';
    return str;
};

function serializer(replacer) {
    var stack = [];
    var keys = [];

    return function (key, value) {
        // browsers will not print more than 20K
        if (stack.length > 2000) return '[Too Big Object]';

        if (stack.length > 0) {
            var thisPos = stack.indexOf(this);
            if (~thisPos) {
                stack.splice(thisPos + 1);
                keys.splice(thisPos, Infinity, key);
            } else {
                stack.push(this);
                keys.push(key);
            }
            if (stack.indexOf(value) >= 0) {
                // value = cycleReplacer.call(this, key, value);
                value = (stack[0] === value)
                    ? '[Circular ~]'
                    : '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
            }
        } else {
            stack.push(value);
        }

        return !replacer ? value : replacer.call(this, key, value);
    };
}

Utils._safeStringify = function (obj, replacer, spaces) {
    try {
        return JSON.stringify(obj, serializer(replacer), spaces);
    } catch (e) {
        return String(obj);
    }
};

/**
 *  Joins the given strings as a path.
 *  @name DocmaWeb.Utils._joinPath
 *  @function
 *  @private
 *
 *  @param {Array} args - Parts of a path to be joined.
 *  @param {Object} options - Join options.
 *      @param {Boolean} [options.left] - Set to `true` to
 *      ensure the path has a `/` in front of it. `false`
 *      will ensure it has not. Omit to leave it as is.
 *      @param {Boolean} [options.right] - Set to `true` to
 *      ensure the path has a `/` at the end of it. `false`
 *      will ensure it has not. Omit to leave it as is.
 *
 *  @returns {String} -
 */
// Utils._joinPath = function (args, options) {  // NOT USED BUT KEEP THIS
//     options = options || {};
//     var proto = (/^[a-z]*:\/\//i).test(args[0]) ? args.shift() : '';
//     var p = args.join('/').replace(/\/+/g, '/');

//     var left = p[0] === '/';
//     var right = p.slice(-1) === '/';

//     if (proto || options.left === false) {
//         p = p.slice(1);
//     } else if (options.left === true) {
//         if (!left) p = '/' + p;
//     }

//     if (options.right === true) {
//         if (!right) p += '/';
//     } else if (options.right === false) {
//         if (right) p = p.slice(0, -1);
//     }

//     return proto + p;
// };

// ----------------------
// DOM Utils
// ----------------------

// e.g. #Docma%7EBuildConfiguration will not work if "%7E" is not decoded to "~".
function decodeHash(hash) {
    // return hash.replace(/%7E/gi, '~').replace(/^#/, '');
    return decodeURIComponent(hash).replace(/^#/, '');
}

/**
 *  DOM utilities.
 *  @name DocmaWeb.Utils.DOM
 *  @namespace
 *  @type {Object}
 */
Utils.DOM = {};

// this is an attribute name used to mark style tags found within the body,
// that are moved to the head of the document.
var ATTR_BODY_STYLE = 'data-body-style';

/**
 *  Gets the offset coordinates of the given element, relative to document
 *  body.
 *  @name DocmaWeb.Utils.DOM.getOffset
 *  @function
 *  @static
 *
 *  @param {HTMLElement} e - Target element.
 *  @returns {Object|null} -
 */
Utils.DOM.getOffset = function (e) {
    var elem = typeof e === 'object' ? e : document.getElementById(e);
    if (!elem) return;
    var rect = elem.getBoundingClientRect();
    // Make sure element is not hidden (display: none) or disconnected
    if (rect.width || rect.height || elem.getClientRects().length) {
        var docElem = document.documentElement;
        return {
            top: rect.top + window.pageYOffset - docElem.clientTop,
            left: rect.left + window.pageXOffset - docElem.clientLeft
        };
    }
};

/**
 *  Scrolls the document to the given hash target.
 *  @name DocmaWeb.Utils.DOM.scrollTo
 *  @function
 *  @static
 *
 *  @param {String} [hash] - Bookmark target. If omitted, document is
 *  scrolled to the top.
 */
Utils.DOM.scrollTo = function (hash) {
    // Some browsers place the overflow at the <html> level, unless else is
    // specified. Therefore, we use the documentElement property for these
    // browsers
    var body = document.documentElement // Chrome, Firefox, IE/Edge, Opera
        || document.body; // safari
    hash = decodeHash(hash || window.location.hash || '');
    if (!hash) {
        body.scrollTop = 0;
        return;
    }
    var elem = document.getElementById(hash);
    if (!elem) return;
    var offset = Utils.DOM.getOffset(elem);
    if (offset) body.scrollTop = offset.top;
};

/**
 *  Creates and appends a child DOM element to the target, from the given
 *  element definition.
 *  @private
 *  @name DocmaWeb.Utils.DOM._createChild
 *  @function
 *  @static
 *
 *  @param {HTMLElement} target
 *         Target container element.
 *  @param {String} [type="div"]
 *         Type of the element to be appended.
 *  @param {Object} [attrs]
 *         Element attributes.
 *
 *  @returns {HTMLElement} - Appended element.
 */
Utils.DOM._createChild = function (target, type, attrs) {
    attrs = attrs || {};
    var el = document.createElement(type || 'div');
    Object.keys(attrs).forEach(function (key) {
        el[key] = attrs[key]; // e.g. id, innerHTML, etc...
    });
    target.appendChild(el);
    return el;
};

/**
 *  Removes the style tags that are previously marked to indicate that they
 *  were moved from the body to head.
 *  @private
 *  @name DocmaWeb.Utils.DOM._removePrevBodyStyles
 *  @function
 *  @static
 */
Utils.DOM._removePrevBodyStyles = function () {
    var head = document.getElementsByTagName('head')[0];
    var prevBodyStyles = head.querySelectorAll('[' + ATTR_BODY_STYLE + ']');
    while (prevBodyStyles.length > 0) {
        prevBodyStyles[0].parentNode.removeChild(prevBodyStyles[0]);
    }
};

/**
 *  Moves style tags found within the body and appends them to the head of
 *  the document.
 *  @private
 *  @name DocmaWeb.Utils.DOM._moveBodyStylesToHead
 *  @function
 *  @static
 */
Utils.DOM._moveBodyStylesToHead = function () {
    var head = document.getElementsByTagName('head')[0];
    var stylesInBody = document.body.getElementsByTagName('style');
    var i, styleElem;
    for (i = 0; i < stylesInBody.length; i++) {
        styleElem = stylesInBody[i];
        styleElem.parentNode.removeChild(styleElem);
        styleElem.setAttribute(ATTR_BODY_STYLE, '');
        head.appendChild(styleElem);
    }
};

// ----------------------
// LINKS for JS & WEB-API BUILT-IN Objects/Types
// ----------------------

// Data below is around 5KB.

var _builtinURLs = {
    globals: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/',
    statements: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/',
    operators: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/',
    functions: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/',
    web: 'https://developer.mozilla.org/en-US/docs/Web/API/'
};
var _builtins = {
    globals: [
        'Infinity',
        'NaN',
        'undefined',
        'null',
        'Object',
        'Function',
        'function',
        'Boolean',
        'boolean',
        'Symbol',
        'Error',
        'EvalError',
        'InternalError',
        'RangeError',
        'ReferenceError',
        'SyntaxError',
        'TypeError',
        'URIError',
        'Number',
        'number',
        'Math',
        'Date',
        'String',
        'string',
        'RegExp',
        'Array',
        'Int8Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Int16Array',
        'Uint16Array',
        'Int32Array',
        'Uint32Array',
        'Float32Array',
        'Float64Array',
        'Map',
        'Set',
        'WeakMap',
        'WeakSet',
        'ArrayBuffer',
        'DataView',
        'JSON',
        'Promise',
        'Generator',
        'GeneratorFunction',
        'Reflect',
        'Proxy',
        'TypedArray',
        'Intl',
        'Intl.Collator',
        'Intl.DateTimeFormat',
        'Intl.NumberFormat',
        'WebAssembly',
        'WebAssembly.Module',
        'WebAssembly.Instance',
        'WebAssembly.Memory',
        'WebAssembly.Table',
        'WebAssembly.CompileError',
        'WebAssembly.LinkError',
        'WebAssembly.RuntimeError'
    ],
    statements: [
        'function',
        'function*',
        'async function',
        'class',
        'debugger'
    ],
    operators: [
        'void',
        'super',
        'this'
    ],
    functions: [
        'arguments'
    ],
    web: [
        'AbstractWorker',
        'AnalyserNode',
        'AudioBuffer',
        'AudioContext',
        'AudioListener',
        'AudioNode',
        'BaseAudioContext',
        'BeforeUnloadEvent',
        'Blob',
        'BlobEvent',
        'BufferSource',
        'ByteString',
        'CSSMediaRule',
        'CSSPageRule',
        'CSSPrimitiveValue',
        'CSSRule',
        'CSSRuleList',
        'CSSStyleDeclaration',
        'CSSStyleRule',
        'CSSStyleSheet',
        'CSSSupportsRule',
        'CSSValue',
        'CSSValueList',
        'CloseEvent',
        'CompositionEvent',
        'Console',
        'Coordinates',
        'Crypto',
        'CryptoKey',
        'CustomEvent',
        'DOMException',
        'DOMImplementation',
        'Document',
        'DocumentFragment',
        'DocumentType',
        'DoubleRange',
        'DragEvent',
        'Element',
        'ErrorEvent',
        'Event',
        'EventListener',
        'EventSource',
        'EventTarget',
        'File',
        'FileList',
        'FileReader',
        'FileReaderSync',
        'FormData',
        'Geolocation',
        'HTMLAnchorElement',
        'HTMLAreaElement',
        'HTMLAudioElement',
        'HTMLBRElement',
        'HTMLBaseElement',
        'HTMLBodyElement',
        'HTMLButtonElement',
        'HTMLCanvasElement',
        'HTMLCollection',
        'HTMLDListElement',
        'HTMLDataElement',
        'HTMLDataListElement',
        'HTMLDetailsElement',
        'HTMLDivElement',
        'HTMLDocument',
        'HTMLElement',
        'HTMLEmbedElement',
        'HTMLFieldSetElement',
        'HTMLFormControlsCollection',
        'HTMLFormElement',
        'HTMLHRElement',
        'HTMLHeadElement',
        'HTMLHeadingElement',
        'HTMLHtmlElement',
        'HTMLIFrameElement',
        'HTMLImageElement',
        'HTMLInputElement',
        'HTMLKeygenElement',
        'HTMLLIElement',
        'HTMLLabelElement',
        'HTMLLegendElement',
        'HTMLLinkElement',
        'HTMLMapElement',
        'HTMLMediaElement',
        'HTMLMetaElement',
        'HTMLMeterElement',
        'HTMLModElement',
        'HTMLOListElement',
        'HTMLObjectElement',
        'HTMLOptGroupElement',
        'HTMLOptionElement',
        'HTMLOptionsCollection',
        'HTMLOutputElement',
        'HTMLParagraphElement',
        'HTMLParamElement',
        'HTMLPreElement',
        'HTMLProgressElement',
        'HTMLQuoteElement',
        'HTMLScriptElement',
        'HTMLSelectElement',
        'HTMLSlotElement',
        'HTMLSourceElement',
        'HTMLSpanElement',
        'HTMLStyleElement',
        'HTMLTableCaptionElement',
        'HTMLTableCellElement',
        'HTMLTableColElement',
        'HTMLTableDataCellElement',
        'HTMLTableElement',
        'HTMLTableHeaderCellElement',
        'HTMLTableRowElement',
        'HTMLTableSectionElement',
        'HTMLTemplateElement',
        'HTMLTextAreaElement',
        'HTMLTimeElement',
        'HTMLTitleElement',
        'HTMLTrackElement',
        'HTMLUListElement',
        'HTMLUnknownElement',
        'HTMLVideoElement',
        'HashChangeEvent',
        'History',
        'ImageData',
        'InputEvent',
        'KeyboardEvent',
        'LinkStyle',
        'Location',
        'LongRange',
        'MediaDevices',
        'MediaDeviceInfo',
        'MediaError',
        'MediaRecorder',
        'MediaStream',
        'MessageChannel',
        'MessageEvent',
        'MessagePort',
        'MouseEvent',
        'MutationObserver',
        'MutationRecord',
        'NamedNodeMap',
        'Navigator',
        'NavigatorGeolocation',
        'Node',
        'NodeIterator',
        'NodeList',
        'NonDocumentTypeChildNode',
        'Notification',
        'PageTransitionEvent',
        'PointerEvent',
        'PopStateEvent',
        'Position',
        'PositionError',
        'PositionOptions',
        'ProgressEvent',
        'PromiseRejectionEvent',
        'RTCCertificate',
        'RTCConfiguration',
        'RTCDTMFSender',
        'RTCDTMFToneChangeEvent',
        'RTCDataChannel',
        'RTCPeerConnection',
        'RTCPeerConnection',
        'RTCRtpCodecParameters',
        'RTCRtpContributingSource',
        'RTCRtpReceiver',
        'RTCRtpSender',
        'RTCRtpSynchronizationSource',
        'RTCRtpTransceiver',
        'RTCRtpTransceiverDirection',
        'RTCRtpTransceiverInit',
        'RTCStatsReport',
        'RadioNodeList',
        'RandomSource',
        'Range',
        'RenderingContext',
        'SVGAnimateElement',
        'SVGAnimateMotionElement',
        'SVGAnimateTransformElement',
        'SVGAnimationElement',
        'SVGCircleElement',
        'SVGClipPathElement',
        'SVGCursorElement',
        'SVGElement',
        'SVGEllipseElement',
        'SVGEvent',
        'SVGFilterElement',
        'SVGGeometryElement',
        'SVGGradientElement',
        'SVGGraphicsElement',
        'SVGImageElement',
        'SVGLineElement',
        'SVGLinearGradientElement',
        'SVGMPathElement',
        'SVGMaskElement',
        'SVGMetadataElement',
        'SVGPathElement',
        'SVGPatternElement',
        'SVGPolygonElement',
        'SVGPolylineElement',
        'SVGRadialGradientElement',
        'SVGRect',
        'SVGRectElement',
        'SVGSVGElement',
        'SVGScriptElement',
        'SVGSetElement',
        'SVGStopElement',
        'SVGStyleElement',
        'SVGSwitchElement',
        'SVGSymbolElement',
        'SVGTSpanElement',
        'SVGTextContentElement',
        'SVGTextElement',
        'SVGTextPathElement',
        'SVGTextPositioningElement',
        'SVGTitleElement',
        'SVGTransform',
        'SVGTransformList',
        'SVGTransformable',
        'SVGUseElement',
        'SVGViewElement',
        'ShadowRoot',
        'SharedWorker',
        'Storage',
        'StorageEvent',
        'StyleSheet',
        'StyleSheetList',
        'Text',
        'TextMetrics',
        'TimeEvent',
        'TimeRanges',
        'Touch',
        'TouchEvent',
        'TouchList',
        'Transferable',
        'TreeWalker',
        'UIEvent',
        'URL',
        'WebGLActiveInfo',
        'WebGLBuffer',
        'WebGLContextEvent',
        'WebGLFramebuffer',
        'WebGLProgram',
        'WebGLRenderbuffer',
        'WebGLRenderingContext',
        'WebGLShader',
        'WebGLTexture',
        'WebGLUniformLocation',
        'WebGLVertexArrayObject',
        'WebSocket',
        'WheelEvent',
        'Window',
        'Worker',
        'WorkerGlobalScope',
        'WorkerLocation',
        'WorkerNavigator',
        'XMLHttpRequest',
        'XMLHttpRequestEventTarget',
        'XMLSerializer',
        'XPathExpression',
        'XPathResult',
        'XSLTProcessor'
    ]
};

/** @private */
var _cats = Object.keys(_builtins);

/**
 *  Gets an external link for documentation of the given type or object.
 *  @private
 *  @param {String} type -
 *  @returns {String} -
 */
Utils._getTypeExternalLink = function (type) {
    var i, cat;
    for (i = 0; i < _cats.length; i++) {
        cat = _cats[i];
        if (_builtins[cat].indexOf(type) >= 0) {
            return _builtinURLs[cat] + (type || '').replace(/^([^.]*\.)/, '');
            // e.g. remove "WebAssembly." from "WebAssembly.Instance" bec. MDN link is .../Instance
        }
    }
    return '';
};
