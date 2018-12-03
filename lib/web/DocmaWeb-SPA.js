/* global docma, DocmaWeb, page, sessionStorage */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// DocmaWeb - SPA
// https://github.com/onury/docma
// --------------------------------

(function () {

    'use strict';

    /**
     *  Flag for app routing method
     *  @private
     */
    var PATH_ROUTING = docma.app.routing.method === 'path';

    // --------------------------------
    // ROUTING with (page.js)
    // --------------------------------

    /**
     *  This is used for "path" routing method.
     *  i.e. docma.app.routing.method = "path" and docma.app.server === "github"
     *  or none
     *
     *  In this case, Docma generates directories with an index file for each
     *  route. Index files will set a redirect path to sessionStorage and
     *  meta-refresh itself to main (root) index file.
     *
     *  Then we'll read the redirect path from `sessionStorage` into memory and
     *  reset the storage. Then redirect the SPA to the set path.
     *
     *  Note that if `.app.routing.method` is set to `"query"`, we don't need
     *  this since, routing via query-string always operates on the main page
     *  already.
     *  @private
     *
     *  @returns {Boolean} - Whether the SPA is redirecting from a
     *  sub-directory path.
     */
    function _redirecting() {
        if (PATH_ROUTING) {
            var redirectPath = sessionStorage.getItem('redirectPath') || null;
            if (redirectPath) {
                sessionStorage.removeItem('redirectPath');
                docma.info('Redirecting to:', redirectPath);
                page.redirect(redirectPath);
                return true;
            }
        }
        return false;
    }

    function _getQueryString(ctxQueryString) {
        var qs = ctxQueryString || window.location.search;
        // remove leading ? or & if any
        if ((/^[?&]/).test(qs)) qs = qs.slice(1);
        return qs || null;
    }

    function getRouteName(context) {
        return (context.params[1] || '').replace(/\/$/, ''); // remove end slash
    }

    // Setup page.js routes

    // if routing method is "path"; e.g. for `/guide` we render `docma-content`
    // Dust template, then fetch `content/guide.html` and load it in the
    // docma-main element. Otherwise, we'll render `docma-api` Dust
    // template. (_def_) API documentation will be accessible @ `/api`.
    // Named API documentation will be accessible @ `/api/name`.

    // if routing method is "query"; we look for query-string param "api" or
    // "content". e.g. for `?content=readme` we render `docma-content` Dust
    // template, then fetch `content/readme.html` and load it in the docma-main
    // element. e.g. "?api=mylib", we'll render `docma-api` Dust template.

    if (docma.app.base) page.base(docma.app.base);
    page.redirect('(/)?' + docma.template.main, '');

    function apiRouteHandler(context, next) {
        var apiName = getRouteName(context) || docma._.defaultApiName; // e.g. api or api/web
        var routeInfo = docma.createRoute(apiName, DocmaWeb.Route.Type.API);
        // route not found, send to next (not-found)
        if (!routeInfo || !routeInfo.exists()) return next();
        routeInfo.apply();
    }

    if (PATH_ROUTING) {
        page('(/)?api/(.+)', apiRouteHandler);
        page('(/)?api(/)?', apiRouteHandler);
        page('(/)?(.*)', function (context, next) {
            var content = getRouteName(context); // e.g. cli or templates/filters
            var routeInfo = docma.createRoute(content, DocmaWeb.Route.Type.CONTENT);
            // route not found, send to next (not-found)
            if (!routeInfo || !routeInfo.exists()) return next();
            routeInfo.apply();
        });
    }

    page('(/)?', function (context, next) {
        if (_redirecting()) return;
        // docma.log(context);

        // context.querystring has problems.
        // See our issue @ https://github.com/visionmedia/page.js/issues/377
        // And this PR for a fix: https://github.com/visionmedia/page.js/pull/408
        // This PR is still not merged as of Aug, 2017. Revise below once it's merged.

        // So first, we check if context.querystring has a value. if not, we'll
        // try window.location.search but, it needs a little delay to capture
        // the change.
        setTimeout(function () {
            var routeInfo,
                qs = _getQueryString(context.querystring); // this needs the timeout

            if (PATH_ROUTING) {
                // only expecting paths, shouldn't have querystring
                if (qs) return next(); // not found
                // no query-string, just "/" root received
                routeInfo = docma._.appEntranceRI;
            } else { // query routing
                docma.log('Query-string:', qs);
                routeInfo = qs ? docma.createRouteFromQuery(qs) : docma._.appEntranceRI;
            }

            var is404 = !routeInfo || !routeInfo.exists();

            // route not found, send to next (not-found)
            if (is404) return next();

            function triggerNav() {
                // on route-change or hashchange
                docma._trigger(DocmaWeb.Event.Navigate, [routeInfo]);
            }

            // if this is already the current route, do nothing...
            if (routeInfo.isCurrent()) {
                triggerNav();
                return;
            }

            // now, we can apply the route
            routeInfo.apply(function (status) {
                if (status === 200) triggerNav();
            });

        }, 100);
    });

    page('*', function (context) { // (context, next)
        docma.warn('Unknown Route:', context.path);
        docma.log('context:', context);
        docma.createRoute(null).apply();
    });

    // --------------------------------
    // INITIALIZE
    // --------------------------------

    docma.info('Docma SPA Configuration:');
    docma.info('App Title:          ', docma.app.title);
    docma.info('Routing Method:     ', docma.app.routing.method);
    docma.info('App Server:         ', docma.app.server);
    docma.info('Base Path:          ', docma.app.base);
    docma.info('Entrance Route ID:  ', docma.app.entrance);

    window.onload = function () { // (event)

        // mark initial page load
        docma._.initialLoad = true;
        // convert entrance route ID to routeInfo for later use
        docma._.appEntranceRI = docma.createRouteFromID(docma.app.entrance);
        // configure page.js
        page.start({
            click: true,
            popstate: true,
            dispatch: true,
            hashbang: false,
            decodeURLComponents: true
        });

        docma.info('Docma SPA loaded!');
    };

})();
