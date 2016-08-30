!(function() {
    var _window = window

    var AJAX_EVENT = 0,
        RENDER_EVENT = 1

    var ajax = _window.ajax || _window.Zepto.ajax || _window.jQuery.ajax,
        ajaxCaches = {},
        renderCaches = {}

    var run = function(stack, context, args) {
        stack && stack.forEach(function(callback) {
            callback && callback.apply(context, args)
        })
    }

    var handler = function(opts, caches, context) {
        var id = opts.id,
            cache = caches[id],
            success = opts.success,
            error = opts.error

        if (cache && cache.initial) return true

        if (id != null) {

            !cache && (cache = {
                sstack: [],
                estack: []
            })

            cache.sstack.push(success)
            cache.estack.push(error)

            cache.initial = true

            opts.success = function() {
                var args = arguments
                cache.completed = true
                cache.succeed = true
                cache.sargs = args
                run(cache.sstack, this, args)
            }

            opts.error = function() {
                var args = arguments
                cache.completed = true
                cache.succeed = false
                cache.eargs = args
                run(cache.estack, this, args)
            }

            caches[id] = cache
        }
        return false
    }

    var proxy = function(opts) {
        if (handler(opts, ajaxCaches, this)) return this
        ajax && ajax(opts)
        return this
    }

    var render = function(opts) {
        if (handler(opts, renderCaches, this)) return this

        var template = opts.template,
            success = opts.success,
            error = opts.error

        try {
            var html = template && template(opts.data)
            html && (opts.element.innerHTML = html)

            success && success()
        } catch (e) {
            error && error(e)
        }
        return this
    }

    var paramsRegxp = /([^=&]+)(=([^&#]*))?/g
    var getQuerystring = function() {
        var params = {},
            queryString = _window.location.search.substr(1)

        queryString && queryString.replace(paramsRegxp, function(a, name, c, value) {
            params[name] = !!value ? decodeURIComponent(value) : undefined
        })

        return params
    }

    var listener = function(opts) {
        var id = opts.id,
            event = opts.event,
            caches = event === AJAX_EVENT ? ajaxCaches : event === RENDER_EVENT ? renderCaches : null,
            cache = caches && caches[id],
            success = opts.success,
            error = opts.error

        if (cache) {
            var sargs = cache.sargs,
                eargs = cache.eargs,
                succeed = cache.succeed

            if (cache.completed) {
                succeed && success && success.apply(null, sargs)
                !succeed && error && error.apply(null, eargs)
            } else {
                cache.sstack.push(success)
                cache.estack.push(error)
            }

            return this
        }

        if (id != null && caches) {
            caches[id] = {
                sstack: [success],
                estack: [error]
            }
        }

        return this
    }

    var leopard = {
        AJAX_EVENT: AJAX_EVENT,
        RENDER_EVENT: RENDER_EVENT,
        ajax: proxy,
        render: render,
        getQuerystring: getQuerystring,
        listener: listener
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = leopard
    } else {
        _window.leopard = leopard
    }
})()
