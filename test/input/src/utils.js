
let toString = Object.prototype.toString;

/**
 *  Utils class.
 *  @class
 */
const utils = {

    /**
     *  Checks whether the given object is an `Object`.
     *  @param {*} o - Object to be checked.
     *  @returns {Boolean}
     */
    isObject(o) {
        return toString.call(o) === '[object Object]';
    },

    /**
     *  Checks whether the given object is an `Array`.
     *  @param {*} o - Object to be checked.
     *  @returns {Boolean}
     */
    isArray(o) {
        return toString.call(o) === '[object Array]';
    },

    /**
     *  Checks whether the given object has a specific own property.
     *  @param {*} o - Object to be checked.
     *  @param {String} prop - Property name to be checked.
     *  @returns {Boolean}
     */
    hasOwn(o, prop) {
        return o && typeof o.hasOwnProperty === 'function' && o.hasOwnProperty(prop);
    },

    /**
     *  Deep copies the given object.
     *  @param {*} o - Object to be copied.
     *  @returns {Object}
     */
    deepCopy(object) {
        if (!utils.isObject(object)) return object;
        var k, o,
            copy = {};
        for (k in object) {
            if (utils.hasOwn(object, k)) {
                o = object[k];
                copy[k] = utils.isObject(o) ? utils.deepCopy(o) : o;
            }
        }
        return copy;
    },

    /**
     *  iterates over elements of an array, executing the callback for each
     *  element.
     *  @param {Array} array - Target array.
     *  @param {Function} callback - Callback to be executed on each iteration.
     *  @param {*} thisArg - Context object for the callback. (`this`)
     *  @returns {void}
     */
    each(array, callback, thisArg) {
        var length = array.length,
            index = -1;
        while (++index < length) {
            if (callback.call(thisArg, array[index], index, array) === false) break;
        }
    }

};

export default utils;
