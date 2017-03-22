/*!
 * dush-router <https://github.com/tunnckoCore/dush-router>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

'use strict'

module.exports = function dushRouter () {
  return function dushRouter_ (app) {
    var el = null
    app._routes = []

    app.on('route', function onRoute (view, context) {
      return view(context)
    })

    app.use(createRoutePlugin())

    app.addRoute = function addRoute (route, handler) {
      app._routes.push(app.createRoute(route, handler))
      return app
    }

    app.navigate = function navigate (pathname, state) {
      state = isObject(state) ? state : {}

      var found = false
      var len = app._routes.length
      var i = 0

      while (i < len) {
        var r = app._routes[i++]
        var params = r.match(pathname)

        // if `false` -> no match and no params
        // if `null` -> no params
        if (params === false) {
          continue
        }
        found = true

        var context = {
          state: state,
          route: r.route,
          params: params,
          pathname: pathname
        }

        app.emit('route', function viewFn () {
          el = r.handler.apply(app, arguments)
        }, context, el)
      }

      if (!found) {
        app.emit('notFound', { pathname: pathname, state: state })
      }

      return el
    }
  }
}

/**
 * Utils
 */

function isObject (val) {
  return val && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Internal plugin
 */

function createRoutePlugin () {
  return function createRoutePlugin_ (app) {
    app.createRoute = function createRoute (route, handler) {
      var r = makeRoute(route)
      r.route = route
      r.handler = handler
      r.match = function match (pathname) {
        return r.regex.test(pathname) ? collectParams(r, pathname) : false
      }
      return r
    }
  }
}

function makeRoute (route) {
  var keys = []
  var regex = '^' + route
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, function (_, name) {
      keys.push(name)
      return '(\\w+)'
    }) + '$'

  return {
    regex: new RegExp(regex, 'i'),
    keys: keys
  }
}

function collectParams (r, pathname) {
  var match = null
  r.params = {}
  pathname.replace(r.regex, function (args) {
    args = arguments
    for (var i = 1; i < args.length - 2; i++) {
      r.params[r.keys.shift()] = args[i]
      match = true
    }
  })

  return match ? r.params : match
}
