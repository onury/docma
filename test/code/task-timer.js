import EventEmitter from 'events';
import _ from 'lodash';

const DEFAULT = {
    INTERVAL: 1000
};

/**
 *  describe
 *  @namespace
 *  @type {Object}
 */
const nspace = {};

/**
 * A timer utility for running periodic tasks on the given interval ticks.
 * This is useful when you want to run or schedule multiple tasks on a single
 * timer instance.
 *
 * @extends EventEmitter
 * @see `{@link https://nodejs.org/api/events.html#events_class_eventemitter|EventEmitter}`
 *
 * @license MIT
 * @copyright 2016, Onur Yıldırım (onur@cutepilot.com)
 * @version 2016-05-01
 */
class TaskTimer extends EventEmitter {

    // ---------------------------
    // CONSTRUCTOR
    // ---------------------------

    /**
     * Constructs a new `TaskTimer` instance with the given time interval (in milliseconds).
     * @constructor
     *
     * @param {Number} [interval=1000] - Timer interval in milliseconds.
     * Since the tasks run on ticks instead of millisecond intervals; this value
     * operates as the base resolution for all tasks. If you are running heavy
     * tasks, lower interval requires higher CPU power. This value can be
     * updated any time by setting the `interval` property on the instance.
     * @returns {Object} - A new instance of `TaskTimer`.
     *
     * @example
     * var timer = new TaskTimer(1000); // milliseconds
     * // Execute some code on each tick...
     * timer.on("tick", function () {
     *     console.log("tick count: " + timer.tickCount);
     *     console.log("elapsed time: " + timer.time.elapsed + " ms.");
     * });
     * // Or add a task named "heartbeat" that runs every 5 ticks and a total of 10 times.
     * var task = {
     *     name: "heartbeat",
     *     tickInterval: 5, // ticks
     *     totalRuns: 10, // times
     *     callback: function (task) {
     *         console.log(task.name + " task has run " + task.currentRuns + " times.");
     *     }
     * };
     * timer.addTask(task).start();
     */
    constructor(interval = DEFAULT.INTERVAL) {
        super();
        this._ = {};
        this._reset();
        this._.interval = interval;
    }

    // ---------------------------
    // PUBLIC (INSTANCE) PROPERTIES
    // ---------------------------

    /**
     * Gets or sets the interval of the timer, in milliseconds.
     * Note that this will directly affect each task's execution times.
     *
     * @memberof TaskTimer
     * @type {Number}
     */
    get interval() {
        return this._.interval;
    }
    set interval(value) {
        this._.interval = value || DEFAULT.INTERVAL;
    }

    /**
     * Gets the current state of the timer.
     * For possible values, see `TaskTimer.State` enumeration.
     *
     * @memberof TaskTimer
     * @type {Number}
     * @readonly
     */
    get state() {
        return this._.state;
    }

    /**
     * Gets time information about the latest run of the timer.
     * `instance.time.started` gives the start time of the timer.
     * `instance.time.stopped` gives the stop time of the timer. (`0` if still running.)
     * `instance.time.elapsed` gives the elapsed time of the timer.
     *
     * @memberof TaskTimer
     * @type {Object}
     * @readonly
     */
    get time() {
        let current = this.state !== TaskTimer.State.STOPPED ? Date.now() : this._.stopTime;
        return Object.freeze({
            started: this._.startTime,
            stopped: this._.stopTime,
            elapsed: current - this._.startTime
        });
    }

    /**
     * Gets the current tick count for the latest run of the timer.
     * This value will be reset to `0` when the timer is stopped or reset.
     *
     * @memberof TaskTimer
     * @type {Number}
     * @readonly
     */
    get tickCount() {
        return this._.tickCount;
    }

    /**
     * Gets the current task count. Tasks remain even after the timer is
     * stopped. But they will be removed if the timer is reset.
     *
     * @memberof TaskTimer
     * @type {Number}
     * @readonly
     */
    get taskCount() {
        return Object.keys(this._.tasks).length;
    }

    // ---------------------------
    // PRIVATE (INSTANCE) METHODS
    // ---------------------------

    /**
     * Stops the timer.
     * @private
     */
    _stop() {
        if (this._.timer) {
            clearInterval(this._.timer);
            this._.timer = null;
        }
    }

    /**
     * Resets the timer.
     * @private
     */
    _reset() {
        this._stop();
        var interval = this._.interval;
        this._ = {
            interval: interval,
            timer: null,
            state: TaskTimer.State.IDLE,
            tasks: {},
            tickCount: 0,
            startTime: 0,
            stopTime: 0
        };
    }

    /**
     * Handler to be executed on each tick.
     * @private
     */
    _tick() {
        let name, task,
            tasks = this._.tasks;

        this._.tickCount += 1;
        this.emit(TaskTimer.Event.TICK);

        for (name in this._.tasks) {
            if (tasks[name]) {
                task = tasks[name];
                if (this._.tickCount % task.tickInterval === 0) {
                    if (!task.totalRuns || task.currentRuns < task.totalRuns) {
                        task.currentRuns += 1;
                        if (typeof task.callback === 'function') {
                            task.callback(task);
                        }
                        this.emit(TaskTimer.Event.TASK, Object.freeze(_.clone(task)));
                    }
                }
            }
        }
    }

    /**
     * Runs the timer.
     * @private
     */
    _run() {
        this._.timer = setInterval(() => {
            // safe to use parent scope `this` in arrow functions.
            this._tick();
            this._.state = TaskTimer.State.RUNNING;
        }, this._.interval);
    }

    // ---------------------------
    // PUBLIC (INSTANCE) METHODS
    // ---------------------------

    /**
     * Emits the given event with an optional event object.
     * @memberof TaskTimer
     * @alias TaskTimer#fire
     * @chainable
     *
     * @param {String} eventName - The name of the event to be emitted.
     * @param {Object} [object] - The event object that will be passed to the
     * listener(s).
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    emit(eventName, object) {
        var event = {
            type: eventName,
            source: this
        };
        switch (eventName) {
            case TaskTimer.Event.TASK:
            case TaskTimer.Event.TASK_ADDED:
            case TaskTimer.Event.TASK_REMOVED:
                event.task = object;
                break;
            default:
                break;
        }
        // console.log('emitting', eventName);
        super.emit(eventName, event);
        return this;
    }
    /**
     *  Alias for `#emit()`
     *  @private
     */
    fire(eventName, object) {
        return this.emit(eventName, object);
    }

    /**
     * Gets the task with the given name.
     * @memberof TaskTimer
     *
     * @param {String} name - Name of the task.
     *
     * @returns {Object} - Task.
     */
    getTask(name) {
        return Object.freeze(_.clone(this._.tasks[name]));
    }

    /**
     * Adds a new task for the timer.
     * @memberof TaskTimer
     * @chainable
     *
     * @todo options.autoRemove
     *
     * @param {Object|String} options - Task options. If a `String` is passed,
     * a task with default options will be created with the given name.
     *     @param {String} options.name - The unique name of the task.
     *     @param {Number} [options.tickInterval=1] - Tick interval that the
     *     task should be run on. The unit is "ticks" not milliseconds. For
     *     instance, if the timer interval is 1000 milliseconds, and we add a
     *     task with 5 tick intervals. The task will run on every 5 seconds.
     *     @param {Number} [options.totalRuns=0] - Total number of times the
     *     task should be run. `0` or `null` means unlimited (until the timer
     *     has stopped).
     *     @param {Function} [options.callback] - The callback function (task)
     *     to be executed on each run. The task itself is passed to this
     *     callback, as the single argument.
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     *
     * @throws {Error} - If the task name is not set or a task with the given
     * name already exists.
     */
    addTask(options = { tickInterval: 1, totalRuns: 0 }) {
        if (typeof options === 'string') {
            options = {
                name: options,
                tickInterval: 1,
                totalRuns: 0
            };
        }
        if (!options.name) {
            throw new Error('Task name is required.');
        }
        if (this._.tasks[options.name]) {
            throw new Error('Task with name "' + options.name + '" already exists.');
        }
        let task = _.extend({
            currentRuns: 0
        }, options);
        this._.tasks[options.name] = task;
        this.emit(TaskTimer.Event.TASK_ADDED, this.getTask(options.name));
        return this;
    }

    /**
     * Resets the current runs of the task, by its given name; and re-runs the
     * task on the next interval tick.
     * @memberof TaskTimer
     * @chainable
     *
     * @param {String} name - The name of the task to be removed.
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     *
     * @throws {Error} - If a task with the given name does not exist.
     */
    resetTask(name) {
        if (!name || !this._.tasks[name]) {
            throw new Error('Task with name "' + name + '" does not exist.');
        }
        this._.tasks[name].currentRuns = 0;
    }

    /**
     * Removes the task by the given name.
     * @memberof TaskTimer
     * @chainable
     *
     * @param {String} name - The name of the task to be removed.
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     *
     * @throws {Error} - If a task with the given name does not exist.
     */
    removeTask(name) {
        if (!name || !this._.tasks[name]) {
            throw new Error('Task with name "' + name + '" does not exist.');
        }
        var removedTask = _.clone(this._.tasks[name]);
        this._.tasks[name] = null;
        delete this._.tasks[name];
        this.emit(TaskTimer.Event.TASK_REMOVED, removedTask);
        return this;
    }

    /**
     * Starts the timer and puts the timer in `RUNNING` state. If it's already
     * running, this will reset the start/stop time and tick count, but will not
     * reset (or remove) existing tasks.
     * @memberof TaskTimer
     * @chainable
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    start() {
        this._stop();
        this._.startTime = Date.now();
        this._.stopTime = 0;
        this._.tickCount = 0;
        this._run();
        this._.state = TaskTimer.State.RUNNING;
        this.emit(TaskTimer.Event.STARTED);
        return this;
    }

    /**
     * Pauses the timer, puts the timer in `PAUSED` state and all tasks on hold.
     * @memberof TaskTimer
     * @chainable
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    pause() {
        if (this.state !== TaskTimer.State.RUNNING) return this;
        this._stop();
        this._.state = TaskTimer.State.PAUSED;
        this.emit(TaskTimer.Event.PAUSED);
        return this;
    }

    /**
     * Resumes the timer and puts the timer in `RUNNING` state; if previuosly
     * paused.
     * @memberof TaskTimer
     * @chainable
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    resume() {
        if (this.state !== TaskTimer.State.PAUSED) return this;
        this._run();
        this._.state = TaskTimer.State.RUNNING;
        this.emit(TaskTimer.Event.RESUMED);
        return this;
    }

    /**
     * Stops the timer and puts the timer in `STOPPED` state. In this state, no
     * values or tasks are reset until re-started or explicitly calling reset.
     * @memberof TaskTimer
     * @chainable
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    stop() {
        if (this.state !== TaskTimer.State.RUNNING) return this;
        this._stop();
        this._.stopTime = Date.now();
        this._.state = TaskTimer.State.STOPPED;
        this.emit(TaskTimer.Event.STOPPED);
        return this;
    }

    /**
     * Stops the timer and puts the timer in `IDLE` state.
     * This will reset the ticks and removes all tasks silently; meaning no
     * other events will be emitted such as `"taskRemoved"`.
     * @memberof TaskTimer
     * @chainable
     *
     * @returns {Object} - `{@link TaskTimer}` instance.
     */
    reset() {
        this._reset();
        this.emit(TaskTimer.Event.RESET);
        return this;
    }

    // on(eventName, listener) {
    //     super.on(eventName, listener);
    //     return this;
    // }

}

// ---------------------------
// PUBLIC (STATIC) PROPERTIES
// ---------------------------

/**
 * Enumerates the `TaskTimer` event types.
 * @enum {String}
 * @readonly
 */
TaskTimer.Event = Object.freeze({
    /**
     * Emitted on each tick (interval) of `TaskTimer`.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    TICK: 'tick',
    /**
     * Emitted when the timer is put in `RUNNING` state; such as when the timer is
     * started.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    STARTED: 'started',
    /**
     * Emitted when the timer is put in `RUNNING` state; such as when the timer is
     * resumed.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    RESUMED: 'resumed',
    /**
     * Emitted when the timer is put in `PAUSED` state.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    PAUSED: 'paused',
    /**
     * Emitted when the timer is put in `STOPPED` state.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    STOPPED: 'stopped',
    /**
     * Emitted when the timer is reset.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    RESET: 'reset',
    /**
     * Emitted when a task is executed.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    TASK: 'task',
    /**
     * Emitted when a task is added to `TaskTimer` instance.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    TASK_ADDED: 'taskAdded',
    /**
     * Emitted when a task is removed from `TaskTimer` instance.
     * Note that this will not be emitted when `.reset()` is called; which
     * removes all tasks silently.
     * @memberof TaskTimer.Event
     * @type {String}
     */
    TASK_REMOVED: 'taskRemoved'
});

/**
 * Enumerates the `TaskTimer` states.
 * @enum {Number}
 * @readonly
 */
TaskTimer.State = Object.freeze({
    /**
     * Indicates that the timer is in `IDLE` state.
     * This is the initial state when the `TaskTimer` instance is first created.
     * Also when an existing timer is reset, it will be `IDLE`.
     * @memberof TaskTimer.State
     * @type {Number}
     */
    IDLE: 0,
    /**
     * Indicates that the timer is in `RUNNING` state; such as when the timer is
     * started or resumed.
     * @memberof TaskTimer.State
     * @type {Number}
     */
    RUNNING: 1,
    /**
     * Indicates that the timer is in `PAUSED` state.
     * @memberof TaskTimer.State
     * @type {Number}
     */
    PAUSED: 2,
    /**
     * Indicates that the timer is in `STOPPED` state.
     * @memberof TaskTimer.State
     * @type {Number}
     */
    STOPPED: 3
});

// ---------------------------
// EXPORT
// ---------------------------

export default TaskTimer;
