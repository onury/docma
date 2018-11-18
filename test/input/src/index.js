/** @const {String} DEFAULT_SOCKET_NAME sets a default socket name */
const DEFAULT_SOCKET_NAME = 'uci-sock'

/**
 * This is a constant.
 */
const CONSTANT = 42;

/**
 * Server Error
 *
 * @module mylib/error
 */
export default function ServerError(message) {
    this.message = message;
    this.stack = (new Error()).stack;
}