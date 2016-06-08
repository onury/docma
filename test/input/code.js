/**
 * This is the Code class for testing docma.
 *
 * Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
 * tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
 * quis nostrud {@link https://github.com/onury/docma|GitHub Project}
 * exercitation ullamco laboris nisi ut aliquip ex ea commodo
 * consequat.
 *
 * @see {@link https://github.com/onury/docma|GitHub Project}
 *
 * @license MIT
 * @copyright 2016, Onur Yıldırım (onur@cutepilot.com)
 */
class Code {

    /**
     * Initiates a new instance of the `Code` class.
     *
     * @param {Object} options - Configuration object.
     *     @param {String} [options.language=en]
     *     Language to be used for API requests that supports language configurations.
     *     This is generally used for Google APIs.
     *     See {@link https://developers.google.com/maps/faq#languagesupport|supported languages}..
     *     @param {Boolean} [options.https=true]
     *     As Google recommends; using HTTPS encryption makes your site more secure,
     *     and more resistant to snooping or tampering.
     *     If set to `true`, the API calls are made over HTTPS, at all times.
     *     Setting to `false` will switch to HTTP (even if the page is on HTTPS).
     *     And if set to `null`, current protocol will be used.
     *     Note that some APIs might not work with HTTP such as Google Maps TimeZone API.
     *     @param {Object} options.google - Google specific options.
     *         @param {String} [options.google.version="3.22"]
     *         Google Maps API version to be used.
     *         You can set a greater value or the latest version number and it
     *         should work; but it's not guaranteed.
     *         Find out the {@link https://developers.google.com/maps/documentation/javascript/versions|latest version here}.
     *         @param {String} options.google.key
     *         API key to be used with Google API calls. Although some calls might
     *         work without a key, it is generally required by most Goolge APIs.
     *         To get a free (or premium) key,
     *         {@link https://developers.google.com/maps/documentation/javascript/|click here}.
     *
     * @returns {Code} - A new instance of `Code`.
     *
     * @example
     * var code = new Code({
     *     language: 'en',
     *     google: {
     *         key: 'YOUR-KEY'
     *     }
     * });
     */
    constructor(options) {
        this._ = {};
        this._.config = options;
    }

    // ---------------------------
    // INSTANCE PROPERTIES
    // ---------------------------

    /**
     * Gets the config object for the `Code` instance.
     *
     * @memberof Code
     * @type {Object}
     * @readonly
     */
    get config() {
        return {};
    }

    /**
     * The private property of the `Code` instance which should be hidden in the
     * documentation.
     *
     * @memberof Code
     * @type {Object}
     * @readonly
     * @private
     */
    get hidden() {
        return {};
    }

    // ---------------------------
    // STATIC PROPERTIES
    // ---------------------------

    /**
     * Error class that provides a common type of error object for `Code`.
     *
     * @memberof Code
     * @type {CodeError}
     * @readonly
     * @static
     */
    static get Error() {
        return Error;
    }

    /**
     * Helpful constants and utility methods for Code.
     * @memberof Code
     * @type {Object}
     */
    static get utils() {
        return {};
    }

    // ---------------------------
    // INSTANCE METHODS
    // ---------------------------

    /**
     * Returns a location and accuracy radius based on information about cell
     * towers and WiFi nodes that the mobile client can detect; via the Google
     * Maps Geolocation API.
     * @see {@link https://developers.google.com/maps/documentation/geolocation/intro|Google Maps Geolocation API}
     * @see {@link https://developers.google.com/maps/documentation/geolocation/usage-limits|Usage Limits}
     * @memberof Code
     *
     * @param {Object} [options]
     * Geolocation options.
     *     @param {Number} [options.homeMobileCountryCode]
     *     The mobile country code (MCC) for the device's home network.
     *     @param {Number} [options.homeMobileNetworkCode]
     *     The mobile network code (MNC) for the device's home network.
     *     @param {String} [options.radioType]
     *     The mobile radio type. See `{@link geolocator.RadioType}` enumeration
     *     for possible values. While this field is optional, it should be
     *     included if a value is available, for more accurate results.
     *     @param {string} [options.carrier]
     *     The carrier name. e.g. "Vodafone"
     *     @param {Boolean} [options.considerIp=false]
     *     Specifies whether to fallback to IP geolocation if wifi and cell
     *     tower signals are not available. Note that the IP address in the
     *     request header may not be the IP of the device. Set `considerIp` to
     *     false to disable fall back.
     *     @param {Array} [options.cellTowers]
     *     An array of cell tower objects.
     *     See {@link https://developers.google.com/maps/documentation/geolocation/intro#cell_tower_object|Cell tower objects} for details.
     *     @param {Array} [options.wifiAccessPoints]
     *     An array of WiFi access point objects.
     *     See {@link https://developers.google.com/maps/documentation/geolocation/intro#wifi_access_point_object|WiFi access point objects} for details.
     *     @param {Boolean} [options.addressLookup=false]
     *     Specifies whether to run a reverse-geocode operation for the fetched
     *     coordinates to retrieve detailed address information. Note that this
     *     means an additional request which requires a Google API key to be set
     *     in the Geolocator configuration. See `{@link geolocator.config}`.
     *     @param {Boolean} [options.timezone=false]
     *     Specifies whether to also fetch the time zone information for the
     *     receieved coordinates. Note that this means an additional request
     *     which requires a Google API key to be set in the Geolocator
     *     configuration. See `{@link geolocator.config}`.
     *     @param {Boolean} [options.raw=false]
     *     	Whether to return the raw Google API result.
     * @param {Function} callback - Callback function to be executed
     * when the request completes. This takes 2 arguments:
     * `function (err, location) { ... }`
     * @returns {void}
     *
     * @example
     * var options = {
     *     homeMobileCountryCode: 310,
     *     homeMobileNetworkCode: 410,
     *     carrier: 'Vodafone',
     *     radioType: geolocator.RadioType.GSM,
     *     considerIp: true,
     *     addressLookup: false,
     *     timezone: false
     * };
     * code.requestLocation(options, function (err, location) {
     *     console.log(err || location);
     * });
     */
    instanceMethod(options, callback) {
        callback();
    }

    // ---------------------------
    // STATIC METHODS
    // ---------------------------

    /**
     * Sets or gets the `Code` configuration object.
     * @memberof Code
     *
     * @param {Object} [options] - Configuration object.
     *
     * @returns {Object} - A new instance of `Code`.
     *
     * @example
     * Code.staticMethod({
     *     language: 'en',
     *     google: {
     *         key: 'YOUR-KEY'
     *     }
     * });
     */
    static staticMethod(options) {
        return new Code(options);
    }

}

/**
 *  Property defined outside class definition.
 *  @type {Number}
 */
Code.prop = 1;

/**
 *  Method defined outside class definition.
 *  @returns {Date} - Current date.
 */
Code.method = function () {
    return new Date();
};
/**
 *  Method 2 defined outside class definition.
 *  @static
 *  @returns {void|Number}
 */
Code.method2 = function () {
    return;
};
/**
 *  Method 3 defined outside class definition.
 */
Code.method3 = function (param) {
    return;
};

/**
 *  exporting
 */
export default Code;
