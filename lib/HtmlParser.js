/* eslint prefer-template:0 */

'use strict';

const fs = require('fs-extra');
const path = require('path');

const Promise = require('bluebird');
const JSDOM = require('jsdom').JSDOM;

const JQUERY_PATH = path.join(__dirname, 'web', 'components', 'jquery.min.js');
let JQUERY_SCRIPT;

// http://stackoverflow.com/a/5654032/112731
const COMMENT_PSEUDO_COMMENT_OR_LT_BANG = new RegExp(
    '<!--[\\s\\S]*?(?:-->)?'
    + '<!---+>?' // A comment with no body
    + '|<!(?![dD][oO][cC][tT][yY][pP][eE]|\\[CDATA\\[)[^>]*>?'
    + '|<[?][^>]*>?', // A pseudo-comment
    'g'
);

// --------------------------------
// HELPERS
// --------------------------------

// Instead of appending a script tag with src attribute  (e.g. <script
// src="/script.js">); this reads the script file and inserts the code
// within a script tag. This is bec. we cannot know when a dynamically
// inserted script loads.
// see https://github.com/tmpvar/jsdom/issues/640#issuecomment-22216965
function _promiseAppendJQuery(obj) {
    const document = obj.document || obj;
    // append to body
    return Promise.resolve()
        .then(() => {
            if (JQUERY_SCRIPT) return JQUERY_SCRIPT;
            return fs.readFile(JQUERY_PATH, 'utf8');
        })
        .then(src => {
            JQUERY_SCRIPT = src;
            const el = document.createElement('script');
            el.type = 'text/javascript';
            el.innerHTML = src;
            el.className = 'jsdom-jquery';
            document.body.appendChild(el);
            return obj;
        });
}

// --------------------------------
// CLASS: DOM
// --------------------------------

const DOM = {
    EMPTY_HTML: '<!DOCTYPE html>\n<html>\n\n<head>\n</head>\n\n<body>\n</body>\n\n</html>',
    N_TAB: '\n    ',

    getDocTypeElement(winOrDoc) {
        const node = winOrDoc.doctype || winOrDoc.document.doctype;
        return node ? '<!DOCTYPE '
            + node.name
            + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
            + (!node.publicId && node.systemId ? ' SYSTEM' : '')
            + (node.systemId ? ' "' + node.systemId + '"' : '')
            + '>' : '';
    },

    getDocHTML(obj) {
        const document = obj.document || obj;
        return document.documentElement.outerHTML;
    },

    getDocFullHTML(obj) {
        const docType = DOM.getDocTypeElement(obj);
        return docType + '\n' + DOM.getDocHTML(obj);
    },

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
    getScriptElem(options) {
        options = typeof options === 'string'
            ? { src: options }
            : options || {};
        const src = options.src;
        const async = options.async ? ' async' : '';
        const defer = options.defer ? ' defer="defer"' : '';
        const crossorigin = options.crossorigin
            ? ` crossorigin="${options.crossorigin}"`
            : '';
        // used to mark the script element with a class name if needed
        const className = options.className
            ? ` class="${options.className}"`
            : '';
        return `<script src="${src}"${async}${defer}${crossorigin}${className}></script>`;
    },

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
    getScriptDomElem(obj, options) {
        options = typeof options === 'string'
            ? { src: options }
            : options || {};

        const document = obj.document || obj;
        const script = document.createElement('script');
        // script.type = 'text/javascript';
        script.src = options.src;
        if (options.async) script.async = true;
        if (options.defer) script.defer = 'defer';
        if (options.crossorigin) script.crossorigin = options.crossorigin;
        // used to mark the script element with a class name if needed
        if (options.className) script.className = options.className;
        return script;
    },

    getStyleElem(href) {
        return '<link rel="stylesheet" type="text/css" href="' + href + '">';
    },

    getMetaElem(obj) {
        const attrs = Object.keys(obj)
            .map(key => key + '="' + obj[key] + '"')
            .join(' ');
        return '<meta ' + attrs + '>';
    },

    removeComments(obj) {
        const html = typeof obj !== 'string'
            ? DOM.getDocFullHTML(obj)
            : obj;
        return html.replace(COMMENT_PSEUDO_COMMENT_OR_LT_BANG, '');
    },

    removeElementsByClass(obj, className) {
        const document = obj.document || obj,
            elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    },

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
    appendTo(obj, target, type = 'div', attrs = {}) {
        attrs = attrs || {};
        const document = obj.document || obj;
        const el = document.createElement(type || 'div');
        Object.keys(attrs).forEach(key => {
            el[key] = attrs[key]; // e.g. id, innerHTML, etc...
        });
        target.appendChild(el);
        return el;
    },

    insertAsFirst(obj, type, attrs = {}) {
        attrs = attrs || {};
        const document = obj.document || obj;
        const elems = document.getElementsByTagName(type);
        const head = document.getElementsByTagName('head')[0];
        const el = document.createElement(type);
        Object.keys(attrs).forEach(key => {
            el[key] = attrs[key];
        });
        if (elems.length) {
            head.insertBefore(el, elems[0]);
        } else {
            head.appendChild(el);
        }
    },

    /**
     *  Inserts script tags with the given source paths.
     *
     *  @param {Object} obj - `window` or `document`.
     *  @param {Stirng|Array} scriptPaths - Paths of the scripts to be
     *  appended to the body of the document.
     *  @param {String} [className] - This is used to mark the script element
     *  with a class name if needed.
     */
    insertScripts(obj, scriptPaths, className) {
        const document = obj.document || obj;
        // ensure array
        if (!Array.isArray(scriptPaths)) scriptPaths = [scriptPaths];
        // append scripts to body
        scriptPaths.forEach(scriptPath => {
            const el = document.createElement('script');
            el.src = scriptPath;
            if (className) el.className = className;
            document.body.appendChild(el);
        });
    }
};

// ---------------------------
// CLASS: HTMLParser
// ---------------------------

class HTMLParser {

    constructor(content) {
        this.content = content || DOM.EMPTY_HTML;
    }

    // ---------------------------
    // STATIC MEMBERS
    // ---------------------------

    static get DOM() {
        return DOM;
    }

    // ---------------------------
    // STATIC METHODS
    // ---------------------------

    static create(content) {
        return new HTMLParser(content);
    }

    static fromFile(filePath) {
        return fs.readFile(filePath, 'utf8')
            .then(content => new HTMLParser(content));
    }

    static fromFileSync(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        return new HTMLParser(content);
    }

    // ---------------------------
    // INSTANCE METHODS
    // ---------------------------

    writeFile(filePath) {
        return fs.writeFile(filePath, this.content || '', 'utf8')
            .then(() => this);
    }

    writeFileSync(filePath) {
        fs.writeFileSync(filePath, this.content || '', 'utf8');
        return this;
    }

    removeComments() {
        this.content = DOM.removeComments(this.content);
        return this;
    }

    beautify() {
        const replacer = '$1' + DOM.N_TAB + '$2';
        this.content = this.content.replace(/(<html>)(<)/i, '$1\n$2')
            .replace(/(<\/body>)(<)/i, '$1\n$2')
            .replace(/(>)(<title)/gi, replacer)
            .replace(/(>)(<meta)/gi, replacer)
            .replace(/(>)(<script)/gi, replacer)
            .replace(/(>)(<link)/gi, replacer);
        return this;
    }

    parseMarkdownTasks(className) {
        const re = /<li>\s*\[(x| )?\]\s*/gi; // tasks
        const cls = className ? ' class="' + className + '"' : '';
        this.content = this.content.replace(re, (match, p1) => { // , offset, string
            const checked = p1 === 'x' || p1 === 'X' ? 'checked ' : '';
            return '<li' + cls + '><input type="checkbox" disabled ' + checked + '/> &nbsp;';
        });
        return this;
    }

    /**
     *  Promises the HTML content as a virtual DOM and allows editing its
     *  contents.
     *
     *  @param {Function} editCallback - Edit function with the following signature:
     *  `function (window, $) { ... }`
     *
     *  @returns {Promise<HTMLParser>} -
     *
     *  @example
     *  parser.edit(function (window, $) {
     *      $('body').append('<div>Hello World.</div>');
     *  })
     *  .then(function (parser) {
     *  	return parser.writeFile(filePath);
     *  });
     */
    edit(editCallback) {
        if (typeof editCallback !== 'function') return Promise.resolve(this);

        const jsdomOpts = {
            contentType: 'text/html',
            userAgent: 'Docma',
            runScripts: 'dangerously'
        };
        const dom = new JSDOM(this.content, jsdomOpts);
        const window = dom.window;

        return _promiseAppendJQuery(window)
            .then(window => {
                // execute user's edit function
                editCallback(window, window.$);
                // remove jQuery script we've added.
                DOM.removeElementsByClass(window, 'jsdom-jquery');
                this.content = DOM.getDocFullHTML(window);
                // free memory
                window.close();
                return this; // parser
            });
    }
}

module.exports = HTMLParser;
