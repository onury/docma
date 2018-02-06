/* global docma */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// docma.location
// https://github.com/onury/docma

'use strict';

(function () {

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    /**
     *  @private
     */
    function ensureSlash(left, str, right) {
        if (!str) return left || right ? '/' : '';
        if (left && str.slice(0, 1) !== '/') str = '/' + str;
        if (right && str.slice(-1) !== '/') str += '/';
        return str;
    }

    /**
     *  @private
     */
    function getQueryValue(name, query) {
        // Modified from http://stackoverflow.com/a/901144/112731
        query = query === undefined ? (window.location.search || '') : query;
        if (query.slice(0, 1) === '?') query = query.slice(1);
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('&?' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(query);
        if (!results || !results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // --------------------------------
    // docma.location
    // --------------------------------

    /**
     *  Similar to `window.location` but with differences and additional
     *  information.
     *
     *  @name docma.location
     *  @type {Object}
     *  @readonly
     *
     *  @property {String} origin
     *            Gets the protocol, hostname and port number of the current URL.
     *  @property {String} host
     *            Gets the hostname and port number of the current URL.
     *  @property {String} hostname
     *            Gets the domain name of the web host.
     *  @property {String} protocol
     *            Gets the web protocol used, without `:` suffix.
     *  @property {String} href
     *            Gets the href (URL) of the current location.
     *  @property {String} entrance
     *            Gets the application entrance route, which is set at Docma build-time.
     *  @property {String} base
     *            Gets the base path of the application URL, which is set at Docma build-time.
     *  @property {String} fullpath
     *            Gets the path and filename of the current URL.
     *  @property {String} pathname
     *            Gets the path and filename of the current URL, without the base.
     *  @property {String} path
     *            Gets the path, filename and query-string of the current URL, without the base.
     *  @property {String} hash
     *            Gets the anchor `#` of the current URL, without `#` prefix.
     *  @property {String} query
     *            Gets the querystring part of the current URL, without `?` prefix.
     *  @property {Function} getQuery()
     *            Gets the value of the given querystring parameter.
     */
    Object.defineProperty(docma, 'location', {
        configurable: false,
        get: function () {
            var fullpath = ensureSlash(true, window.location.pathname, true),
                base = ensureSlash(true, docma.app.base, true),
                pathname = fullpath;
            if (fullpath.slice(0, base.length) === base) {
                pathname = fullpath.slice(base.length - 1, fullpath.length);
            }
            return {
                host: window.location.host,
                hostname: window.location.hostname,
                origin: window.location.origin,
                port: window.location.port,
                protocol: (window.location.protocol || '').replace(/:$/, ''),
                entrance: ensureSlash(true, docma.app.entrance, false),
                base: base,
                hash: (window.location.hash || '').replace(/^#/, ''),
                query: (window.location.search || '').replace(/^\?/, ''),
                href: window.location.href,
                fullpath: fullpath,
                pathname: pathname,
                path: pathname + (window.location.search || ''),
                getQuery: getQueryValue

            };
        }
    });

    // --------------------------------

    docma.location = Object.freeze(docma.location);

})();
