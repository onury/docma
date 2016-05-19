
var fs = require('fs-extra'),
    Promise = require('bluebird'),
    jsdom = require('jsdom');

module.exports = (function () {
    'use strict';

    var dom = Promise.promisify(jsdom.env);

    // http://stackoverflow.com/a/5654032/112731
    var COMMENT_PSEUDO_COMMENT_OR_LT_BANG = new RegExp(
        '<!--[\\s\\S]*?(?:-->)?'
        + '<!---+>?'  // A comment with no body
        + '|<!(?![dD][oO][cC][tT][yY][pP][eE]|\\[CDATA\\[)[^>]*>?'
        + '|<[?][^>]*>?',  // A pseudo-comment
        'g');

    var EMPTY_HTML = '<!DOCTYPE html>\n<html>\n\n<head>\n</head>\n\n<body>\n</body>\n\n</html>';

    // --------------------------------
    // CLASS: DOMUtil
    // --------------------------------

    var DOMUtil = {};

    DOMUtil.getDocTypeElement = function (winOrDoc) {
        var node = winOrDoc.doctype || winOrDoc.document.doctype;
        return node ? "<!DOCTYPE "
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

    DOMUtil.getScriptElem = function (src) {
        return '<script type="text/javascript" src="' + src + '"></script>';
    };

    DOMUtil.getMetaElem = function (obj) {
        var attrs = Object.keys(obj).map(function (key) {
            return key + '="' + obj[key] + '"';
        }).join(' ');
        return '<meta ' + attrs + '>';
    };

    // ---------------------------
    // CLASS
    // ---------------------------

    function HTMLParser(content) {
        this.content = content || EMPTY_HTML;
    }

    // ---------------------------
    // STATIC MEMBERS
    // ---------------------------

    HTMLParser.DOMUtil = DOMUtil;

    HTMLParser.URL = {
        JQUERY: 'https://code.jquery.com/jquery.min.js'
    };

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
     *  parser.edit(function (window) {
     *      var $ = window.$;
     *      $('body').append('<div>Hello World.</div>');
     *  }))
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
