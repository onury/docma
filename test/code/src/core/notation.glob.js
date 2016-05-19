import utils from '../lib/utils';
import NotationError from './notation.error';

// http://www.linfo.org/wildcard.html
// http://en.wikipedia.org/wiki/Glob_%28programming%29
// http://en.wikipedia.org/wiki/Wildcard_character#Computing

/**
 *  `NotationGlob` is a utility for validating, comparing and sorting
 *  dot-notation globs.
 *
 *  You can use {@link http://www.linfo.org/wildcard.html|wildcard} stars `*`
 *  and negate the notation by prepending a bang `!`. A star will include all
 *  the properties at that level and a negated notation will be excluded.
 *
 *  @example
 *  // for the following object;
 *  { name: "John", billing: { account: { id: 1, active: true } } };
 *
 *  "billing.account.*"  // represents `{ id: 1, active: true }`
 *  "billing.account.id" // represents `1`
 *  "!billing.account.*" // represents `{ name: "John" }`
 *  "name" // represents `"John"`
 *  "*" // represents the whole object
 */
class NotationGlob {

    /**
     *  Constructs a `Notation.Glob` object with the given glob string.
     *  @constructor
     *
     *  @param {String} glob - The glob string.
     *
     *  @returns {NotationGlob}
     *
     *  @example
     *  var glob = new Notation.Glob("billing.account.*");
     *  glob.test("billing.account.id"); // true
     */
    constructor(glob) {
        if (!NotationGlob.isValid(glob)) {
            throw new NotationError('Invalid notation glob: "' + glob + '"');
        }
        this.glob = glob;
        let ng = NotationGlob.normalize(glob);
        this.normalized = ng.glob;
        this.isNegated = ng.isNegated;
        this.regexp = NotationGlob.toRegExp(this.normalized);
        this.levels = this.normalized.split('.');
    }

    // --------------------------------
    // NotationGlob Instance Members
    // --------------------------------

    /**
     *  Checks whether the given notation value matches the source notation glob.
     *
     *  @param {String} notation - The notation string to be tested.
     *
     *  @returns {Boolean}
     *
     *  @example
     *  var glob = new Notation.Glob("!prop.*.name");
     *  glob.test("prop.account.name"); // true
     */
    test(notation) {
        // we allow "*" to match everything. We check for this here
        // instead of the regexp bec. we care for dots (.) within the glob.
        return this.normalized === '*'
            || (this.normalized !== '' && notation !== '' && this.regexp.test(notation));
    }

    // --------------------------------
    // NotationGlob Static Members
    // --------------------------------

    /**
     *  Basically constructs a new `NotationGlob` instance
     *  with the given glob string.
     *
     *  @param {String} glob - The source notation glob.
     *
     *  @returns {NotationGlob}
     *
     *  @example
     *  var glob = Notation.Glob.create(strGlob);
     *  // equivalent to:
     *  var glob = new Notation.Glob(strGlob);
     */
    static create(glob) {
        return new NotationGlob(glob);
    }

    /**
     *  Modified from http://stackoverflow.com/a/13818704/112731
     *  @private
     */
    static toRegExp(glob, opts) {
        glob = utils.pregQuote(glob).replace(/\\\*/g, '[^\\s\\.]*').replace(/\\\?/g, '.');
        return new RegExp('^' + glob, opts || '');
        // we don't end it with a $ so the ending is open
        // `company.*` will produce `/^company\.[^\s\.]*/`
        // which will match both `company.name` and `company.address.street`
        // but will not match `some.company.name`
    }

    /**
     *  @private
     */
    static normalize(glob) {
        // replace multiple stars with single
        glob = glob.replace(/\*+/g, '*');
        // empty glob if invalid e.g. '!' | '.abc' | '!*'
        glob = !NotationGlob.isValid(glob) ? '' : glob;
        let bang = glob.slice(0, 1) === '!';
        glob = bang ? glob.slice(1) : glob;
        return {
            glob: glob,
            isNegated: bang
        };
    }

    // Created test at: https://regex101.com/r/tJ7yI9/
    /**
     *  Validates the given notation glob.
     *  @param {String} glob - Notation glob to be validated.
     *  @returns {Boolean}
     */
    static isValid(glob) {
        return (typeof glob === 'string') &&
            (/^!?[^\s\.!]+(\.[^\s\.!]+)*$/).test(glob);
    }

    // TODO: if both "prop.id" and "!prop.id" exists normalize them.
    // since negated will win, remove the other.

    /**
     *  Compares two given notation globs and returns an integer value as a
     *  result. This is generally used to sort glob arrays. Loose globs (with
     *  stars especially closer to beginning of the glob string) and globs
     *  representing the parent/root of the compared property glob come first.
     *  Verbose/detailed/exact globs come last. (`* < *abc < abc`). For
     *  instance; `store.address` comes before `store.address.street`. So this
     *  works both for `*, store.address.street, !store.address` and
     *  `*, store.address, !store.address.street`. For cases such as
     *  `prop.id` vs `!prop.id` which represent the same property;
     *  the negated glob wins (comes last).
     *
     *  @param {String} a - First notation glob to be compared.
     *  @param {String} b - Second notation glob to be compared.
     *
     *  @returns {Number} - Returns `-1` if `a` comes first, `1` if `b` comes
     *  first and `0` if equivalent priority.
     *
     *  @example
     *  var result = Notation.Glob.compare("prop.*.name", "prop.*");
     *  console.log(result); // 1
     */
    static compare(a, b) {
        // trivial case, both are exactly the same!
        if (a === b) return 0;
        let levelsA = a.split('.'),
            levelsB = b.split('.');
        // Check depth (number of levels)
        if (levelsA.length === levelsB.length) {
            // count wildcards (assuming more wildcards comes first)
            let wild = /(?:^|\.)\*(?:$|\.)/g,
                mA = a.match(wild),
                mB = b.match(wild),
                wildA = mA ? mA.length : 0,
                wildB = mB ? mB.length : 0;
            if (wildA === wildB) {
                // check for negation
                let negA = a.indexOf('!') === 0,
                    negB = b.indexOf('!') === 0;
                if (negA === negB) {
                    // both are negated or neither are, just return alphabetical
                    return a < b ? -1 : 1;
                }
                // compare without the negatation
                let nonNegA = negA ? a.slice(1) : a,
                    nonNegB = negB ? b.slice(1) : b;
                if (nonNegA === nonNegB) {
                    return negA ? 1 : -1;
                }
                return nonNegA < nonNegB ? -1 : 1;
            }
            return wildA > wildB ? -1 : 1;
        }

        return levelsA.length < levelsB.length ? -1 : 1;
    }

    /**
     *  Sorts the notation globs in the given array by their priorities.
     *  Loose globs (with stars especially closer to beginning of the glob string);
     *  globs representing the parent/root of the compared property glob come first.
     *  Verbose/detailed/exact globs come last. (`* < *abc < abc`). For
     *  instance; `store.address` comes before `store.address.street`. For cases
     *  such as `prop.id` vs `!prop.id` which represent the same property; the
     *  negated glob wins (comes last).
     *
     *  @param {Array} globsArray - The notation globs array to be sorted.
     *  The passed array reference is modified.
     *
     *  @returns {Array}
     *
     *  @example
     *  var globs = ["!prop.*.name", "prop.*", "prop.id"];
     *  Notation.Glob.sort(globs);
     *  // ["prop.*", "prop.id", "!prop.*.name"];
     */
    static sort(globsArray) {
        return globsArray.sort(NotationGlob.compare);
        // return _mergeSortArray(globsArray, NotationGlob.compare);
    }

    /**
     *  Gets the union from the given couple of glob arrays and returns
     *  a new array of globs. If the exact same element is found in both
     *  arrays, one of them is removed to prevent duplicates. If one of the
     *  arrays contains a negated equivalent of an item in the other array,
     *  the negated item is removed. If any item covers/matches a negated
     *  item in the other array, the negated item is removed.
     *
     *  @param {Array} arrA - First array of glob strings.
     *  @param {Array} arrB - Second array of glob strings.
     *  @param {Boolean} [sort=true] - Whether to sort the globs in the final
     *  array.
     *
     *  @returns {Array}
     *
     *  @example
     *  var a = [ 'foo.bar', 'bar.baz', '!*.qux' ],
     *      b = [ '!foo.bar', 'bar.qux', 'bar.baz' ],
     *  console.log(Notation.Glob.union(a, b));
     *  // [ '!*.qux', 'foo.bar', 'bar.baz', 'bar.qux' ]
     */
    static union(arrA, arrB, sort) {
        let nonegA, re, bIndex;
        // iterate through first array
        utils.eachRight(arrA, (a, ia) => {
            // check if the exact item exists in the second array and remove
            // if exists (to prevent duplicates).
            bIndex = arrB.indexOf(a);
            if (bIndex >= 0) arrB.splice(bIndex, 1);
            // look for negateds and when one found; check if non-negated
            // equivalent exists in the second array. if it exists, remove
            // "this negated" from first array.
            // e.g. [ '!foo.bar' ] + [ 'foo.bar' ] => [ 'foo.bar' ]
            if (a.indexOf('!') === 0) {
                nonegA = a.slice(1);
                if (arrB.indexOf(nonegA) >= 0) {
                    arrA.splice(ia, 1);
                    return true;
                }
                // non-negated is not found in the second. so, iterate through
                // the second array; look for non-negateds and when found,
                // check if it covers/matches the negated from the first
                // array. if so, remove the negated from the first array.
                // [ '!foo.bar' ] + [ 'foo.*' ]  => [ 'foo.*' ]              // wild covers !v, remove !v
                // [ 'foo.bar' ]  + [ '!foo.*' ] => [ '!foo.*', 'foo.bar' ]  // !wild covers v, both kept
                // [ 'baz.que' ]  + [ '!foo.*' ] => [ '!foo.*', 'baz.que' ]  // !wild doesn't cover, both kept
                utils.eachRight(arrB, (b, ib) => {
                    if (b.indexOf('!') < 0) {
                        re = NotationGlob.toRegExp(b);
                        if (re.test(nonegA)) arrA.splice(ia, 1);
                    }
                });
            } else {
                // item in the first array is not negated; so check if a
                // negated equivalent exists in the second and remove if
                // exists.
                // e.g. [ 'foo.bar' ] + [ '!foo.bar' ] => [ 'foo.bar' ]
                bIndex = arrB.indexOf('!' + a);
                if (bIndex >= 0) arrB.splice(bIndex, 1);
            }
        });

        // concat both arrays and sort (if enabled) so we get a nice union
        // array.
        let result = arrA.concat(arrB);
        return (sort === undefined || sort === true)
            ? NotationGlob.sort(result)
            : result;
    }

}

export default NotationGlob;
