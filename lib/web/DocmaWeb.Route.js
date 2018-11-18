/* global DocmaWeb, Utils */
/* eslint no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

// Note: This is for use in the browser. ES2015 rules don't apply here (yet).

// --------------------------------
// CLASS: DocmaWeb.Route
// https://github.com/onury/docma
// --------------------------------

/** @private */
var _arrRouteTypes;

/**
 *  @classdesc Creates SPA route information object for the given route name
 *  and type. You cannot directly construct an instance of this class via
 *  `new` operator. Use {@link #DocmaWeb#createRoute|`DocmaWeb#createRoute`}
 *  method instead.
 *  @class
 *  @hideconstructor
 *
 *  @param {DocmaWeb} docma `DocmaWeb` instance.
 *  @param {String} name Name of the route.
 *  @param {String} type Type of the SPA route. See
 *         {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`} enumeration
 *         for possible values.
 */
DocmaWeb.Route = function (docma, name, type) {
    this._docma = docma;
    if (!type || _arrRouteTypes.indexOf(type) < 0) return; // 404

    if (!name) {
        if (type !== DocmaWeb.Route.Type.API) return; // 404
        name = docma._.defaultApiName;
    } else {
        if (!docma.app.routing.caseSensitive) name = name.toLowerCase();
    }

    // `docma.routes` array is created @ build-time. If no route is found;
    // this will create a `Route` instance but it will be equivalent to 404
    // route. No properties such as `id`, `name`, `type` and `path`.

    // search in existing routes.
    var info = Utils._find(docma.routes, {
        type: type,
        name: name
    });
    // if found, assign properties `id`, `name`, `type` and `path`.
    if (info) Utils._assign(this, info);
};

/**
 *  Enumerates the Docma SPA route types.
 *  @name DocmaWeb.Route.Type
 *  @enum {String}
 *  @static
 *  @readonly
 *
 *  @example <caption>When `docma.app.routing.method` is `"query"`</caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             ?api
 *  api      web               ?api=web
 *  content  templates         ?content=templates
 *  content  guide             ?content=guide
 *
 *  @example <caption>When `docma.app.routing.method` is `"path"`</caption>
 *  type     name              path
 *  -------  ----------------  --------------------------
 *  api      _def_             api/
 *  api      web               api/web/
 *  content  templates         templates/
 *  content  guide             guide/
 *
 */
DocmaWeb.Route.Type = {
    /**
     *  Indicates that the route is for API documentation content, generated
     *  from one or more Javascript files.
     *  @type {String}
     */
    API: 'api',
    /**
     *  Indicates that the route is for other content, such as parsed HTML
     *  files or HTML files generated from markdown.
     *  @type {String}
     */
    CONTENT: 'content'
};
_arrRouteTypes = Utils._values(DocmaWeb.Route.Type);

/**
 *  Enumerates the source types that a SPA route is generated from.
 *  @name DocmaWeb.Route.SourceType
 *  @enum {String}
 *  @static
 *  @readonly
 */
DocmaWeb.Route.SourceType = {
    /**
     *  Indicates that the documentation route is generated from Javascript
     *  source.
     *  @type {String}
     */
    JS: 'js',
    /**
     *  Indicates that the documentation route is generated from markdown
     *  source.
     *  @type {String}
     */
    MD: 'md',
    /**
     *  Indicates that the documentation route is generated from HTML
     *  source.
     *  @type {String}
     */
    HTML: 'html'
};

/**
 *  Gets the ID of the route. A route ID consists of the route type and the
 *  name; delimited via a colon. e.g. `api:web`.
 *  @name DocmaWeb.Route#id
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the path of the generated content (HTML) file.
 *  If this is an API route, `contentPath` is `null`.
 *  @name DocmaWeb.Route#contentPath
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the URL path of the SPA route. For example, if SPA route method is
 *  `query`, the URL path for a route named `guide` will be `?content=guide`.
 *  If routing method is `path` it will be `guide/`.
 *  @name DocmaWeb.Route#path
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the type of the generated SPA route. See
 *  {@link #DocmaWeb.Route.Type|`DocmaWeb.Route.Type`} enumeration
 *  for possible values.
 *  @name DocmaWeb.Route#type
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the type of the source which this route is generated from. See
 *  {@link #DocmaWeb.Route.SourceType|`DocmaWeb.Route.SourceType`} enumeration
 *  for possible values.
 *  @name DocmaWeb.Route#sourceType
 *  @type {String}
 *  @instance
 */

/**
 *  Gets the name of the SPA route, which is either set by the user when
 *  building the documentation; or auto-generated from the source file name.
 *  @name DocmaWeb.Route#name
 *  @type {String}
 *  @instance
 */

/**
 *  Checks whether the route actually exists.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.exists = function () {
    return Boolean(this.id);
};

/**
 *  Checks whether the route is equal to the given route.
 *  @param {DocmaWeb.Route} routeInfo - Route to be checked against.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.isEqualTo = function (routeInfo) {
    if (!routeInfo || !routeInfo.exists() || !this.exists()) return false;
    return routeInfo.path === this.path;
};

/**
 *  Checks whether the route is currently being viewed.
 *  @param {DocmaWeb.Route} routeInfo - Object to be checked.
 *  @returns {Boolean} -
 */
DocmaWeb.Route.prototype.isCurrent = function () {
    return this.isEqualTo(this._docma.currentRoute);
};

/**
 *  Applies the route to the application.
 *  @emits DocmaWeb~event:route
 *  @param {Function} [cb] - Callback function to be executed after route is
 *  rendered.
 *  @returns {DocmaWeb.Route} - The route instance for chaining.
 */
DocmaWeb.Route.prototype.apply = function (cb) {
    if (this.type === DocmaWeb.Route.Type.API) {
        this._docma._.documentation = this._docma.apis[this.name].documentation;
        this._docma._.symbols = this._docma.apis[this.name].symbols;
    } else {
        // reset documentation & symbols since this is not an API route
        this._docma._.documentation = null;
        this._docma._.symbols = null;
    }
    // this._docma.log('Route Info:', this.toString());
    this._docma._trigger(DocmaWeb.Event.Route, [this.exists() ? this : null]);
    this._docma.render(this, cb);
    return this;
};

/**
 *  Gets the string representation of the route.
 *  @returns {String} -
 */
DocmaWeb.Route.prototype.toString = function () {
    var o = this.toJSON();
    return Object.keys(o).map(function (key) {
        return key + ': ' + o[key];
    }).join(', ');
};

/**
 *  @private
 *  @returns {Object} - Always return an object for toJSON() method.
 */
DocmaWeb.Route.prototype.toJSON = function () {
    return {
        id: this.id,
        contentPath: this.contentPath,
        path: this.path,
        type: this.type,
        sourceType: this.sourceType,
        name: this.name
    };
};
