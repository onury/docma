import utils from '../lib/utils';
import NotationGlob from './notation.glob';
import NotationError from './notation.error';

// TODO:
// templates? ${some.property}
// Error if source object has flattened (dotted) keys.
// expand if dotted keyed object is passed to constructor?

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors

const ERR = {
    SOURCE: 'Invalid source object.',
    DEST: 'Invalid destination object.',
    NOTATION: 'Invalid notation: ',
    NOTA_OBJ: 'Invalid notations object: '
};

/**
 *  Notation.js for Node and Browser.
 *
 *  Like in most programming languages, JavaScript makes use of dot-notation to
 *  access the value a member of an object (or class). While accessing the
 *  value of the object property; notation also indicates the path of the target
 *  property.
 *
 *  `Notation` class provides various methods for modifying / processing the
 *  contents of the given object; by parsing object notation strings or globs.
 *
 *  Note that this class will only deal with enumerable properties of the
 *  source object; so it should be used to manipulate data objects. It will
 *  not deal with preserving the prototype-chain of the given object.
 *
 *  @version  0.7.0 (2015-05-05)
 *  @author   Onur Yıldırım (onur@cutepilot.com)
 *  @license  MIT
 */
class Notation {

    /**
     *  Initializes a new instance of `Notation`.
     *
     *  @param {Object} [object={}] - The source object to be notated.
     *
     *  @returns {Notation}
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", model: "Charger", year: 1970 } };
     *  var notaAssets = new Notation(assets);
     *  notaAssets.get('car.model'); // "Charger"
     */
    constructor(object = {}) {
        // if defined, it should be an object.
        if (!utils.isObject(object)) {
            throw new NotationError(ERR.SOURCE);
        }
        this._source = object;
    }

    // --------------------------------
    // Notation Instance Properties
    // --------------------------------

    /**
     *  Gets the value of the source object.
     *  @type {Object}
     *
     *  @example
     *  var o = { name: "Onur" };
     *  var me = Notation.create(o)
     *      .set("age", 36)
     *      .set("car.brand", "Ford")
     *      .set("car.model", "Mustang")
     *      .value;
     *  console.log(me);
     *  // { name: "Onur", age: 36, car: { brand: "Ford", model: "Mustang" } }
     *  console.log(o === me);
     *  // true
     */
    get value() {
        return this._source;
    }

    // --------------------------------
    // Notation Instance Methods
    // --------------------------------

    /**
     *  Recursively iterates through each key of the source object and invokes
     *  the given callback function with parameters, on each non-object value.
     *
     *  @param {Function} callback - The callback function to be invoked on
     *  each on each non-object value. To break out of the loop, return `false`
     *  from within the callback.
     *  Callback signature: `callback(notation, key, value, object) { ... }`
     *
     *  @returns {void}
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", model: "Charger", year: 1970 } };
     *  Notation.create(assets).eachKey(function (notation, key, value, object) {
     *      console.log(notation, value);
     *  });
     *  // "car.brand"  "Dodge"
     *  // "car.model"  "Charger"
     *  // "car.year"  1970
     */
    eachKey(callback) {
        let o = this._source,
            keys = Object.keys(o);
        utils.each(keys, (key, index, list) => {
            // this is preserved in arrow functions
            let prop = o[key],
                N;
            if (utils.isObject(prop)) {
                N = new Notation(prop);
                N.eachKey((notation, nKey, value, prop) => {
                    let subKey = key + '.' + notation;
                    callback.call(N, subKey, nKey, value, o);
                });
            } else {
                callback.call(this, key, key, prop, o);
            }
        });
    }

    /**
     *  Iterates through each note of the given notation string by evaluating
     *  it on the source object.
     *
     *  @param {String} notation - The notation string to be iterated through.
     *  @param {Function} callback - The callback function to be invoked on
     *  each iteration. To break out of the loop, return `false` from within
     *  the callback.
     *  Callback signature: `callback(levelValue, note, index, list) { ... }`
     *
     *  @returns {void}
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", model: "Charger", year: 1970 } };
     *  Notation.create(assets)
     *      .eachNoteValue("car.brand", function (levelValue, note, index, list) {
     *          console.log(note, levelValue); // "car.brand" "Dodge"
     *      });
     */
    eachNoteValue(notation, callback) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        var level = this._source;
        Notation.eachNote(notation, (levelNotation, note, index, list) => {
            level = utils.hasOwn(level, note) ? level[note] : undefined;
            if (callback(level, levelNotation, note, index, list) === false) return false;

        });
    }

    /**
     *  Gets the list of notations from the source object (keys).
     *
     *  @returns {Array} - An array of notation strings.
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", model: "Charger", year: 1970 } };
     *  var notationsList = Notation.create(assets).getNotations();
     *  // [ "car.brand", "car.model", "car.year" ]
     */
    getNotations() {
        let list = [];
        this.eachKey((notation, key, value, obj) => {
            list.push(notation);
        });
        return list;
    }

    /**
     *  Gets a flat (single-level) object with notated keys, from the source object.
     *  @alias Notation#getMap
     *
     *  @returns {Object} - A new object with flat, notated keys.
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", model: "Charger", year: 1970 } };
     *  var flat = Notation.create(assets).getFlat();
     *  // { "car.brand": "Dodge", "car.model": "Charger", "car.year": 1970 }
     */
    getFlat() {
        let o = {};
        this.eachKey((notation, key, value, obj) => {
            o[notation] = value;
        });
        return o;
    }
    /**
     *  Alias for `#getFlat`
     *  @private
     */
    getMap() {
        return this.getFlat();
    }

    /**
     *  Inspects the given notation on the source object by checking
     *  if the source object actually has the notated property;
     *  and getting its value if exists.
     *
     *  @param {String} notation - The notation string to be inspected.
     *
     *  @returns {Object} - The result object has the following properties:
     *      `result.has` {Boolean} - Indicates whether the source object
     *      has the given notation as a (leveled) enumerable property.
     *      If the property exists but has a value of `undefined`,
     *      this will still return `true`.
     *      `result.value` {*} - The value of the notated property.
     *      if the source object does not have the notation,
     *      the value will be `undefined`.
     *
     *  @example
     *  Notation.create({ car: { year: 1970 } }).inspect("car.year");
     *  // { has: true, value: 1970 }
     *  Notation.create({ car: { year: 1970 } }).inspect("car.color");
     *  // { has: false, value: undefined }
     *  Notation.create({ car: { color: undefined } }).inspect("car.color");
     *  // { has: true, value: undefined }
     */
    inspect(notation) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        let level = this._source,
            result = { has: false, value: undefined };
        Notation.eachNote(notation, (levelNotation, note, index, list) => {
            if (utils.hasOwn(level, note)) {
                level = level[note];
                result = { has: true, value: level };
            } else {
                // level = undefined;
                result = { has: false, value: undefined };
                return false; // break out
            }
        });
        return result;
    }

    /**
     *  Inspects and removes the given notation from the source object
     *  by checking if the source object actually has the notated property;
     *  and getting its value if exists, before removing the property.
     *
     *  @param {String} notation - The notation string to be inspected.
     *
     *  @returns {Object} - The result object has the following properties:
     *      `result.has` {Boolean} - Indicates whether the source object
     *      has the given notation as a (leveled) enumerable property.
     *      If the property exists but has a value of `undefined`,
     *      this will still return `true`.
     *      `result.value` {*} - The value of the removed property.
     *      if the source object does not have the notation,
     *      the value will be `undefined`.
     *
     *  @example
     *  var obj = { name: "John", car: { year: 1970 } };
     *  Notation.create(obj).inspectRemove("car.year"); // { has: true, value: 1970 }
     *  // obj » { name: "John", car: {} }
     *  Notation.create(obj).inspectRemove("car.year", true); // { has: true, value: 1970 }
     *  // obj » { name: "John" }
     *  Notation.create({ car: { year: 1970 } }).inspectRemove("car.color");
     *  // { has: false, value: undefined }
     *  Notation.create({ car: { color: undefined } }).inspectRemove("car.color");
     *  // { has: true, value: undefined }
     */
    inspectRemove(notation) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        let o, lastNote;
        if (notation.indexOf('.') < 0) {
            lastNote = notation;
            o = this._source;
        } else {
            let upToLast = Notation.parent(notation);
            lastNote = Notation.last(notation);
            o = this.inspect(upToLast).value;
        }
        let result;
        if (utils.hasOwn(o, lastNote)) {
            result = { has: true, value: o[lastNote] };
            delete o[lastNote];
        } else {
            result = { has: false, value: undefined };
        }

        return result;
    }

    /**
     *  Checks whether the source object has the given notation
     *  as a (leveled) enumerable property. If the property exists
     *  but has a value of `undefined`, this will still return `true`.
     *
     *  @param {String} notation - The notation string to be checked.
     *
     *  @returns {Boolean}
     *
     *  @example
     *  Notation.create({ car: { year: 1970 } }).has("car.year"); // true
     *  Notation.create({ car: { year: undefined } }).has("car.year"); // true
     *  Notation.create({}).has("car.color"); // false
     */
    has(notation) {
        return this.inspect(notation).has;
    }

    /**
     *  Checks whether the source object has the given notation
     *  as a (leveled) defined enumerable property. If the property
     *  exists but has a value of `undefined`, this will return `false`.
     *
     *  @param {String} notation - The notation string to be checked.
     *
     *  @returns {Boolean}
     *
     *  @example
     *  Notation.create({ car: { year: 1970 } }).hasDefined("car.year"); // true
     *  Notation.create({ car: { year: undefined } }).hasDefined("car.year"); // false
     *  Notation.create({}).hasDefined("car.color"); // false
     */
    hasDefined(notation) {
        return this.inspect(notation).value !== undefined;
    }

    /**
     *  Gets the value of the corresponding property at the given
     *  notation.
     *
     *  @param {String} notation - The notation string to be processed.
     *  @param {String} [defaultValue] - The default value to be returned if
     *  the property is not found or enumerable.
     *
     *  @returns {*} - The value of the notated property.
     *
     *  @example
     *  Notation.create({ car: { brand: "Dodge" } }).get("car.brand"); // "Dodge"
     *  Notation.create({ car: {} }).get("car.model"); // undefined
     *  Notation.create({ car: {} }).get("car.model", "Challenger"); // "Challenger"
     *  Notation.create({ car: { model: undefined } }).get("car.model", "Challenger"); // undefined
     */
    get(notation, defaultValue) {
        let result = this.inspect(notation);
        return !result.has ? defaultValue : result.value;
    }

    /**
     *  Sets the value of the corresponding property at the given
     *  notation. If the property does not exist, it will be created
     *  and nested at the calculated level. If it exists; its value
     *  will be overwritten by default.
     *  @chainable
     *
     *  @param {String} notation - The notation string to be processed.
     *  @param {*} value - The value to be set for the notated property.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property
     *  if exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", year: 1970 } };
     *  Notation.create(assets)
     *      .set("car.brand", "Ford")
     *      .set("car.model", "Mustang")
     *      .set("car.year", 1965, false)
     *      .set("car.color", "red")
     *      .set("boat", "none");
     *  console.log(assets);
     *  // { notebook: "Mac", car: { brand: "Ford", model: "Mustang", year: 1970, color: "red" } };
     */
    set(notation, value, overwrite = true) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        let level = this._source,
            last;
        Notation.eachNote(notation, (levelNotation, note, index, list) => {
            last = index === list.length - 1;
            // check if the property is at this level
            if (utils.hasOwn(level, note)) {
                // check if we're at the last level
                if (last) {
                    // if overwrite is set, assign the value.
                    if (overwrite) level[note] = value;
                } else {
                    // if not, just re-reference the current level.
                    level = level[note];
                }
            } else {
                // we don't have this property at this level
                // so; if this is the last level, we set the value
                // if not, we set an empty object for the next level
                level = level[note] = (last ? value : {});
            }
        });
        return this;
    }

    /**
     *  Just like the `.set()` method but instead of a single notation
     *  string, an object of notations and values can be passed.
     *  Sets the value of each corresponding property at the given
     *  notation. If a property does not exist, it will be created
     *  and nested at the calculated level. If it exists; its value
     *  will be overwritten by default.
     *  @chainable
     *
     *  @param {Object} notationsObject - The notations object to be processed.
     *  This can either be a regular object with non-dotted keys
     *  (which will be merged to the first/root level of the source object);
     *  or a flattened object with notated (dotted) keys.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite a property if
     *  exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", year: 1970 } };
     *  Notation.create(assets)
     *      .merge({
     *          "car.brand": "Ford",
     *          "car.model": "Mustang",
     *          "car.year": 1965, false,
     *          "car.color": "red",
     *          "boat": "none"
     *      });
     *  console.log(assets);
     *  // { notebook: "Mac", car: { brand: "Ford", model: "Mustang", year: 1970, color: "red" } };
     */
    merge(notationsObject, overwrite = true) {
        if (!utils.isObject(notationsObject)) {
            throw new NotationError(ERR.NOTA_OBJ + '`' + notationsObject + '`');
        }
        let value;
        utils.each(Object.keys(notationsObject), (notation, index, obj) => {
            // this is preserved in arrow functions
            value = notationsObject[notation];
            this.set(notation, value, overwrite);
        });
        return this;
    }

    /**
     *  Removes the properties by the given list of notations from the source
     *  object and returns a new object with the removed properties.
     *  Opposite of `merge()` method.
     *
     *  @param {Array} notationsArray - The notations array to be processed.
     *
     *  @returns {Object} - An object with the removed properties.
     *
     *  @example
     *  var assets = { car: { brand: "Dodge", year: 1970 }, notebook: "Mac" };
     *  var separated = Notation.create(assets).separate(["car.brand", "boat" ]);
     *  console.log(separated);
     *  // { notebook: "Mac", car: { brand: "Ford" } };
     *  console.log(assets);
     *  // { car: { year: 1970 } };
     */
    separate(notationsArray) {
        if (!utils.isArray(notationsArray)) {
            throw new NotationError(ERR.NOTA_OBJ + '`' + notationsArray + '`');
        }
        let o = new Notation({});
        utils.each(notationsArray, (notation, index, obj) => {
            // this is preserved in arrow functions
            let result = this.inspectRemove(notation);
            o.set(notation, result.value);
        });
        return o._source;
    }

    // iterate globs
    // remove non-star negated globs directly
    // get non-star part iterate thru obj keys

    /**
     *  Deep clones the source object while filtering its properties
     *  by the given glob notations. Includes all matched properties
     *  and removes the rest.
     *
     *  @param {Array|String} globNotations - The glob notation(s) to
     *  be processed. The difference between normal notations and
     *  glob-notations is that you can use wildcard stars (*) and
     *  negate the notation by prepending a bang (!). A negated
     *  notation will be excluded. Order of the globs do not matter,
     *  they will be logically sorted. Loose globs will be processed
     *  first and verbose globs or normal notations will be processed
     *  last. e.g. `[ "car.model", "*", "!car.*" ]` will be sorted as
     *  `[ "*", "!car.*", "car.model" ]`.
     *  Passing no parameters or passing an empty string (`""` or `[""]`)
     *  will empty the source object.
     *  @chainable
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { notebook: "Mac", car: { brand: "Ford", model: "Mustang", year: 1970, color: "red" } };
     *  var nota = Notation.create(assets);
     *  nota.filter([ "*", "!car.*", "car.model" ]);
     *  console.log(assets); // { notebook: "Mac", car: { model: "Mustang" } }
     *  nota.filter("*");
     *  console.log(assets); // { notebook: "Mac", car: { model: "Mustang" } }
     *  nota.filter(); // or nota.filter("");
     *  console.log(assets); // {}
     */
    filter(globNotations) {
        let original = this.value,
            copy = utils.deepCopy(original);
        // if globNotations is "*" or ["*"] set the "copy" as source and
        // return.
        if (utils.stringOrArrayOf(globNotations, '*')) {
            this._source = copy;
            return this;
        }
        // if globNotations is "" or [""] set source to `{}` and return.
        if (arguments.length === 0 || utils.stringOrArrayOf(globNotations, '')) {
            this._source = {};
            return this;
        }
        let globs = utils.isArray(globNotations)
            // sort the globs in logical order. we also concat the array first
            // bec. we'll change it's content via `.shift()`
            ? NotationGlob.sort(globNotations.concat()) : [globNotations];
        let filtered;
        // if the first item of sorted globs is "*" we set the source to the
        // (full) "copy" and remove the "*" from globs (not to re-process).
        if (globs[0] === '*') {
            filtered = new Notation(copy);
            globs.shift();
        } else {
            // otherwise we set an empty object as the source so that we can
            // add notations/properties to it.
            filtered = new Notation({});
        }
        let g, endStar, normalized;
        // iterate through globs
        utils.each(globs, (globNotation, index, array) => {
            g = new NotationGlob(globNotation);
            // set flag that indicates whether the glob ends with `.*`
            endStar = g.normalized.slice(-2) === '.*';
            // get the remaining part as the (extra) normalized glob
            normalized = endStar ? g.normalized.slice(0, -2) : g.normalized;
            // check if normalized glob has no wildcard stars e.g. "a.b" or
            // "!a.b.c" etc..
            if (normalized.indexOf('*') < 0) {
                if (g.isNegated) {
                    // directly remove the notation if negated
                    filtered.remove(normalized);
                    // if original glob had `.*` at the end, it means remove
                    // contents (not itself). so we'll set an empty object.
                    // meaning `some.prop` (prop) is removed completely but
                    // `some.prop.*` (prop) results in `{}`.
                    if (endStar) filtered.set(normalized, {}, true);
                } else {
                    // directly copy the same notation from the original
                    filtered.copyFrom(original, normalized, null, true);
                }
                // move to the next
                return true;
            }
            // if glob has wildcard star(s), we'll iterate through keys of the
            // source object and see if (full) notation of each key matches
            // the current glob.

            // TODO: Optimize the loop below. Instead of checking each key's
            // notation, get the non-star left part of the glob and iterate
            // that property of the source object.
            this.eachKey((originalNotation, key, value, obj) => {
                // console.log(originalNotation, key);
                if (g.test(originalNotation)) {
                    if (g.isNegated) {
                        filtered.remove(originalNotation);
                    } else {
                        filtered.set(originalNotation, value, true);
                    }
                }
            });
        });
        // finally set the filtered's value as the source of our instance and
        // return.
        this._source = filtered.value;
        return this;
    }

    // store.partners.*
    // *.host » iterate original obj
    // store.*.host » iterate store obj

    // TODO: remove support for char-star. e.g. `prop1.prop*2`

    /**
     *  Removes the property at the given notation, from the source object.
     *  @chainable
     *
     *  @param {String} notation - The notation to be inspected.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { notebook: "Mac", car: { model: "Mustang" } };
     *  Notation.create(assets).remove("car.model");
     *  console.log(assets); // { notebook: "Mac", car: { } }
     */
    remove(notation) {
        this.inspectRemove(notation);
        return this;
    }
    // Notation.prototype.delete = Notation.prototype.remove;

    /**
     *  Clones the `Notation` instance to a new one.
     *
     *  @returns {Notation} - A new copy of the instance.
     */
    clone() {
        let o = utils.deepCopy(this.value);
        return new Notation(o);
    }

    /**
     *  Copies the notated property from the source object and adds it to the
     *  destination — only if the source object actually has that property.
     *  This is different than a property with a value of `undefined`.
     *  @chainable
     *
     *  @param {Object} destination - The destination object that the notated
     *  properties will be copied to.
     *  @param {String} notation - The notation to get the corresponding property
     *  from the source object.
     *  @param {String} [newNotation=null] - The notation to set the source property
     *  on the destination object. In other words, the copied property will be
     *  renamed to this value before set on the destination object. If not set,
     *  `notation` argument will be used.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property on
     *  the destination object if it exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var models = { dodge: "Charger" };
     *  Notation.create(assets).copyTo(models, "car.model", "ford");
     *  console.log(models);
     *  // { dodge: "Charger", ford: "Mustang" }
     *  // assets object is not modified
     */
    copyTo(destination, notation, newNotation = null, overwrite = true) {
        if (!utils.isObject(destination)) throw new NotationError(ERR.DEST);
        let result = this.inspect(notation);
        if (result.has) {
            new Notation(destination).set(newNotation || notation, result.value, overwrite);
        }
        return this;
    }

    /**
     *  Copies the notated property from the destination object and adds it to the
     *  source object — only if the destination object actually has that property.
     *  This is different than a property with a value of `undefined`.
     *  @chainable
     *
     *  @param {Object} destination - The destination object that the notated
     *  properties will be copied from.
     *  @param {String} notation - The notation to get the corresponding property
     *  from the destination object.
     *  @param {String} [newNotation=null] - The notation to set the destination
     *  property on the source object. In other words, the copied property
     *  will be renamed to this value before set on the source object.
     *  If not set, `notation` argument will be used.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property
     *  on the source object if it exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var models = { dodge: "Charger" };
     *  Notation.create(assets).copyFrom(models, "dodge", "car.model", true);
     *  console.log(assets);
     *  // { car: { brand: "Ford", model: "Charger" } }
     *  // models object is not modified
     */
    copyFrom(destination, notation, newNotation = null, overwrite = true) {
        if (!utils.isObject(destination)) throw new NotationError(ERR.DEST);
        let result = new Notation(destination).inspect(notation);
        if (result.has) {
            this.set(newNotation || notation, result.value, overwrite);
        }
        return this;
    }

    /**
     *  Removes the notated property from the source object and adds it to the
     *  destination — only if the source object actually has that property.
     *  This is different than a property with a value of `undefined`.
     *  @chainable
     *
     *  @param {Object} destination - The destination object that the notated
     *  properties will be moved to.
     *  @param {String} notation - The notation to get the corresponding
     *  property from the source object.
     *  @param {String} [newNotation=null] - The notation to set the source property
     *  on the destination object. In other words, the moved property will be
     *  renamed to this value before set on the destination object. If not set,
     *  `notation` argument will be used.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property on
     *  the destination object if it exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var models = { dodge: "Charger" };
     *  Notation.create(assets).moveTo(models, "car.model", "ford");
     *  console.log(assets);
     *  // { car: { brand: "Ford" } }
     *  console.log(models);
     *  // { dodge: "Charger", ford: "Mustang" }
     */
    moveTo(destination, notation, newNotation = null, overwrite = true) {
        if (!utils.isObject(destination)) throw new NotationError(ERR.DEST);
        let result = this.inspectRemove(notation);
        if (result.has) {
            new Notation(destination).set(newNotation || notation, result.value, overwrite);
        }
        return this;
    }

    /**
     *  Removes the notated property from the destination object and adds it to the
     *  source object — only if the destination object actually has that property.
     *  This is different than a property with a value of `undefined`.
     *  @chainable
     *
     *  @param {Object} destination - The destination object that the notated
     *  properties will be moved from.
     *  @param {String} notation - The notation to get the corresponding property
     *  from the destination object.
     *  @param {String} [newNotation=null] - The notation to set the destination
     *  property on the source object. In other words, the moved property
     *  will be renamed to this value before set on the source object.
     *  If not set, `notation` argument will be used.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property on
     *  the source object if it exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var models = { dodge: "Charger" };
     *  Notation.create(assets).moveFrom(models, "dodge", "car.model", true);
     *  console.log(assets);
     *  // { car: { brand: "Ford", model: "Charger" } }
     *  console.log(models);
     *  // {}
     */
    moveFrom(destination, notation, newNotation = null, overwrite = true) {
        if (!utils.isObject(destination)) throw new NotationError(ERR.DEST);
        let result = new Notation(destination).inspectRemove(notation);
        if (result.has) {
            this.set(newNotation || notation, result.value, overwrite);
        }
        return this;
    }

    /**
     *  Renames the notated property of the source object by the new notation.
     *  @alias Notation#renote
     *  @chainable
     *
     *  @param {String} notation - The notation to get the corresponding
     *  property (value) from the source object.
     *  @param {String} newNotation - The new notation for the targeted
     *  property value. If not set, the source object will not be modified.
     *  @param {Boolean} [overwrite=true] - Whether to overwrite the property at
     *  the new notation, if it exists.
     *
     *  @returns {Notation} - Returns the current `Notation` instance (self).
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  Notation.create(assets)
     *      .rename("car.brand", "carBrand")
     *      .rename("car.model", "carModel");
     *  console.log(assets);
     *  // { carBrand: "Ford", carModel: "Mustang" }
     */
    rename(notation, newNotation, overwrite) {
        if (!newNotation) return this;
        return this.moveTo(this._source, notation, newNotation, overwrite);
    }
    /**
     *  Alias for `#rename`
     *  @private
     */
    renote(notation, newNotation, overwrite) {
        return this.rename(notation, newNotation, overwrite);
    }

    /**
     *  Extracts the property at the given notation to a new object by copying
     *  it from the source object. This is equivalent to `.copyTo({}, notation, newNotation)`.
     *  @alias Notation#copyToNew
     *
     *  @param {String} notation - The notation to get the corresponding
     *  property (value) from the source object.
     *  @param {String} newNotation - The new notation to be set on the new
     *  object for the targeted property value. If not set, `notation` argument
     *  will be used.
     *
     *  @returns {Object} - Returns a new object with the notated property.
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var extracted = Notation.create(assets).extract("car.brand", "carBrand");
     *  console.log(extracted);
     *  // { carBrand: "Ford" }
     *  // assets object is not modified
     */
    extract(notation, newNotation) {
        let o = {};
        this.copyTo(o, notation, newNotation);
        return o;
    }
    /**
     *  Alias for `#extract`
     *  @private
     */
    copyToNew(notation, newNotation) {
        return this.extract(notation, newNotation);
    }

    /**
     *  Extrudes the property at the given notation to a new object by moving
     *  it from the source object. This is equivalent to `.moveTo({}, notation, newNotation)`.
     *  @alias Notation#moveToNew
     *
     *  @param {String} notation - The notation to get the corresponding
     *  property (value) from the source object.
     *  @param {String} newNotation - The new notation to be set on the new
     *  object for the targeted property value. If not set, `notation` argument
     *  will be used.
     *
     *  @returns {Object} - Returns a new object with the notated property.
     *
     *  @example
     *  var assets = { car: { brand: "Ford", model: "Mustang" } };
     *  var extruded = Notation.create(assets).extrude("car.brand", "carBrand");
     *  console.log(assets);
     *  // { car: { model: "Mustang" } }
     *  console.log(extruded);
     *  // { carBrand: "Ford" }
     */
    extrude(notation, newNotation) {
        let o = {};
        this.moveTo(o, notation, newNotation);
        return o;
    }
    /**
     *  Alias for `#extrude`
     *  @private
     */
    moveToNew(notation, newNotation) {
        return this.extrude(notation, newNotation);
    }

    // --------------------------------
    // Notation Static Methods
    // --------------------------------

    /**
     *  Basically constructs a new `Notation` instance with the given object.
     *  @chainable
     *
     *  @param {Object} [object={}] - The object to be notated.
     *
     *  @returns {Notation} - The created instance.
     *
     *  @example
     *  var notaObj = Notation.create(obj);
     *  // equivalent to:
     *  var notaObj = new Notation(obj);
     */
    static create(object = {}) {
        return new Notation(object);
    }

    /**
     *  Checks whether the given notation string is valid.
     *
     *  @param {String} notation - The notation string to be checked.
     *
     *  @returns {Boolean}
     *
     *  @example
     *  Notation.isValid('prop1.prop2.prop3'); // true
     *  Notation.isValid('prop1'); // true
     *  Notation.isValid(null); // false
     */
    static isValid(notation) {
        return (typeof notation === 'string') &&
            (/^[^\s\.!]+(\.[^\s\.!]+)*$/).test(notation);
    }

    /**
     *  Gets the first (root) note of the notation string.
     *
     *  @param {String} notation - The notation string to be processed.
     *
     *  @returns {String}
     *
     *  @example
     *  Notation.first('first.prop2.last'); // "first"
     */
    static first(notation) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        // return notation.replace(/.*\.([^\.]*$)/, '$1');
        return notation.split('.')[0];
    }

    /**
     *  Gets the last note of the notation string.
     *
     *  @param {String} notation - The notation string to be processed.
     *
     *  @returns {String}
     *
     *  @example
     *  Notation.last('first.prop2.last'); // "last"
     */
    static last(notation) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        // return notation.replace(/.*\.([^\.]*$)/, '$1');
        return notation.split('.').reverse()[0];
    }

    /**
     *  Gets the parent notation (up to but excluding the last note)
     *  from the notation string.
     *
     *  @param {String} notation - The notation string to be processed.
     *
     *  @returns {String}
     *
     *  @example
     *  Notation.parent('first.prop2.last'); // "first.prop2"
     *  Notation.parent('single'); // null
     */
    static parent(notation) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        return notation.indexOf('.') >= 0
            ? notation.replace(/\.[^\.]*$/, '')
            : null;
    }

    /**
     *  Iterates through each note of the given notation string.
     *
     *  @param {String} notation - The notation string to be iterated through.
     *  @param {Function} callback - The callback function to be invoked on
     *  each iteration. To break out of the loop, return `false` from within the
     *  callback.
     *  Callback signature: `callback(levelNotation, note, index, list) { ... }`
     *
     *  @returns {void}
     *
     *  @example
     *  Notation.eachNote("first.prop2.last", function (levelNotation, note, index, list) {
     *      console.log(index, note, levelNotation);
     *  });
     *  // 0 "first" "first"
     *  // 1 "first.prop2" "prop2"
     *  // 2 "first.prop2.last" "last"
     */
    static eachNote(notation, callback) {
        if (!Notation.isValid(notation)) {
            throw new NotationError(ERR.NOTATION + '`' + notation + '`');
        }
        let notes = notation.split('.'),
            levelNotes = [],
            levelNotation;
        utils.each(notes, (note, index, list) => {
            levelNotes.push(note);
            levelNotation = levelNotes.join('.');
            if (callback(levelNotation, note, index, notes) === false) return false;
        }, Notation);
    }

}

/**
 *  Error class specific to `Notation`.
 *  @type {NotationError}
 *  @see `{@link NotationError}`
 */
Notation.Error = NotationError;

/**
 *  Utility for validating, comparing and sorting dot-notation globs.
 *  This is internally used by `Notation` class.
 *  @type {NotationGlob}
 *  @see `{@link NotationGlob}`
 */
Notation.Glob = NotationGlob;

export default Notation;
