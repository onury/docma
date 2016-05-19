/* global docma, dust */
/* eslint */

// docma.web.core
// https://github.com/onury/docma
(function () {

    // private namespace
    docma._ = docma._ || {};

    var DOCMA_ELEM_ID = 'docma-main';

    /**
     *  Sets a callback function to be invoked when Docma is ready.
     *  Note that callback is always fired after `window` is loaded.
     *
     *  @param {Function} callback - Function to be invoked with the following
     *  signature: `function (err) { ... }`. An `err` argument is passed if
     *  Docma could not process the template or documentation data.
     *  @returns {void}
     */
    docma.ready = function (callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('docma.ready() expects a function.');
        }
        docma._.callbacks = docma._.callbacks || [];
        docma._.callbacks.push(callback);
    };

    /**
     *  Executes the ready-callbacks in order.
     *  @private
     *
     *  @param {Array} args - Arguments to be passed to the callback function.
     *  @returns {void}
     */
    function _executeCallbacks(args) {
        docma._.callbacks.forEach(function (cb) {
            cb.apply(docma, args || []);
        });
    }

    function appendTo(target, element) {
        var el = document.createElement(element.type);
        if (element.id) el.id = element.id;
        if (element.html) el.innerHTML = element.html;
        target.appendChild(el);
        return el;
    }

    function getDocmaElem() {
        var docmaElem = document.getElementById(DOCMA_ELEM_ID);
        if (!docmaElem) {
            docmaElem = appendTo(document.body, {
                type: 'div',
                id: DOCMA_ELEM_ID
            });
        }
        return docmaElem;
    }

    window.onload = function () { // (event)
        var error;
        if (!Array.isArray(docma.documentation)) {
            error = new Error('Invalid documentation data.');
            _executeCallbacks([error]);
        }

        var docmaElem = getDocmaElem();

        // compile into <div id="docma-main"></div>
        dust.render(DOCMA_ELEM_ID, docma, function (err, compiledHTML) {
            if (err) {
                _executeCallbacks([err]);
                return;
            }

            docmaElem.innerHTML = compiledHTML;
            _executeCallbacks([null]);
        });
    };

})();
