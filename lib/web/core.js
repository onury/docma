/* global docma, dust, page, EventEmitter */
/* eslint no-nested-ternary:0 */

// docma.core
// https://github.com/onury/docma

/**
 *  Docma (web) core.
 *
 *  When you build the documentation with a template, `docma-web.js` will be
 *  generated (and linked in the main HTML); which is the core engine for the
 *  documentation web app. This will include everything the app needs such as
 *  the documentation data, compiled partials, dustjs engine, etc...
 *
 *  This object is globally accessible from the generated SPA (Single Page
 *  Application).
 *
 *  Note that the size of this script depends especially on the generated
 *  documentation data.
 *
 *  @type {Object}
 *  @global
 *  @name docma
 */
(function () {

    // Flag for page load. Used for triggering the "ready" event only for page
    // load and not for route changes.
    var _initialLoad = false,
        // app entrance optionally set @ build-time
        _appEntranceRI,
        _arrRouteTypes,
        // flag for app routing method
        PATH_ROUTING = docma.app.routing.method === 'path',
        UNNAMED_API = '_def_',
        utils = docma.utils,
        dom = docma.dom;

    // --------------------------------
    // DEBUG / LOGS
    // --------------------------------

    var _debug = {};
    ['log', 'info', 'warn', 'error'].forEach(function (fn) {
        (function () {
            _debug[fn] = function () {
                if (!docma._.logsEnabled) return;
                console[fn].apply(console, arguments);
            };
        })();
    });

    // --------------------------------
    // DUST FILTERS
    // --------------------------------

    /**
     *  Adds a new Dust filter.
     *  @chainable
     *  @see {@link ?content=docma-filters|Existing Docma (Dust) filters}
     *  @see {@link http://www.dustjs.com/docs/filter-api|Dust Filter API}
     *
     *  @param {String} name
     *         Name of the filter to be added.
     *  @param {Function} fn
     *         Filter function.
     *
     *  @returns {docma} - `docma` for chaining.
     *
     *  @throws {Error} - If a filter with the given name already exists.
     */
    docma.addFilter = function (name, fn) {
        if (docma.filterExists(name)) {
            throw new Error('Filter "' + name + '" already exists.');
        }
        dust.filters[name] = fn;
        return docma;
    };

    /**
     *  Removes an existing Dust filter.
     *  @chainable
     *
     *  @param {String} name - Name of the filter to be removed.
     *
     *  @returns {docma} - `docma` for chaining.
     */
    docma.removeFilter = function (name) {
        delete dust.filters[name];
        return docma;
    };

    /**
     *  Checks whether a Dust filter with the given name already exists.
     *
     *  @param {String} name - Name of the filter to be checked.
     *
     *  @returns {Boolean}
     */
    docma.filterExists = function (name) {
        return typeof dust.filters[name] === 'function';
    };

    // --------------------------------
    // EVENTS
    // --------------------------------

    /**
     *  @private
     */
    var _emitter = new EventEmitter();

    function _trigger(eventName, args) {
        _debug.info('Event:', eventName, args ? args[0] : '');
        _emitter.trigger(eventName, args);
    }

    /**
     *  Docma SPA events enumeration.
     *  @enum {String}
     */
    docma.Event = {
        /**
         *  Emitted when Docma is ready and the initial content is rendered.
         *  @type {String}
         */
        Ready: 'ready',
        /**
         *  Emitted when page content (a Dust partial) is rendered.
         *  @type {String}
         */
        Render: 'render',
        /**
         *  Emitted when SPA route is changed.
         *  @type {String}
         */
        Route: 'route'
    };

    /**
     *  Adds a listener function to the specified event.
     *  Note that the listener will not be added if it is a duplicate.
     *  If the listener returns true then it will be removed after it is called.
     *  @alias docma.addListener
     *  @chainable
     *
     *  @param {String} eventName
     *         Name of the event to attach the listener to.
     *         See {@link #docma.Event|`docma.Event`} enumeration.
     *  @param {Function} listener
     *         Function to be called when the event is emitted. If the function
     *         returns true then it will be removed after calling.
     *
     *  @returns {docma} - `docma` for chaining.
     *
     *  @example
     *  docma.on('render', function (currentRoute) {
     *  	if (!currentRoute) {
     *  		console.log('Not found!');
     *  		return;
     *  	}
     *  	if (currentRoute.type === docma.Route.Type.API) {
     *  		console.log('This is an API route.')
     *  	}
     *  });
     */
    docma.on = function (eventName, listener) { // eslint-disable-line
        _emitter.on.apply(_emitter, arguments);
        return docma;
    };

    /**
     *  Adds a listener that will be automatically removed after its first
     *  execution.
     *  @alias docma.addOnceListener
     *  @chainable
     *
     *  @param {String} eventName
     *         Name of the event to attach the listener to.
     *         See {@link #docma.Event|`docma.Event`} enumeration.
     *  @param {Function} listener
     *         Function to be called when the event is emitted.
     *
     *  @returns {docma} - `docma` for chaining.
     *
     *  @example
     *  docma.once('ready', function () {
     *  	console.log('Docma is ready!');
     *  });
     */
    docma.once = function () {
        _emitter.once.apply(_emitter, arguments);
        return docma;
    };

    /**
     *  Removes the given listener from the specified event.
     *  @alias docma.removeListener
     *  @chainable
     *
     *  @param {String} eventName
     *         Name of the event to remove the listener from.
     *         See {@link #docma.Event|`docma.Event`} enumeration.
     *  @param {Function} listener
     *         Function to be removed from the event.
     *
     *  @returns {docma} - `docma` for chaining.
     */
    docma.off = function () {
        _emitter.off.apply(_emitter, arguments);
        return docma;
    };

    /**
     *  Alias for `docma.on`
     *  @private
     */
    docma.addListener = docma.on;
    /**
     *  Alias for `docma.once`
     *  @private
     */
    docma.addListenerOnce = docma.once;
    /**
     *  Alias for `docma.off`
     *  @private
     */
    docma.removeListener = docma.off;

    // --------------------------------
    // DOCMA STATE
    // --------------------------------

    /**
     *  Gets the route information for the current rendered content being
     *  displayed.
     *
     *  @name docma.currentRoute
     *  @type {Route}
     *  @readonly
     *
     *  @property {String} type
     *            Type of the current route. If a generated JSDoc API
     *            documentation is being displayed, this is set to `"api"`.
     *            If any other HTML content (such as a converted markdown) is
     *            being displayed; this is set to `"content"`.
     *  @property {String} name
     *            Name of the current route. For `api` routes, this is the name
     *            of the grouped JS files parsed. If no name is given, this is
     *            set to `"_def_"` by default. For `content` routes, this is
     *            either the custom name given at build-time or, by default; the
     *            name of the generated HTML file; lower-cased, without the
     *            extension. e.g. `"README.md"` will have the route name
     *            `"readme"` after the build.
     *  @property {String} path
     *            Path of the current route.
     */
    Object.defineProperty(docma, 'currentRoute', {
        configurable: false,
        get: function () {
            return docma._.currentRoute;
        }
    });

    /**
     *	JSDoc documentation data for the current API route.
     *	If current route is not an API route, this will be `null`.
     *
     *  See {@link ?api=docma#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.
     *
     *  @name docma.documentation
     *  @type {Array}
     *
     *  @example
     *  // output current API documentation data
     *  if (docma.currentRoute.type === 'api') {
     *  	console.log(docma.documentation);
     *  }
     *
     *  @example
     *  <!-- Usage in (Dust) partial -->
     *  {#documentation}
     *      <h4>{longname}</h4>
     *      <p>{description}</p>
     *      <hr />
     *  {/documentation}
     */
    Object.defineProperty(docma, 'documentation', {
        configurable: false,
        get: function () {
            return docma._.documentation;
        }
    });

    /**
     *	A flat array of JSDoc documentation symbol names. This is useful for
     *	building menus, etc... If current route is not an API route, this will
     *	be `null`.
     *
     *  See {@link ?api=docma#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.
     *
     *  @name docma.symbols
     *  @type {Array}

     *  @example
     *  <!-- Usage in (Dust) partial -->
     *  <ul class="menu">
     *      {#symbols}
     *          <li><a href="#{.}">{.}</a></li>
     *      {/symbols}
     *  </ul>
     */
    Object.defineProperty(docma, 'symbols', {
        configurable: false,
        get: function () {
            return docma._.symbols;
        }
    });

    // --------------------------------
    // CLASS: Docma.Route
    // --------------------------------

    /**
     *  Creates SPA route information object for the given route name and type.
     *  @class
     *  @memberof docma
     *
     *  @param {String} name
     *         Name of the route.
     *  @param {String} type
     *         Type of the SPA route. See {@link #docma.Route.Type|`Route.Type`}
     *         enumeration for possible values.
     */
    function Route(name, type) {
        if (!type || _arrRouteTypes.indexOf(type) < 0) return; // 404

        if (!name) {
            if (type !== Route.Type.API) return; // 404
            name = UNNAMED_API;
        } else {
            if (!docma.app.routing.caseSensitive) name = name.toLowerCase();
        }

        // `docma.routes` array is created @ build-time. If no route is found;
        // this will create a `Route` instance but it will be equivalent to 404
        // route. No properties such as `id`, `name`, `type` and `path`.

        // search in existing routes.
        var info = utils._find(docma.routes, {
            type: type,
            name: name
        });
        // if found, assign properties `id`, `name`, `type` and `path`.
        if (info) utils._assign(this, info);
    }

    /**
     *  Docma SPA route types enumeration.
     *  @memberof docma
     *  @enum {String}
     *  @readonly
     *
     *  @example
     *  // docma.app.routing.method = "query"
     *  type     name              path
     *  -------  ----------------  --------------------------
     *  api      _def_             /?api
     *  api      docma-web         /?api=docma-web
     *  content  templates         /?content=templates
     *  content  guide             /?content=guide
     *
     *  @example
     *  // docma.app.routing.method = "path"
     *  type     name              path
     *  -------  ----------------  --------------------------
     *  api      _def_             /api
     *  api      docma-web         /api/docma-web
     *  content  templates         /templates
     *  content  guide             /guide
     *
     */
    Route.Type = {
        /**
         *  Indicates that the route is for API documentation content.
         *  @type {String}
         */
        API: 'api',
        /**
         *  Indicates that the route is for other content, such as HTML files
         *  generated from markdown.
         *  @type {String}
         */
        CONTENT: 'content'
    };
    _arrRouteTypes = utils._values(Route.Type);

    /**
     *  Checks whether the route actually exists.
     *  @name docma.Route#exists
     *  @function
     *  @instance
     *
     *  @returns {Boolean}
     */
    Route.prototype.exists = function () {
        return Boolean(this.id);
    };

    /**
     *  Checks whether the route is equal to the given route.
     *  @name docma.Route#isEqualTo
     *  @function
     *  @instance
     *
     *  @param {Route} routeInfo - Route to be checked against.
     *  @returns {Boolean}
     */
    Route.prototype.isEqualTo = function (routeInfo) {
        if (!routeInfo || !routeInfo.exists() || !this.exists()) return false;
        return routeInfo.path === this.path;
    };

    /**
     *  Checks whether the route is currently being viewed.
     *  @name docma.Route#isCurrent
     *  @function
     *  @instance
     *
     *  @param {Object} routeInfo - Object to be checked.
     *  @returns {Boolean}
     */
    Route.prototype.isCurrent = function () {
        return this.isEqualTo(docma.currentRoute);
    };

    /**
     *  Applies the route to the application.
     *  @name docma.Route#apply
     *  @function
     *  @instance
     *
     *  @returns {Route} - The route instance for chaining.
     */
    Route.prototype.apply = function () {
        if (this.type === Route.Type.API) {
            docma._.documentation = docma.apis[this.name].documentation;
            docma._.symbols = docma.apis[this.name].symbols;
        } else {
            // reset documentation & symbols since this is not an API route
            docma._.documentation = null;
            docma._.symbols = null;
        }
        // _debug.log('Route Info:', this.toString());
        _trigger(docma.Event.Route, [this]);
        docma.render(this);
        return this;
    };

    /**
     *  Gets the string representation of the route.
     *  @name docma.Route#toString
     *  @function
     *  @instance
     *
     *  @returns {String}
     */
    Route.prototype.toString = function () {
        return JSON.stringify(this);
    };

    /**
     *  Creates a new Route instance. This is equivalent to `new docma.Route()`.
     *  @name docma.Route.create
     *  @function
     *  @static
     *
     *  @param {String} name
     *         Name of the route.
     *  @param {String} type
     *         Type of the SPA route. See {@link #docma.Route.Type|`Route.Type`}
     *         enumeration for possible values.
     *
     *  @returns {Route} - Route instance.
     */
    Route.create = function (name, type) {
        return new Route(name, type);
    };

    /**
     *  Get route information object from the given route ID.
     *  @name docma.Route.fromID
     *  @function
     *  @static
     *  @private
     *
     *  @param {String} id
     *         ID of the route (in `type:name` format).
     *  @param {Boolean} [force=false]
     *         Whether to return the first route in available routes, if there
     *         is no match.
     *
     *  @returns {Route} - Route instance.
     */
    Route.fromID = function (id) {
        if (typeof id !== 'string') {
            _debug.warn('Route ID is not a string: ' + id);
            return new Route(null);
        }
        var s = id.split(':');
        return new Route(s[1], s[0]); // name, type
    };

    /**
     *  Get route information object from the given query-string.
     *  @name docma.Route.fromQuery
     *  @function
     *  @static
     *  @private
     *
     *  @param {String} querystring - Query-string.
     *
     *  @returns {Route} - Route instance.
     */
    Route.fromQuery = function (querystring) {
        if (!querystring) return new Route(null);
        // get the first key=value pair
        var query = querystring.split('&')[0].split('='),
            routeType = query[0].toLowerCase(), // "api" or "content"
            routeName = query[1];

        // if (!docma.app.routing.caseSensitive) routeName = (routeName || '').toLowerCase();
        // routeName = routeName || UNNAMED_API;
        //
        // // return if invalid route type
        // if (_arrRouteTypes.indexOf(routeType) < 0) return new Route(null);
        //
        // if (!routeName) {
        //     if (routeType === Route.Type.API) routeName = UNNAMED_API;
        // }

        return new Route(routeName, routeType);
    };

    /**
     *  @ignore
     */
    Object.defineProperty(docma, 'Route', {
        configurable: false,
        get: function () {
            return Route;
        }
    });

    // --------------------------------
    // RENDER
    // --------------------------------

    /**
     *  Renders the given Dust template into the docma main element.
     *  @private
     *
     *  @param {String} dustTemplateName
     *         Name of the Dust template.
     *  @param {Function} [callback]
     *         Function to be executed when the rendering is complete.
     */
    function _render(dustTemplateName, callback) {
        // render docma main template
        dust.render(dustTemplateName, docma, function (err, compiledHTML) {
            if (err) throw err;
            dom.loadCompiledContent(compiledHTML);
            if (typeof callback === 'function') callback();
        });
    }

    /**
     *  Triggers "render" event and checks if now is the time to also trigger
     *  "ready" event.
     *  @private
     */
    function _triggerAfterRender() {
        _trigger(docma.Event.Render, [docma.currentRoute]);
        if (_initialLoad) {
            _trigger(docma.Event.Ready);
            _initialLoad = false;
        }
    }

    /**
     *  Renders docma-404 partial. Used for not-found routes.
     *  @private
     *
     *  @param {Function} statusCallback -
     */
    function _render404(routeInfo, statusCallback) {
        docma._.currentRoute = Route.create(null);
        _render(docma._.partials.notFound, function () {
            _trigger(docma.Event.Render, [null]);
            dom.scrollTo();
            if (typeof statusCallback === 'function') return statusCallback(404);
            // no callback, throw...
            throw new Error('Page or content not found for route: ' + JSON.stringify(routeInfo));
        });
    }

    /**
     *  Asynchronously fetches (text) content from the given URL via an
     *  `XmlHttpRequest`. Note that the URL has to be in the same-origin, for
     *  this to work.
     *
     *  @param {String} url
     *         URL to be fetched.
     *  @param {Function} callback
     *         Function to be executed when the content is fetched; with the
     *         following signature: `function (status, responseText) { .. }`
     */
    docma.fetch = function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var text = xhr.status === 200 ? xhr.responseText : '';
                _debug.log('XHR GET:', xhr.status, url);
                return callback(xhr.status, text);
            }
        };
        xhr.open('GET', url, true); // async
        xhr.send();
    };

    /**
     *  Renders content into docma-main element, by the given route information.
     *
     *  If the content is empty or `"api"`, we'll render the `docma-api`
     *  Dust template. Otherwise, (e.g. `"readme"`) we'll render `docma-content`
     *  Dust template, then  fetch `content/readme.html` and load it in the
     *  `docma-main` element.
     *
     *  Note that rendering and the callback will be cancelled if the given
     *  content is the latest content rendered.
     *
     *  @param {Route} routeInfo
     *         Route information of the page to be rendered.
     *  @param {Function} [callback]
     *         Function to be executed when the rendering is complete.
     *         `function (httpStatus:Number) { .. }`
     *
     *  @emits docma.Event.Render
     */
    docma.render = function (routeInfo, callback) {
        // if no route info, render not-found partial (docma-404)
        if (!routeInfo || !routeInfo.exists()) return _render404(routeInfo, callback);
        // return if same route
        if (routeInfo.isEqualTo(docma.currentRoute)) return;
        // set current route
        docma._.currentRoute = routeInfo;

        var isCbFn = typeof callback === 'function';

        if (routeInfo.type === Route.Type.API) {
            _render(docma._.partials.api, function () {
                _triggerAfterRender();
                if (isCbFn) callback(200);
                dom.fixAnchors();
                dom.scrollTo();
            });
        } else { // if (routeInfo.type === Route.Type.CONTENT) {
            docma.fetch(routeInfo.contentPath, function (status, html) {
                if (status === 404) return _render404(routeInfo, callback);
                // rendering docma-content Dust template
                _render(docma._.partials.content, function () {
                    dom.loadContent(html);
                    _triggerAfterRender();
                    if (isCbFn) callback(status);
                    dom.fixAnchors();
                });
            });
        }
    };

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
                _debug.info('Redirecting to:', redirectPath);
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

    if (PATH_ROUTING) {
        page('(/)?api/:apiName?', function (context, next) {
            // console.log(context);
            var apiName = context.params.apiName || UNNAMED_API,
                routeInfo = Route.create(apiName, Route.Type.API);
            // route not found, send to next (not-found)
            if (!routeInfo || !routeInfo.exists()) return next();
            routeInfo.apply();
        });

        page('(/)?:content', function (context, next) {
            // console.log(context);
            var content = context.params.content,
                routeInfo = Route.create(content, Route.Type.CONTENT);
            // route not found, send to next (not-found)
            if (!routeInfo || !routeInfo.exists()) return next();
            routeInfo.apply();
        });
    }

    page('(/)?', function (context, next) {
        if (_redirecting()) return;
        // _debug.log(context);

        // context.querystring has problems.
        // See our issue @ https://github.com/visionmedia/page.js/issues/377
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
                routeInfo = _appEntranceRI;
            } else { // query routing
                _debug.log('Query-string:', qs);
                routeInfo = qs ? Route.fromQuery(qs) : _appEntranceRI;
            }

            // route not found, send to next (not-found)
            if (!routeInfo || !routeInfo.exists()) return next();

            // if this is already the current route, do nothing...
            if (routeInfo.isCurrent()) return;

            // now, we can apply the route
            routeInfo.apply();

        }, 100);
    });

    page('*', function (context) { // (context, next)
        _debug.warn('Unknown Route:', context.path);
        Route.create(null).apply();
    });

    // --------------------------------
    // INITIALIZE
    // --------------------------------

    _debug.info('Docma SPA Configuration:');
    _debug.info('App Title:          ', docma.app.title);
    _debug.info('Routing Method:     ', docma.app.routing.method);
    _debug.info('App Server:         ', docma.app.server);
    _debug.info('Base Path:          ', docma.app.base);
    _debug.info('Entrance Route ID:  ', docma.app.entrance);

    window.onload = function () { // (event)

        // mark initial page load
        _initialLoad = true;
        // convert entrance route ID to routeInfo for later use
        _appEntranceRI = Route.fromID(docma.app.entrance);
        // configure page.js
        page.start({
            click: true,
            popstate: true,
            dispatch: true,
            hashbang: false,
            decodeURLComponents: true
        });

        _debug.info('Docma SPA loaded!');
    };

})();

// --------------------------------
// ADDITIONAL DOCUMENTATION
// --------------------------------

/**
 *  Provides configuration data of the generated SPA, which is originally set
 *  at build-time, by the user.
 *  See {@link ?api=docma#Docma~BuildConfiguration|build configuration} for more
 *  details on how these settings take affect.
 *  @name docma.app
 *  @type {Object}
 *
 *  @property {String} title
 *            Document title for the main file of the generated app.
 *            (Value of the `&lt;title/>` tag.)
 *  @property {Array} meta
 *            Array of arbitrary objects set for main document meta (tags).
 *  @property {String} base
 *            Base path of the generated web app.
 *  @property {String} entrance
 *            Name of the initial content displayed, when the web app is first
 *            loaded.
 *  @property {String|Object} routing
 *            Routing settings for the generated SPA.
 *  @property {String} server
 *            Server/host type of the generated SPA.
 */

/**
 *	Hash-map of JSDoc documentation outputs.
 *	Each key is the name of an API (formed by grouped Javascript files).
 *	e.g. `docma.apis["some-api"]`
 *
 *  Unnamed documentation data (consisting of ungrouped Javascript files) can be
 *  accessed via `docma.apis._def_`.
 *
 *	Each value is an `Object` with the following signature:
 *	`{ documentation:Array, symbols:Array }`. `documentation` is the actual
 *	JSDoc data, and `symbols` is a flat array of symbol names.
 *
 *  See {@link ?api=docma#Docma~BuildConfiguration|build configuration} for more
 *  details on how Javascript files can be grouped (and named) to form separate
 *  API documentations and SPA routes.
 *
 *  @name docma.apis
 *  @type {Object}
 *
 *  @example
 *  // output ungrouped (unnamed) API documentation data
 *  console.log(docma.apis._def_.documentation);
 *  console.log(docma.apis._def_.symbols); // flat list of symbol names
 *  // output one of the grouped (named) API documentation data
 *  console.log(docma.apis['my-scondary-api'].documentation);
 *
 *  @example
 *  <!-- Usage in a Dust partial
 *  	Each API data is passed to the partial, according to the route.
 *  	So you'll always use `documentation` within the partials.
 *  -->
 *  {#documentation}
 *      <h4>{longname}</h4>
 *      <p>{description}</p>
 *      <hr />
 *  {/documentation}
 */

/**
 *  Array of available SPA routes of the documentation.
 *  This is created at build-time and defined via the `src` param of the
 *  {@link ?api=docma#Docma~BuildConfiguration|build configuration}.
 *
 *  @name docma.routes
 *  @type {Array}
 *
 *  @see {@link #docma.Route|docma.Route}
 */

/**
 *  Provides template specific configuration data.
 *  This is also useful within the Dust partials of the Docma template.
 *  @name docma.template
 *  @type {Object}
 *
 *  @property {Object} options - Docma template options. Defined at build-time,
 *  by the user.
 *  @property {String} name
 *            Name of the Docma template.
 *  @property {String} version
 *            Version of the Docma template.
 *  @property {String} author
 *            Author information for the Docma template.
 *  @property {String} license
 *            License information for the Docma template.
 *  @property {String} main
 *            Name of the main file of the template. i.e. `index.html`
 *
 *  @example
 *  <!-- Usage in a Dust partial -->
 *  <div>
 *      {?template.options.someOption}
 *      <span>Displayed if someOption is true.</span>
 *      {/template.options.someOption}
 *  </div>
 *  <div class="footer">{template.name} by {template.author}</div>
 */

 /**
  *  Utilities for inspecting JSDoc documentation and symbols; and parsing
  *  documentation data into proper HTML.
  *  See {@link ?api=docma-web-utils|`docma.utils` documentation}.
  *  @name docma.utils
  *  @type {Object}
  *  @namespace
  */
