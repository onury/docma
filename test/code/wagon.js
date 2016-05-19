/* eslint no-loop-func:0, no-self-assign:0, no-nested-ternary:0, camelcase:0 */
/* global define */

/**
 *  Utility for easily building special classes, libraries with static
 *  and chainable instance methods.
 *
 *  This is an initilizer function, not a constructor so you don't need to
 *  use `new` keyword.
 *
 *  @module wagon
 *  @name wagon
 *  @global
 *  @function
 *
 *  @param {String} [name=""] - The constructor name for the built object.
 *  @param {Object} [config] - `Wagon` instance configuration.
 *  See `{@link wagon.Wagon}` for details.
 *
 *  @returns {Object} - A new `Wagon` instance.
 *
 *  @example
 *  var calc = wagon('Calc')
 *     .chain('multiply', function (x, y) {
 *         return x * y;
 *     })
 *     .chain('divide', function (x, y) {
 *         return x / y;
 *     })
 *     .chain('add', function (x, y) {
 *         return x + y;
 *     })
 *     .chain('subtract', function (x, y) {
 *         return x - y;
 *     })
 *     .create();
 *
 *  // Now you can do this:
 *  calc(5).multiply(4).divide(2).add(5).subtract(1).value; // instance chain
 *
 *  // Also this:
 *  var value = calc.multiply(5, 4);  // static usage
 */
(function (global) {
    'use strict';

    var toString = Object.prototype.toString;

    /**
     *  Default config for Wagon instances.
     *  @private
     */
    var DEFAULT_CONFIG = Object.freeze({
        strict: true,
        stateProp: 'value',
        defaultValue: undefined,
        allowRedefine: false,
        ensureNamedMethods: false
    });

    /**
     *  Error messages
     *  @private
     */
    var ERR = {
        NAME: 'Member name is not defined.',
        NO_ARGS: ': At least one argument must be defined when `peculate` is enabled.',
        PROP_CHAIN: ': A chainable member must be a function.',
        PROP_STATE: ': A property member cannot set value/state.',
        STATIC_THIS: ': Use of `this` in a static method is not allowed.',
        STATIC_CHAIN: ': A method with static scope cannot be chainable.',
        STATIC_STATE: ': A method with static scope cannot set an instance value/state.',
        STATIC_FIRST_ARG: ': Option `peculate` is for instance methods only.',
        STATIC_REDEFINE: ': Static member is already defined. Cannot overwrite.',
        INSTANCE_REDEFINE: ': Instance member is already defined. Cannot overwrite.',
        STATE_PROP: ': Cannot redefine the state property.',
        STATE_PROP_INTERNAL: ': Cannot redefine internal state property.',
        INVALID_SCOPE: ': Invalid scope is set for member. Expected "instance" or "static".'
    };

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    /**
     *  Gets the type of the given object.
     *  @private
     */
    function type(o) {
        return toString.call(o).match(/\s(\w+)/i)[1].toLowerCase();
    }

    /**
     *  Converts the given object to an Array, if not.
     *  @private
     */
    function ensureArray(o) {
        return Array.isArray(o) ? o : [o];
    }

    /**
     *  Assigns default values if they don't exist on the source object.
     *  @private
     */
    function defaults(source, def) {
        source = source || {};
        if (!def) return source;
        Object.keys(def).forEach(function (key) {
            if (!source.hasOwnProperty(key)) {
                source[key] = def[key];
            }
        });
        return source;
    }

    /**
     *  Assigns default value for a single prop if it doesn't exist on the
     *  source object.
     *  @private
     */
    function defaultVal(obj, prop, def) {
        if (!obj.hasOwnProperty(prop)) {
            obj[prop] = def;
        }
    }

    /**
     *  Ensures that the given method has a name.
     *  @private
     *
     *  @param {Function} method - Method to be checked.
     *  @param {String} name - Default name to be set.
     *
     *  @returns {Function} - Given method with a name.
     */
    function ensureNamedMethod(method, name) {
        if (method.name === '') {
            var strFn = method.toString().replace('function ', 'return function ' + name);
            return new Function(strFn)(); // eslint-disable-line no-new-func
        }
        return method;
    }

    // --------------------------------
    // CLASS: Intermediate
    // --------------------------------

    /**
     *  @private
     */
    function createIntermediate(opts) {
        opts = opts || {};

        /**
         *  The target class or object that's dynamically being built by the
         *  `Wagon` instance. Each member you define is assigned to this
         *  `Intermediate` object.
         *
         *  When you call `Wagon#create()`, a new instance of this `Intermediate`
         *  class will be returned.
         *
         *  @name Wagon#Intermediate
         *  @public
         *  @class
         *
         *  @param {*} [value=Wagon#config().defaultValue] - The value or
         *  state to be carried out through the chain. Default value is defined
         *  by the `Wagon` instance's initializer or the `Wagon#config()`
         *  method.
         */
        var Intermediate = function (value) {
            this.__state_value = value;
            Object.defineProperty(this, opts.stateProp, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return this.__state_value;
                }
            });
        };

        if (typeof opts.name === 'string') {
            // Intermediate.prototype.constructor.name = name; // doesn't work
            Object.defineProperty(Intermediate.prototype.constructor, 'name', {
                writable: false,
                value: opts.name
            });
        }

        return Intermediate;
    }

    function updateIntermediate(Intermediate, opts) {
        opts = opts || {};
        Object.defineProperty(Intermediate.prototype, opts.stateProp, {
            enumerable: false,
            configurable: true,
            get: function () {
                return this.__state_value;
            }
        });
        delete Intermediate.prototype[opts.prevStateProp];
        return Intermediate;
    }

    // --------------------------------
    // CLASS: Wagon
    // --------------------------------

    /**
     *  Initializes a new instance of `Wagon`.
     *
     *  @class
     *  @memberof wagon
     *
     *  @param {String} [name=""] - The constructor name for the built
     *  `Intermediate` object.
     *  @param {Object} [config] - `Wagon` instance configuration.
     *  You can also set this via `Wagon#config()` instance method.
     *  	@param {Boolean} [strict=true] - Whether to check and throw on
     *  	invalid assignments. This is only active at define-time, not when
     *  	the defined members are called.
     *  	@param {String} [stateProp="value"] - The name of the non-enumerable
     *  	property that keeps the state within the built object. i.e. through
     *  	out the chainable methods. This can be used in the built object like this:
     *  	`yourCalc(5).multiply(3).value` —> rename by setting `stateProp`.
     *  	@param {*} [defaultValue] - Default value for the initial state.
     *  	This is used when the built object is initialized without a
     *  	parameter or `undefined` as the first parameter.
     *  	e.g. `yourLib().value // —> default value`
     *  	@param {Boolean} [allowRedefine=false] - Whether to allow an already
     *  	defined member to be re-defined (overwritten) except for `stateProp`
     *  	value. If set to `false`, it will throw even if `strict` config is
     *  	disabled.
     *  	@param {Boolean} [ensureNamedMethods=false] - Whether to ensure
     *  	assigned methods have the defined name, if not declared. Note that
     *  	this leads to use of `new Function` constructor (in ES strict mode).
     *
     *  @returns {Object} - A new `Wagon` instance.
     */
    function Wagon(name, config) {
        if (type(name) === 'object') {
            config = name;
            name = '';
        }
        config = config || { stateProp: DEFAULT_CONFIG.stateProp };
        this.Intermediate = createIntermediate({
            name: name || '',
            stateProp: config.stateProp
        });
        this.config(config);
    }

    /**
     *  Sets or gets the `Wagon` instance configuration.
     *
     *  @name Wagon#config
     *  @function
     *
     *  @param {Object} [options] - `Wagon` configuration options.
     *
     *  @returns {Object} - If `options` argument is set, updates the
     *  configuration and returns the `Wagon` instance (self). If `options` is
     *  omitted, returns the current configuration.
     */
    Wagon.prototype.config = function (options) {
        if (options === undefined) return this._options;

        var opts = defaults(options, DEFAULT_CONFIG);

        // Update Intermediate only if the stateProp has changed.
        this._options = this._options || {};
        if (opts.stateProp !== this._options.stateProp) {
            var imOpts = {
                stateProp: opts.stateProp,
                prevStateProp: this._options.stateProp || DEFAULT_CONFIG.stateProp
            };
            this.Intermediate = updateIntermediate(this.Intermediate, imOpts);
        }

        this._options = Object.freeze(opts);
        return this;
    };

    /**
     *  Defines and adds a member to the built object.
     *  This is the main method to define a member with all possible
     *  configurations. Other methods like `Wagon#chain()`, `Wagon#proto()`,
     *  `Wagon#static()`, etc are actually pre-configured shorthand versions of
     *  this method.
     *
     *  @name Wagon#define
     *  @alias Wagon#add
     *  @function
     *  @chainable
     *
     *  @param {String} name - Member name to be assigned.
     *  @param {Object} [options] - Member definition options.
     *      @param {String|Array} [options.scope=["instance", "static"]] -
     *      Scope(s) of the member. Possible values are: `"instance"` and
     *      `"static"`. When you define both, it means an instance member that
     *      should also be accessible as a static member. For a method member;
     *      no `this` keyword should be used within the function body; or
     *      this will throw if `strict` config is enabled.
     *      @param {Boolean} [options.chainable=true] - Whether the member is
     *      chainable and should return the object itself (`this`). Note that
     *      only method members can be chainable.
     *      @param {Boolean} [options.stateful=false] - For instance methods
     *      only. Whether the internal state/value (i.e. exposed by
     *      `Intermediate#value`) should be set to the returned result of the
     *      defined method.
     *      @param {Boolean} [options.peculate=false] - Affects instance
     *      methods only. Whether the first argument of the defined method
     *      member should be treated as the internal value/state when the
     *      instance version of this method is created. For example, if you set
     *      `peculate` to `true` and define a method called `multiply`:
     *      `function (value, y) { return value * y; }`
     *      The final object can do this:
     *      `yourLib(5).multiply(2).value // —> 10`
     *      See that the instance version of the `multiply` method takes 1 argument instead of 2.
     *  @param {*} member - If defining a method, set the static version of the
     *  function. If defining a property, set this to a value.
     *
     *  @returns {Object} - `Wagon` instance (self).
     */
    Wagon.prototype.define = function (name, options, member) {
        var $this = this,
            multiple = type(name) === 'object';

        if (member !== undefined) {
            // overload: .add(name, options, member)
        } else if (multiple) {
            // overload: .add(options, object)
            member = options;
            options = name;
        } else {
            // overload: .add(name, member)
            member = options;
            options = {};
        }

        options = defaults(options, {
            scope: ['instance', 'static'], // assign both
            chainable: true,
            peculate: false,
            stateful: false
        });
        options.scope = ensureArray(options.scope);

        if (multiple) {
            var multiMembers = member;
            Object.keys(multiMembers).forEach(function (key) {
                $this.define(key, options, multiMembers[key]);
            });
            return $this;
        }

        if (!name) throw new Error(ERR.NAME);
        if (name === $this._options.stateProp) throw new Error(ERR.STATE_PROP);
        if (name === '__state_value') throw new Error(ERR.STATE_PROP_INTERNAL);

        var fn,
            isMethod = typeof member === 'function',
            isInstance = options.scope.indexOf('instance') >= 0,
            isStatic = options.scope.indexOf('static') >= 0;

        if (isInstance) {

            if (!$this._options.allowRedefine
                    && ($this.Intermediate.prototype[name] || $this.Intermediate.prototype.hasOwnProperty(name))) {
                throw new Error(ERR.INSTANCE_REDEFINE);
            }

            if (isMethod) {
                if (options.peculate && member.length < 1) {
                    throw new Error(name + ERR.NO_ARGS);
                }
                // we're assigning defined staticMethod(x, y) as instanceMethod(y)
                fn = function () {
                    var val, args, len;
                    // if peculate, pass the internal value as the first
                    // argument, instead of the defined 1st arg.
                    if (options.peculate) {
                        args = [this.__state_value];
                        len = member.length - 1;
                    } else {
                        args = [];
                        len = member.length;
                    }
                    for (var i = 0; i < len; i++) {
                        args.push(arguments[i]);
                    }
                    val = member.apply(this, args);
                    if (options.stateful) this.__state_value = val;
                    if (options.chainable) return this;
                    return val;
                };
                $this.Intermediate.prototype[name] = $this._options.ensureNamedMethods
                    ? ensureNamedMethod(fn, name)
                    : fn;
            } else {
                if ($this._options.strict) {
                    if (options.chainable) throw new Error(name + ERR.PROP_CHAIN);
                    if (options.stateful) throw new Error(name + ERR.PROP_STATE);
                }
                $this.Intermediate.prototype[name] = member;
            }

            // scope is both instance and static
            if (isStatic) {
                if ($this._options.strict && isMethod && (/\bthis\b/g).test(member.toString())) {
                    throw new Error(name + ERR.STATIC_THIS);
                }
                $this.Intermediate[name] = isMethod
                    ? ($this._options.ensureNamedMethods ? ensureNamedMethod(member, name) : member)
                    : member;
            }
        }

        // scope is static only!
        if (isStatic && !isInstance) {
            if (!$this._options.allowRedefine
                    && ($this.Intermediate[name] || $this.Intermediate.hasOwnProperty(name))) {
                throw new Error(ERR.STATIC_REDEFINE);
            }

            if ($this._options.strict) {
                if (isMethod && (/\bthis\b/g).test(member.toString())) {
                    throw new Error(name + ERR.STATIC_THIS);
                }
                if (options.chainable) throw new Error(name + ERR.STATIC_CHAIN);
                if (options.stateful) throw new Error(name + ERR.STATIC_STATE);
            }
            $this.Intermediate[name] = isMethod ? ensureNamedMethod(member, name) : member;
        }

        // no valid scope
        if (!isStatic && !isInstance) {
            throw new Error(name + ERR.INVALID_SCOPE);
        }

        return $this;
    };
    /**
     *  Alias of `assign`
     *  @private
     */
    Wagon.prototype.add = Wagon.prototype.define;

    /**
     *  Defines a chainable instance method and assigns it to the built object's
     *  prototype. Also assigns the static version of the same method to the
     *  built object itself.
     *
     *  The instance version peculates the first argument of the defined method.
     *  In other words, internal value/state is used instead of the first
     *  argument in the function definition; so the instance version will have
     *  one less argument.
     *
     *  This method is actually a pre-configured shorthand of the
     *  `Wagon#define()` method.
     *
     *  @name Wagon#chain
     *  @alias Wagon#chainable
     *  @function
     *  @chainable
     *
     *  @param {String} name - Method name to be assigned.
     *  @param {Object} [options] - Member definition options.
     *  @param {Function} method - Static definition of the method member.
     *
     *  @returns {Object} - `Wagon` instance (self).
     */
    Wagon.prototype.chain = function (name, options, method) {
        var multiple = type(name) === 'object';

        if (method !== undefined) {
            // overload: .add(name, options, method)
        } else if (multiple) {
            // overload: .add(options, object)
            method = options;
            options = name;
        } else {
            // overload: .add(name, method)
            method = options;
            options = {};
        }
        defaultVal(options, 'scope', ['instance', 'static']);
        options.chainable = true;
        defaultVal(options, 'peculate', true);
        defaultVal(options, 'stateful', true);
        this.define(name, options, method);
        return this;
    };
    /**
     *  Alias for `Wagon#chain()` method.
     *  @private
     */
    Wagon.prototype.chainable = Wagon.prototype.chain;

    /**
     *  Defines an instance member (method or property) and assigns it to the
     *  built object's prototype.
     *
     *  This method is actually a pre-configured shorthand of the
     *  `Wagon#define()` method.
     *
     *  @name Wagon#proto
     *  @alias Wagon#instance
     *  @function
     *  @chainable
     *
     *  @param {String} name - Method name to be assigned.
     *  @param {Object} [options] - Member definition options.
     *  @param {*} member - Either a function definition or a value.
     *
     *  @returns {Object} - `Wagon` instance (self).
     */
    Wagon.prototype.proto = function (name, options, member) {
        var multiple = type(name) === 'object';

        if (member !== undefined) {
            // overload: .add(name, options, member)
        } else if (multiple) {
            // overload: .add(options, object)
            member = options;
            options = name;
        } else {
            // overload: .add(name, member)
            member = options;
            options = {};
        }

        options.scope = ['instance'];
        defaultVal(options, 'chainable', false);
        defaultVal(options, 'peculate', false);
        defaultVal(options, 'stateful', false);
        this.define(name, options, member);
        return this;
    };
    /**
     *  Alias for `Wagon#proto()` method.
     *  @private
     */
    Wagon.prototype.instance = Wagon.prototype.proto;

    /**
     *  Defines an static member (method or property) and assigns it to the
     *  built object itself.
     *
     *  This method is actually a pre-configured shorthand of the
     *  `Wagon#define()` method.
     *
     *  @name Wagon#static
     *  @function
     *  @chainable
     *
     *  @param {String} name - Method name to be assigned.
     *  @param {Object} [options] - Member definition options.
     *  @param {*} member - Either a function definition or a value.
     *
     *  @returns {Object} - `Wagon` instance (self).
     */
    Wagon.prototype.static = function (name, options, member) {
        var multiple = type(name) === 'object';

        if (member !== undefined) {
            // overload: .add(name, options, member)
        } else if (multiple) {
            // overload: .add(options, object)
            member = options;
            options = name;
        } else {
            // overload: .add(name, member)
            member = options;
            options = {};
        }

        if (this._options.strict) {
            if (options.chainable) throw new Error(name + ERR.STATIC_CHAIN);
            if (options.peculate) throw new Error(name + ERR.STATIC_FIRST_ARG);
            if (options.stateful) throw new Error(name + ERR.STATIC_STATE);
        }

        options.scope = ['static'];
        options.chainable = false; // cannot
        options.peculate = false; // no peculate for static methods
        options.stateful = false; // no state for static methods
        this.define(name, options, member);
        return this;
    };

    /**
     *  Final method to be called to end the build chain. This will create and
     *  return an initializer function that initiates an intermediate object
     *  which has all the defined members.
     *
     *  @name Wagon#create
     *  @function
     *
     *  @returns {Function} - Initializer function. This is not a constructor so
     *  you don't need to use `new` keyword.
     */
    Wagon.prototype.create = function () {
        var $this = this;
        return function (value) {
            var val = value === undefined ? $this._options.defaultValue : value;
            return new $this.Intermediate(val);
        };
    };

    // --------------------------------
    // Wagon Initializer
    // --------------------------------

    function wagon(name, options) {
        return new Wagon(name, options);
    }
    wagon.Wagon = Wagon;

    // --------------------------------
    // EXPORT
    // --------------------------------

    // AMD check should be first!
    if (typeof define === 'function' && define.amd) {
        define('wagon', wagon);
    } else if (typeof module !== 'undefined' && module.exports) {
        // export for Node/CommonJS
        module.exports = wagon;
    } else {
        // export for browser
        // using bracket notation for Google closure compiler ADVANCED_MODE
        global['wagon'] = wagon; // eslint-disable-line dot-notation
    }

})(this);
