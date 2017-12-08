
var fs = require('fs-extra'),
    Promise = require('bluebird'),
    jsdom = require('jsdom');

module.exports = (function () {
    'use strict';

    var dom = Promise.promisify(jsdom.env);

    // http://stackoverflow.com/a/5654032/112731
    var COMMENT_PSEUDO_COMMENT_OR_LT_BANG = new RegExp(
        '<!--[\\s\\S]*?(?:-->)?'
        + '<!---+>?' // A comment with no body
        + '|<!(?![dD][oO][cC][tT][yY][pP][eE]|\\[CDATA\\[)[^>]*>?'
        + '|<[?][^>]*>?', // A pseudo-comment
        'g');

    // --------------------------------
    // CLASS: DOMUtil
    // --------------------------------

    var DOMUtil = {
        EMPTY_HTML: '<!DOCTYPE html>\n<html>\n\n<head>\n</head>\n\n<body>\n</body>\n\n</html>',
        N_TAB: '\n    '
    };

    DOMUtil.getDocTypeElement = function (winOrDoc) {
        var node = winOrDoc.doctype || winOrDoc.document.doctype;
        return node ? '<!DOCTYPE '
             + node.name
             + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
             + (!node.publicId && node.systemId ? ' SYSTEM' : '')
             + (node.systemId ? ' "' + node.systemId + '"' : '')
             + '>' : '';
    };

    DOMUtil.getDocHTML = function (obj) {
        var document = obj.document || obj;
        return document.documentElement.outerHTML;
    };

    DOMUtil.getDocFullHTML = function (obj) {
        var docType = DOMUtil.getDocTypeElement(obj);
        return docType + '\n' + DOMUtil.getDocHTML(obj);
    };

    DOMUtil.getScriptElem = function (src) {
        return '<script type="text/javascript" src="' + src + '"></script>';
    };

    DOMUtil.getScriptDomElem = function (obj, src) {
        var document = obj.document || obj,
            script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        return script;
    };

    DOMUtil.getStyleElem = function (href) {
        return '<link rel="stylesheet" type="text/css" href="' + href + '">';
    };

    DOMUtil.getMetaElem = function (obj) {
        var attrs = Object.keys(obj).map(function (key) {
            return key + '="' + obj[key] + '"';
        }).join(' ');
        return '<meta ' + attrs + '>';
    };

    DOMUtil.removeComments = function (obj) {
        var html = typeof obj !== 'string'
            ? DOMUtil.getDocFullHTML(obj)
            : obj;
        return html.replace(COMMENT_PSEUDO_COMMENT_OR_LT_BANG, '');
    };

    DOMUtil.removeElementsByClass = function (obj, className) {
        var document = obj.document || obj,
            elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    };

    /**
     *  Creates and appends a DOM element to the target, from the given element
     *  definition.
     *  @private
     *
     *  @param {Object} obj - `window` or `document`.
     *  @param {HTMLElement} target - Target container element.
     *  @param {String} [type="div"] - Type of the element to be appended.
     *  @param {Object} [attrs] - Element attributes.
     *
     *  @returns {HTMLElement} - Appended element.
     */
    DOMUtil.appendTo = function (obj, target, type, attrs) {
        attrs = attrs || {};
        var document = obj.document || obj,
            el = document.createElement(type || 'div');
        Object.keys(attrs).forEach(function (key) {
            el[key] = attrs[key]; // e.g. id, innerHTML, etc...
        });
        target.appendChild(el);
        return el;
    };

    DOMUtil.insertAsFirst = function (obj, type, attrs) {
        attrs = attrs || {};
        var document = obj.document || obj,
            elems = document.getElementsByTagName(type),
            head = document.getElementsByTagName('head')[0];
        var el = document.createElement(type);
        Object.keys(attrs).forEach(function (key) {
            el[key] = attrs[key];
        });
        if (elems.length) {
            head.insertBefore(el, elems[0]);
        } else {
            head.appendChild(el);
        }
    };

    // ---------------------------
    // CLASS
    // ---------------------------

    function HTMLParser(content) {
        this.content = content || DOMUtil.EMPTY_HTML;
    }

    // ---------------------------
    // STATIC MEMBERS
    // ---------------------------

    HTMLParser.DOMUtil = DOMUtil;

    // ---------------------------
    // STATIC METHODS
    // ---------------------------

    HTMLParser.create = function (content) {
        return new HTMLParser(content);
    };

    HTMLParser.fromFile = function (filePath) {
        return fs.readFileAsync(filePath, 'utf8')
            .then(function (content) {
                return new HTMLParser(content);
            });
    };
    HTMLParser.fromFileAsync = HTMLParser.fromFile;

    HTMLParser.fromFileSync = function (filePath) {
        var content = fs.readFileSync(filePath, 'utf8');
        return new HTMLParser(content);
    };

    // ---------------------------
    // INSTANCE METHODS
    // ---------------------------

    HTMLParser.prototype.writeFile = function (filePath) {
        var $this = this;
        return fs.writeFileAsync(filePath, this.content || '', 'utf8')
            .thenReturn($this);
    };
    HTMLParser.prototype.writeFileAsync = HTMLParser.prototype.writeFile;

    HTMLParser.prototype.writeFileSync = function (filePath) {
        fs.writeFileSync(filePath, this.content || '', 'utf8');
        return this;
    };

    HTMLParser.prototype.removeComments = function () {
        this.content = DOMUtil.removeComments(this.content);
        return this;
    };

    HTMLParser.prototype.beautify = function () {
        var replacer = '$1' + DOMUtil.N_TAB + '$2';
        this.content = this.content.replace(/(<html>)(<)/i, '$1\n$2')
            .replace(/(<\/body>)(<)/i, '$1\n$2')
            .replace(/(>)(<title)/gi, replacer)
            .replace(/(>)(<meta)/gi, replacer)
            .replace(/(>)(<script)/gi, replacer)
            .replace(/(>)(<link)/gi, replacer);
        return this;
    };

    HTMLParser.prototype.parseMarkdownTasks = function (className) {
        var re = /<li>\s*\[(x| )?\]\s*/gi, // tasks
            cls = className ? ' class="' + className + '"' : '';
        this.content = this.content.replace(re, function (match, p1) { // , offset, string
            var checked = p1 === 'x' || p1 === 'X' ? 'checked ' : '';
            return '<li' + cls + '><input type="checkbox" disabled ' + checked + '/> &nbsp;';
        });
        return this;
    };

    /**
     *  Promises the HTML content as a virtual DOM and allows editing its
     *  contents.
     *
     *  @param {Function} fnEdit - Edit function that takes `window` as the
     *  single argument.
     *  @param {Array} [scripts=null] - Temporary scripts to be loaded.
     *  For example, you can use jQuery via `window.$` reference, by passing
     *  `[<jQuery-URL>]`. All scripts loaded will be removed automatically
     *  afterwards.
     *
     *  @returns {Promise}
     *
     *  @example
     *  var scrips = ['https://code.jquery.com/jquery.min.js'];
     *  parser.edit(function (window) {
     *      var $ = window.$;
     *      $('body').append('<div>Hello World.</div>');
     *  }, scripts)
     *  .then(function (parser) {
     *  	return parser.writeFile(filePath);
     *  });
     */
    HTMLParser.prototype.edit = function (fnEdit, scripts) {
        var $this = this;
        return dom($this.content, scripts)
            .then(function (window) {
                if (typeof fnEdit === 'function') {
                    // execute user's edit function
                    fnEdit(window);
                    // when scripts added by jsdom, they're marked with
                    // class="jsdom". So we'll remove jQuery (and others if
                    // exist).
                    if (Array.isArray(scripts) && scripts.length > 0) {
                        // if (window.$) window.$('script[class=jsdom]').remove();
                        DOMUtil.removeElementsByClass(window, 'jsdom');
                    }
                    $this.content = DOMUtil.getDocFullHTML(window);
                    // free memory
                    window.close();
                }
                return $this;
            });
    };

    // ---------------------------

    return HTMLParser;

})();
