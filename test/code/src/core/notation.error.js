
// TODO: instanceof return false.

/**
 *  Error class specific to `Notation`.
 */
class NotationError extends Error {

    /**
     *  Initializes a new `NotationError` instance.
     *  @constructor
     *
     *  @param {String} message - The error message.
     */
    constructor(message = '') {
        super(message);
        this.name = this.constructor.name;

        Object.defineProperty(this, 'name', {
            enumerable: false,
            writable: false,
            value: 'NotationError'
        });

        Object.defineProperty(this, 'message', {
            enumerable: false,
            writable: true,
            value: message
        });

        if (Error.hasOwnProperty('captureStackTrace')) { // V8
            Error.captureStackTrace(this, this.constructor);
        } else {
            Object.defineProperty(this, 'stack', {
                enumerable: false,
                writable: false,
                value: (new Error(message)).stack
            });
        }
    }
}

export default NotationError;
