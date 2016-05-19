
let toString = Object.prototype.toString;

const utils = {

    isObject(o) {
        return toString.call(o) === '[object Object]';
    },

    isArray(o) {
        return toString.call(o) === '[object Array]';
    },

    hasOwn(o, prop) {
        return o && typeof o.hasOwnProperty === 'function' && o.hasOwnProperty(prop);
    },

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

    // iterates over elements of an array, executing the callback for each
    // element.
    each(array, callback, thisArg) {
        var length = array.length,
            index = -1;
        while (++index < length) {
            if (callback.call(thisArg, array[index], index, array) === false) break;
        }
    },

    eachRight(array, callback) {
        var index = array.length;
        while (index--) {
            if (callback(array[index], index, array) === false) break;
        }
    },

    // Borrowed from http://phpjs.org/functions/preg_quote
    pregQuote(str, delimiter) {
        return String(str)
            .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    },

    stringOrArrayOf(o, value) {
        return (typeof o === 'string' && o === value)
            || (utils.isArray(o) && o.length === 1 && o[0] === value);
    }

};

export default utils;
