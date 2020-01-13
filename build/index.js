"use strict";
/**
 * Module dependencies.
 */

function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}

function _classCallCheck(instance, Constructor) {
    if (!_instanceof(instance, Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}

function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}

var lru = require("lru-cache");
/**
 * Module constants.
 */

var noop = function noop() {};

module.exports =
    /*#__PURE__*/
    (function() {
        /**
         * MemoryStore constructor.
         *
         * @param {Object} options
         * @api public
         */
        function MemoryStore() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            _classCallCheck(this, MemoryStore);

            this.client = lru(options.count || 100);
        }
        /**
         * Get an entry.
         *
         * @param {String} key
         * @param {Function} fn
         * @api public
         */

        _createClass(MemoryStore, [
            {
                key: "get",
                value: function get(key) {
                    var fn =
                        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
                    var val,
                        data = this.client.get(key);
                    if (!data) return fn(null, data);

                    if (data.expire !== -1 && data.expire < Date.now()) {
                        this.client.del(key);
                        return setImmediate(fn);
                    }

                    try {
                        val = JSON.parse(data.value);
                    } catch (e) {
                        return setImmediate(fn.bind(null, e));
                    }

                    setImmediate(fn.bind(null, null, val));
                },
                /**
                 * Set an entry.
                 *
                 * @param {String} key
                 * @param {Mixed} val
                 * @param {Number} ttl
                 * @param {Function} fn
                 * @api public
                 */
            },
            {
                key: "set",
                value: function set(key, val, ttl) {
                    var fn =
                        arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : noop;
                    var data;

                    if (typeof ttl === "function") {
                        fn = ttl;
                        ttl = null;
                    }

                    if (typeof val === "undefined") return fn();
                    var expire = -1 === ttl ? -1 : Date.now() + (ttl || 60) * 1000;

                    try {
                        data = {
                            value: JSON.stringify(val),
                            expire: expire,
                        };
                    } catch (e) {
                        return setImmediate(fn.bind(null, e));
                    }

                    this.client.set(key, data);
                    setImmediate(fn.bind(null, null, val));
                },
                /**
                 * Delete an entry.
                 *
                 * @param {String} key
                 * @param {Function} fn
                 * @api public
                 */
            },
            {
                key: "del",
                value: function del(key) {
                    var fn =
                        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
                    this.set(key, null, -1, fn);
                },
                /**
                 * Clear all entries for this bucket.
                 *
                 * @param {Function} fn
                 * @api public
                 */
            },
            {
                key: "clear",
                value: function clear() {
                    var fn =
                        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
                    this.client.reset();
                    setImmediate(fn);
                },
                /**
                 * Get all entries in cache.
                 *
                 * @param {Function} fn
                 * @api public
                 */
            },
            {
                key: "getAll",
                value: function getAll() {
                    var fn =
                        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
                    var entries = [];
                    var keys = this.client.keys();
                    this.client.forEach(function(value, key, cache) {
                        entries.push({
                            key: key,
                            data: JSON.parse(value.value),
                        });
                    });
                    fn(null, entries);
                },
            },
        ]);

        return MemoryStore;
    })();
