/* global docma */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// docma.web.dom
// https://github.com/onury/docma

'use strict';

(function () {

    // e.g. #Docma%7EBuildConfiguration will not work if "%7E" is not decoded to "~".
    function decodeHash(hash) {
        // return hash.replace(/%7E/gi, '~').replace(/^#/, '');
        return decodeURIComponent(hash).replace(/^#/, '');
    }

    // --------------------------------
    // DOM METHODS
    // --------------------------------

    var dom = {};

    /**
     *  Creates and appends a child DOM element to the target, from the given
     *  element definition.
     *  @private
     *  @memberof docma.dom
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
    dom.createChild = function (target, type, attrs) {
        attrs = attrs || {};
        var el = document.createElement(type || 'div');
        Object.keys(attrs).forEach(function (key) {
            el[key] = attrs[key]; // e.g. id, innerHTML, etc...
        });
        target.appendChild(el);
        return el;
    };

    /**
     *  Gets Docma main DOM element which the Dust templates will be rendered
     *  into.
     *  @private
     *  @memberof docma.dom
     *
     *  @returns {HTMLElement} - Docma main DOM element.
     */
    dom.getDocmaElem = function () {
        var docmaElem = document.getElementById(docma._.elementID);
        if (!docmaElem) {
            docmaElem = dom.createChild(document.body, 'div', {
                id: docma._.elementID
            });
        }
        return docmaElem;
    };

    /**
     *  Gets Docma content DOM element that the HTML content will be loaded
     *  into. This should be called for `docma-content` partial.
     *  @private
     *  @memberof docma.dom
     *
     *  @returns {HTMLElement} - Docma content DOM element.
     */
    dom.getContentElem = function () {
        // docma-content template (should) have a
        // <div id="docma-content"></div> element whithin.
        var dContent = document.getElementById(docma._.contentElementID);
        if (!dContent) {
            // this is fatal, so we always throw if invalid content partial
            // TODO: this should be checked during build process
            throw new Error('Partial ' + docma._.partials.content + ' should have an element with id="' + docma._.contentElementID + '".');
        }
        return dContent;
    };

    /**
     *  Loads dust-compiled HTML content into `docma-main` element.
     *  @private
     *  @memberof docma.dom
     *
     *  @param {String} compiledHTML - Dust-compiled HTML content.
     */
    dom.loadCompiledContent = function (compiledHTML) {
        // load compiled content into <div id="docma-main"></div>
        var docmaElem = dom.getDocmaElem();
        docmaElem.innerHTML = compiledHTML;
        // dom.fixAnchors();
    };

    /**
     *  Loads the given HTML content into `docma-content` element.
     *  @private
     *  @memberof docma.dom
     *
     *  @param {String} html - Content to be loaded.
     */
    dom.loadContent = function (html) {
        var dContent = dom.getContentElem();
        dContent.innerHTML = html;
        // dom.fixAnchors();
        dom.scrollTo(); // top
    };

    /**
     *  Gets the offset coordinates of the given element, relative to document
     *  body.
     *  @private
     *  @memberof docma.dom
     *
     *  @param {HTMLElement} e - Target element.
     */
    dom.getOffset = function (e) {
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
     *  @private
     *  @memberof docma.dom
     *
     *  @param {String} [hash] - Bookmark target. If omitted, document is
     *  scrolled to the top.
     */
    dom.scrollTo = function (hash) {
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
        console.log('dom hash', hash);
        var elem = document.getElementById(hash);
        console.log('dom hash elem', elem);
        if (!elem) return;
        body.scrollTop = dom.getOffset(elem).top;
        console.log('dom hash getOffset', dom.getOffset(elem).top);
    };

    /**
     *  Fixes the base+hash issue. When base tag is set in the head of an HTML,
     *  bookmark anchors will navigate to the base URL with a hash; even with
     *  sub paths. This will fix that behaviour.
     *  @private
     *  @memberof docma.dom
     *
     *  @returns {void}
     */
    dom.fixAnchors = function (cb) {
        if (docma.app.base) {
            setTimeout(function () {
                var i, el,
                    nodes = document.querySelectorAll('a[href^="#"]');
                for (i = 0; i < nodes.length; i++) {
                    el = nodes[i];
                    var href = el.getAttribute('href');
                    if (href.slice(0, 1) === '#' && href.length > 1) {
                        href = window.location.pathname + (window.location.search || '') + href;
                        el.setAttribute('href', href);
                    }
                }
                if (typeof cb === 'function') cb();
            }, 50);
        }
    };

    // --------------------------------

    /**
     *  Utilities for Docma DOM operations.
     *  @namespace
     *  @private
     */
    docma.dom = Object.freeze(dom);

})();
