/* global docma, Utils, dust, EventEmitter, XMLHttpRequest */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// CLASS: DocmaWeb
// https://github.com/onury/docma
// --------------------------------

/**
 *  Gets Docma version which the documentation is built with.
 *  @name DocmaWeb#version
 *  @type {String}
 */

/**
 *  Docma (web) core.
 *
 *  When you build the documentation with a template, `docma-web.js` will be
 *  generated (and linked in the main HTML); which is the core engine for the
 *  documentation web app. This will include everything the app needs such as
 *  the documentation data, compiled partials, dustjs engine, etc...
 *
 *  <blockquote>An instance of this object is globally accessible within the generated SPA
 *  as <code>docma</code>. Note that the size of the `docma-web.js` script depends primarily
 *  on the generated documentation data.</blockquote>
 *
 *  @class
 *  @name DocmaWeb
 *  @hideconstructor
 *  @emits DocmaWeb~event:ready
 *  @emits DocmaWeb~event:render
 *  @emits DocmaWeb~event:route
 *  @emits DocmaWeb~event:navigate
 */

function DocmaWeb(data) {
    this._ = data || {};

    // Flag for page load. Used for triggering the "ready" event only for page
    // load and not for route changes.
    this._.initialLoad = false;
    // app entrance optionally set @ build-time
    this._.appEntranceRI = null;

    this._.emitter = new EventEmitter();

    /**
     *  Provides configuration data of the generated SPA, which is originally set
     *  at build-time, by the user.
     *  See {@link api/#Docma~BuildConfiguration|build configuration} for more
     *  details on how these settings take affect.
     *  @name DocmaWeb#app
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
    Object.defineProperty(this, 'app', {
        configurable: false,
        get: function () {
            return this._.app || null;
        }
    });

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
        *  <blockquote>See {@link api/#Docma~BuildConfiguration|build configuration} for more
        *  details on how Javascript files can be grouped (and named) to form separate
        *  API documentations and SPA routes.</blockquote>
        *
        *  @name DocmaWeb#apis
        *  @type {Object}
        *
        *  @example <caption>Programmatic access to documentation data</caption>
        *  // output ungrouped (unnamed) API documentation data
        *  console.log(docma.apis._def_.documentation);
        *  console.log(docma.apis._def_.symbols); // flat list of symbol names
        *  // output one of the grouped (named) API documentation data
        *  console.log(docma.apis['my-scondary-api'].documentation);
        *
        *  @example <caption>Usage in a Dust partial</caption>
        *  <!--
        *  	Each API data is passed to the partial, according to the route.
        *  	So you'll always use `documentation` within the partials.
        *  -->
        *  {#documentation}
        *      <h4>{longname}</h4>
        *      <p>{description}</p>
        *      <hr />
        *  {/documentation}
        */
    Object.defineProperty(this, 'apis', {
        configurable: false,
        get: function () {
            return this._.apis || {};
        }
    });

    /**
     *  Array of available SPA routes of the documentation.
     *  This is created at build-time and defined via the `src` param of the
     *  {@link api/#Docma~BuildConfiguration|build configuration}.
     *
     *  @name DocmaWeb#routes
     *  @type {Array}
     *
     *  @see {@link #DocmaWeb.Route|`DocmaWeb.Route`}
     */
    Object.defineProperty(this, 'routes', {
        configurable: false,
        get: function () {
            return this._.routes || {};
        }
    });

    /**
     *  Provides template specific configuration data.
     *  This is also useful within the Dust partials of the Docma template.
     *  @name DocmaWeb#template
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
     *  @property {String} mainHTML
     *            Name of the main file of the template. i.e. `index.html`
     *
     *  @example <caption>Usage in a Dust partial</caption>
     *  <div>
     *      {?template.options.someOption}
     *      <span>Displayed if someOption is true.</span>
     *      {/template.options.someOption}
     *  </div>
     *  <div class="footer">{template.name} by {template.author}</div>
     */
    Object.defineProperty(this, 'template', {
        configurable: false,
        get: function () {
            return this._.template || {};
        }
    });

    // --------------------------------
    // DOCMA-WEB STATE
    // --------------------------------

    /**
     *  Similar to `window.location` but with differences and additional
     *  information.
     *
     *  @name DocmaWeb#location
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
    Object.defineProperty(this, 'location', {
        configurable: false,
        get: function () {
            var fullpath = Utils._ensureSlash(true, window.location.pathname, true),
                base = Utils._ensureSlash(true, docma.app.base, true),
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
                entrance: Utils._ensureSlash(true, docma.app.entrance, false),
                base: base,
                hash: (window.location.hash || '').replace(/^#/, ''),
                query: (window.location.search || '').replace(/^\?/, ''),
                href: window.location.href,
                fullpath: fullpath,
                pathname: pathname,
                path: pathname + (window.location.search || ''),
                getQuery: function (name, query) {
                    // Modified from http://stackoverflow.com/a/901144/112731
                    query = query === undefined ? (window.location.search || '') : query;
                    if (query.slice(0, 1) === '?') query = query.slice(1);
                    name = (name || '').replace(/[[\]]/g, '\\$&');
                    var regex = new RegExp('&?' + name + '(=([^&#]*)|&|#|$)'),
                        results = regex.exec(query);
                    if (!results || !results[2]) return '';
                    return decodeURIComponent(results[2].replace(/\+/g, ' '));
                }

            };
        }
    });

    /**
     *  Gets the route information for the current rendered content being
     *  displayed.
     *
     *  @name DocmaWeb#currentRoute
     *  @type {DocmaWeb.Route}
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
    Object.defineProperty(this, 'currentRoute', {
        configurable: false,
        get: function () {
            return this._.currentRoute || null;
        }
    });

    /**
     *	JSDoc documentation data for the current API route.
     *	If current route is not an API route, this will be `null`.
     *
     *  <blockquote>See {@link api/#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.</blockquote>
     *
     *  @name DocmaWeb#documentation
     *  @type {Array}
     *
     *  @example <caption>Output current API documentation data</caption>
     *  if (docma.currentRoute.type === 'api') {
     *  	console.log(docma.documentation);
     *  }
     *
     *  @example <caption>Usage in (Dust) partial</caption>
     *  {#documentation}
     *      <h4>{longname}</h4>
     *      <p>{description}</p>
     *      <hr />
     *  {/documentation}
     */
    Object.defineProperty(this, 'documentation', {
        configurable: false,
        get: function () {
            return this._.documentation || [];
        }
    });

    /**
     *	A flat array of JSDoc documentation symbol names. This is useful for
     *	building menus, etc... If current route is not an API route, this will
     *	be `null`.
     *
     *  <blockquote>See {@link api/docma#Docma~BuildConfiguration|build configuration} for more
     *  details on how Javascript files can be grouped (and named) to form
     *  separate API documentations and SPA routes.</blockquote>
     *
     *  @name DocmaWeb#symbols
     *  @type {Array}
     *
     *  @example <caption>Usage in (Dust) partial</caption>
     *  <ul class="menu">
     *      {#symbols}
     *          <li><a href="#{.}">{.}</a></li>
     *      {/symbols}
     *  </ul>
     */
    Object.defineProperty(this, 'symbols', {
        configurable: false,
        get: function () {
            return this._.symbols || [];
        }
    });
}

// --------------------------------
// EVENTS
// --------------------------------

/** @private */
DocmaWeb.prototype._trigger = function (eventName, args) {
    this.info('Event:', eventName, args ? args[0] : '');
    this._.emitter.trigger(eventName, args);
};

/**
 *  Fired when Docma is ready and the initial content is rendered.
 *  This is only fired once.
 *
 *  @event DocmaWeb~event:ready
 *
 *  @example
 *  docma.once('ready', function () {
 *      // do stuff...
 *  });
 */

/**
 *  Fired when page content (a Dust partial) is rendered. The emitted obeject is
 *  `currentRoute`. If the route does not exist (404), `currentRoute` will be
 *  `null`. This is fired after the `route` event.
 *
 *  @event DocmaWeb~event:render
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('render', function (currentRoute) {
 *      if (currentRoute && currentRoute.type === docma.Route.Type.API) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Fired when SPA route is changed. The emitted obeject is `currentRoute`. If
 *  the route does not exist (404), `currentRoute` will be `null`. This is fired
 *  before the `render` event.
 *
 *  @event DocmaWeb~event:route
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('route', function (currentRoute) {
 *      if (currentRoute && currentRoute.type === docma.Route.Type.API) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Fired either when the route is changed or navigated to a bookmark
 *  (i.e. on hash-change). If the route does not exist (404), `currentRoute`
 *  will be `null`.
 *
 *  @event DocmaWeb~event:navigate
 *  @type {DocmaWeb.Route}
 *
 *  @example
 *  docma.on('navigate', function (currentRoute) {
 *      if (currentRoute) {
 *          // do stuff...
 *      }
 *  });
 */

/**
 *  Docma SPA events enumeration.
 *  @enum {String}
 */
DocmaWeb.Event = {
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
    Route: 'route',
    /**
     *  Emitted either when the route is changed or navigated to a
     *  bookmark (i.e. hashchange).
     *  @type {String}
     */
    Navigate: 'navigate'
};

/**
 *  Adds a listener function to the specified event.
 *  Note that the listener will not be added if it is a duplicate.
 *  If the listener returns true then it will be removed after it is called.
 *  @name DocmaWeb#on
 *  @function
 *  @alias DocmaWeb#addListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to attach the listener to.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be called when the event is emitted. If the function
 *         returns true then it will be removed after calling.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
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
DocmaWeb.prototype.on = function (eventName, listener) { // eslint-disable-line
    this._.emitter.on.apply(this._.emitter, arguments);
    return docma;
};

/**
 *  Adds a listener that will be automatically removed after its first
 *  execution.
 *  @name DocmaWeb#once
 *  @function
 *  @alias DocmaWeb#addOnceListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to attach the listener to.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be called when the event is emitted.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 *
 *  @example
 *  docma.once('ready', function () {
 *  	console.log('Docma is ready!');
 *  });
 */
DocmaWeb.prototype.once = function () {
    this._.emitter.once.apply(this._.emitter, arguments);
    return this;
};

/**
 *  Removes the given listener from the specified event.
 *  @name DocmaWeb#off
 *  @function
 *  @alias DocmaWeb#removeListener
 *  @chainable
 *
 *  @param {String} eventName
 *         Name of the event to remove the listener from.
 *         See {@link #DocmaWeb.Event|`DocmaWeb.Event`} enumeration.
 *  @param {Function} listener
 *         Function to be removed from the event.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 */
DocmaWeb.prototype.off = function () {
    this._.emitter.off.apply(this._.emitter, arguments);
    return this;
};

/**
 *  Alias for `DocmaWeb#on`
 *  @private
 */
DocmaWeb.prototype.addListener = DocmaWeb.prototype.on;
/**
 *  Alias for `DocmaWeb#once`
 *  @private
 */
DocmaWeb.prototype.addListenerOnce = DocmaWeb.prototype.once;
/**
 *  Alias for `DocmaWeb#off`
 *  @private
 */
DocmaWeb.prototype.removeListener = DocmaWeb.prototype.off;

// --------------------------------
// DEBUG / LOGS
// --------------------------------

/**
 *  Outputs a general log to the browser console. (Unlike `console.log()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.log = function () {
    if (!docma._.logsEnabled) return;
    console.log.apply(console, arguments);
};

/**
 *  Outputs an informational log to the browser console. (Unlike
 *  `console.info()`) this method respects `debug` option of Docma build
 *  configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.info = function () {
    if (!docma._.logsEnabled) return;
    console.info.apply(console, arguments);
};

/**
 *  Outputs a warning log to the browser console. (Unlike `console.warn()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.warn = function () {
    if (!docma._.logsEnabled) return;
    console.warn.apply(console, arguments);
};

/**
 *  Outputs an error log to the browser console. (Unlike `console.error()`) this
 *  method respects `debug` option of Docma build configuration.
 *  @param {...*} [args=""] - Arguments to be logged.
 */
DocmaWeb.prototype.error = function () {
    if (!docma._.logsEnabled) return;
    console.error.apply(console, arguments);
};

// --------------------------------
// DOM
// --------------------------------

/**
 *  Gets Docma main DOM element which the Dust templates will be rendered
 *  into.
 *
 *  @returns {HTMLElement} - Docma main DOM element.
 */
DocmaWeb.prototype.getDocmaElem = function () {
    var docmaElem = document.getElementById(this._.elementID);
    if (!docmaElem) {
        docmaElem = Utils.DOM.createChild(document.body, 'div', {
            id: this._.elementID
        });
    }
    return docmaElem;
};

/**
 *  Gets Docma content DOM element that the HTML content will be loaded
 *  into. This should be called for `docma-content` partial.
 *
 *  @returns {HTMLElement} - Docma content DOM element.
 */
DocmaWeb.prototype.getContentElem = function () {
    // docma-content template (should) have a
    // <div id="docma-content"></div> element whithin.
    var dContent = document.getElementById(this._.contentElementID);
    if (!dContent) {
        // this is fatal, so we always throw if invalid content partial
        // TODO: this should be checked during build process
        throw new Error('Partial ' + this._.partials.content + ' should have an element with id="' + this._.contentElementID + '".');
    }
    return dContent;
};

/**
 *  Loads the given HTML content into `docma-content` element. This is a
 *  low-level method. Typically you would not need to use this.
 *
 *  @param {String} html - Content to be loaded.
 */
DocmaWeb.prototype.loadContent = function (html) {
    var dContent = this.getContentElem();
    dContent.innerHTML = html;

    // If this is a parsed HTML file that is loaded as content; it might
    // include some styles within the body. We'll move them to head. But
    // first, remove if there are any previously moved styles in the head.
    Utils.DOM._removePrevBodyStyles();
    // now move the styles within the current rendered body.
    Utils.DOM._moveBodyStylesToHead();

    // this._fixAnchors();
    Utils.DOM.scrollTo(); // top
};

/**
 *  Loads dust-compiled HTML content into `docma-main` element.
 *  @private
 *
 *  @param {String} compiledHTML - Dust-compiled HTML content.
 */
DocmaWeb.prototype._loadCompiledContent = function (compiledHTML) {
    // load compiled content into <div id="docma-main"></div>
    var docmaElem = this.getDocmaElem();
    docmaElem.innerHTML = compiledHTML;
    // this._fixAnchors();
};

/**
 *  Fixes the base+hash issue. When base tag is set in the head of an HTML,
 *  bookmark anchors will navigate to the base URL with a hash; even with
 *  sub paths. This will fix that behaviour.
 *  @private
 *
 *  @param {Function} cb - Callback.
 *
 *  @returns {void}
 */
DocmaWeb.prototype._fixAnchors = function (cb) {
    if (this.app.base) {
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
// DUST FILTERS
// --------------------------------

/**
 *  Adds a new Dust filter.
 *  @chainable
 *  @see {@link templates/filters/|Existing Docma (Dust) filters}
 *  @see {@link http://www.dustjs.com/docs/filter-api|Dust Filter API}
 *
 *  @param {String} name - Name of the filter to be added.
 *  @param {Function} fn - Filter function.
 *
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 *  @throws {Error} - If a filter with the given name already exists.
 */
DocmaWeb.prototype.addFilter = function (name, fn) {
    if (this.filterExists(name)) {
        throw new Error('Filter "' + name + '" already exists.');
    }
    dust.filters[name] = fn;
    return this;
};

/**
 *  Removes an existing Dust filter.
 *  @chainable
 *  @param {String} name - Name of the filter to be removed.
 *  @returns {DocmaWeb} - `DocmaWeb` instance for chaining.
 */
DocmaWeb.prototype.removeFilter = function (name) {
    delete dust.filters[name];
    return this;
};

/**
 *  Checks whether a Dust filter with the given name already exists.
 *  @param {String} name - Name of the filter to be checked.
 *  @returns {Boolean} -
 */
DocmaWeb.prototype.filterExists = function (name) {
    return typeof dust.filters[name] === 'function';
};

// --------------------------------
// ROUTES
// --------------------------------

/**
 *  Creates a SPA route information object for the given route name and type.
 *
 *  @param {String} name
 *         Name of the route.
 *  @param {String} type
 *         Type of the SPA route. See {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`}
 *         enumeration for possible values.
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRoute = function (name, type) {
    return new DocmaWeb.Route(this, name, type);
};

/**
 *  Get route information object from the given route ID.
 *  @private
 *
 *  @param {String} id - ID of the route (in `type:name` format).
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRouteFromID = function (id) {
    if (typeof id !== 'string') {
        this.warn('Route ID is not a string: ' + id);
        return new DocmaWeb.Route(this, null);
    }
    var s = id.split(':');
    return new DocmaWeb.Route(this, s[1], s[0]); // name, type
};

/**
 *  Get route information object from the given query-string.
 *  @private
 *
 *  @param {String} querystring - Query-string.
 *
 *  @returns {DocmaWeb.Route} - Route instance.
 */
DocmaWeb.prototype.createRouteFromQuery = function (querystring) {
    if (!querystring) return new DocmaWeb.Route(null);
    // get the first key=value pair
    var query = querystring.split('&')[0].split('='),
        routeType = query[0].toLowerCase(), // "api" or "content"
        routeName = query[1];

    return new DocmaWeb.Route(this, routeName, routeType);
};

// --------------------------------
// DUST / RENDER
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
DocmaWeb.prototype._render = function (dustTemplateName, callback) {
    var self = this;
    // render docma main template
    dust.render(dustTemplateName, this, function (err, compiledHTML) {
        if (err) {
            self.warn('Could not load Docma partial:', dustTemplateName);
            self.log('Compiled HTML: ', compiledHTML);
            throw err;
        }
        self._loadCompiledContent(compiledHTML);
        if (typeof callback === 'function') callback();
    });
};

/**
 *  Triggers "render" event and checks if now is the time to also trigger
 *  "ready" event.
 *  @private
 */
DocmaWeb.prototype._triggerAfterRender = function () {
    this._trigger(DocmaWeb.Event.Render, [docma.currentRoute]);
    if (this._.initialLoad) {
        this._trigger(DocmaWeb.Event.Ready);
        this._.initialLoad = false;
    }
};

/**
 *  Renders docma-404 partial. Used for not-found routes.
 *  @private
 *  @param {Object} routeInfo -
 *  @param {Function} statusCallback -
 */
DocmaWeb.prototype._render404 = function (routeInfo, statusCallback) {
    this._.currentRoute = this.createRoute(null);
    var self = this;
    this._render(this._.partials.notFound, function () {
        self._trigger(DocmaWeb.Event.Render, [null]);
        Utils.DOM.scrollTo();
        if (typeof statusCallback === 'function') return statusCallback(404);
        // no callback, throw...
        throw new Error('Page or content not found for route: ' + Utils._safeStringify(routeInfo));
    });
};

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
DocmaWeb.prototype.fetch = function (url, callback) {
    var xhr = new XMLHttpRequest();
    var self = this;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var text = xhr.status === 200 ? xhr.responseText : '';
            self.log('XHR GET:', xhr.status, url);
            return callback(xhr.status, text);
        }
    };
    xhr.open('GET', url, true); // async
    xhr.send();
};

/**
 *  Renders content into docma-main element, by the given route information.
 *
 *  If the content is empty or `"api"`, we'll render the `docma-api` Dust
 *  template. Otherwise, (e.g. `"readme"`) we'll render `docma-content` Dust
 *  template, then  fetch `content/readme.html` and load it in the `docma-main`
 *  element.
 *
 *  <blockquote>Note that rendering and the callback will be cancelled if the given
 *  content is the latest content rendered.</blockquote>
 *
 *  @param {DocmaWeb.Route} routeInfo - Route information of the page to be
 *  rendered.
 *  @param {Function} [callback] - Function to be executed when the rendering is
 *  complete. `function (httpStatus:Number) { .. }`
 *  @returns {void}
 *  @emits DocmaWeb~event:render
 */
DocmaWeb.prototype.render = function (routeInfo, callback) {
    // if no route info, render not-found partial (docma-404)
    if (!routeInfo || !routeInfo.exists()) return this._render404(routeInfo, callback);
    // return if same route
    if (routeInfo.isEqualTo(this.currentRoute)) return;
    // set current route
    this._.currentRoute = routeInfo;

    var isCbFn = typeof callback === 'function';
    var self = this;

    if (routeInfo.type === DocmaWeb.Route.Type.API) {
        this._render(this._.partials.api, function () {
            self._triggerAfterRender();
            if (isCbFn) callback(200);
            self._fixAnchors(function () {
                Utils.DOM.scrollTo();
            });
        });
    } else { // if (routeInfo.type === Route.Type.CONTENT) {
        docma.fetch(routeInfo.contentPath, function (status, html) {
            if (status === 404) return self._render404(routeInfo, callback);
            // rendering docma-content Dust template
            self._render(self._.partials.content, function () {
                self.loadContent(html);
                self._triggerAfterRender();
                if (isCbFn) callback(status);
                self._fixAnchors(function () {
                    Utils.DOM.scrollTo();
                });
            });
        });
    }
};

// --------------------------------
// UTILS
// --------------------------------

/**
 *  Utilities for inspecting JSDoc documentation and symbols; and parsing
 *  documentation data into proper HTML.
 *  See {@link api/web/utils|`DocmaWeb.Utils` documentation}.
 *  @type {Object}
 *  @namespace
 */
DocmaWeb.Utils = Utils;
