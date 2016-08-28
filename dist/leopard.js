!(function() {
    var _window = window

    var ajax = _window.ajax || _window.Zepto.ajax || _window.jQuery.ajax,
        caches = {}

    var run = function(stack, context, args) {
        stack && stack.forEach(function(callback) {
            callback && callback.apply(context, args)
        })
    }

    var proxy = function(opts) {
        var id = opts.id,
            cache = caches[id],
            success = opts.success,
            error = opts.error

        if (cache) {
            var sargs = cache.sargs,
                eargs = cache.eargs

            if (sargs || eargs) {
                sargs && success && success.apply(null, sargs)
                eargs && error && error.apply(null, eargs)
            } else {
                cache.sstack.push(success)
                cache.estack.push(error)
            }
            return
        }

        if (id) {
            cache = {
                sstack: [success],
                estack: [error]
            }

            opts.success = function() {
                var args = arguments
                cache.sargs = args
                run(cache.sstack, this, args)
            }

            opts.error = function() {
                var args = arguments
                cache.eargs = args
                run(cache.estack, this, args)
            }

            caches[id] = cache
        }

        return ajax && ajax(opts)
    }

    var render = function(opts) {
        var template = opts.template,
            success = opts.success,
            error = opts.error

        try {
            var html = template && template(opts.data)
            html && (opts.element.innerHTML = html)

            success && success.apply(this, arguments)
        } catch (e) {
            error && error.apply(this, arguments)
        }
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

    var leopard = {
        ajax: proxy,
        render: render,
        getQuerystring: getQuerystring
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = leopard
    } else {
        _window.leopard = leopard
    }
})()
