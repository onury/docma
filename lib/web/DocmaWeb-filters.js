/* global DocmaWeb, dust */
/* eslint max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// DocmaWeb (Dust) filters
// https://github.com/onury/docma
// --------------------------------

dust.filters = dust.filters || {};

dust.filters.$pt = function (str) {
    return DocmaWeb.Utils.parseTicks(str);
};

dust.filters.$pnl = function (str) {
    return DocmaWeb.Utils.parseNewLines(str, { keepIfSingle: true });
};

dust.filters.$pl = function (str) {
    return DocmaWeb.Utils.parseLinks(str);
};

dust.filters.$tl = function (str) {
    return DocmaWeb.Utils.trimLeft(str);
};

dust.filters.$tnl = function (str) {
    return DocmaWeb.Utils.trimNewLines(str);
};

dust.filters.$p = function (str) {
    return DocmaWeb.Utils.parse(str, { keepIfSingle: true });
};

dust.filters.$nt = function (str) {
    return DocmaWeb.Utils.normalizeTabs(str);
};

dust.filters.$desc = function (symbol) {
    return DocmaWeb.Utils.parse(symbol.classdesc || symbol.description || '');
};

var reJSValues = (/true|false|null|undefined|Infinity|NaN|\d+|Number\.\w+|Math\.(PI|E|LN(2|10)|LOG(2|10)E|SQRT(1_)?2)|\[.*?]|\{.*?}|new [a-zA-Z]+.*|\/.+\/[gmiu]*|Date\.(now\(\)|UTC\(.*)|window|document/);

function getFormatValue(symbol, val) {
    if (arguments.length < 2) {
        val = DocmaWeb.Utils.notate(symbol, 'meta.code.value') || symbol.defaultvalue;
    }
    // if (val === undefined) return 'undefined';
    if (typeof val !== 'string') return String(val);
    var types = DocmaWeb.Utils.notate(symbol, 'type.names') || [];
    // first char is NOT a single or double quote or tick
    if (!(/['"`]/).test(val.slice(0, 1))
        // types include "String"
        && types.indexOf('String') >= 0
        // only "String" type or value is NOT a JS non-string value/keyword
        && (types.length === 1 || reJSValues.indexOf(val) === -1)) {
        return '"' + val + '"';
    }
    return String(val);
}

dust.filters.$def = function (symbolOrParam) {
    if (!symbolOrParam.hasOwnProperty('defaultvalue')) return 'undefined';
    return getFormatValue(symbolOrParam, symbolOrParam.defaultvalue);
};

dust.filters.$val = function (symbol) {
    return getFormatValue(symbol);
};

dust.filters.$id = function (symbol) {
    var id;
    if (typeof symbol === 'string') {
        id = symbol;
    } else {
        var nw = DocmaWeb.Utils.isConstructor(symbol) ? 'new-' : '';
        id = nw + symbol.$longname; // DocmaWeb.Utils.getFullName(symbol);
    }
    return id.replace(/ /g, '-');
};
