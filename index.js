/*!
 * dush-router <https://github.com/tunnckoCore/dush-router>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

'use strict'

/**
 * A plugin that adds `.createRoute`, `.addRoute` and `.navigate`
 * methods for any app based on [dush][], [base][] or [minibase][].
 * Notice that this plugin emit events - `route` if match, and `notFound` if
 * not route found on defined routes.
 *
 * **Example**
 *
 * ```js
 * var dush = require('dush')
 * var router = require('dush-router')
 *
 * var app = dush()
 * app.use(router())
 *
 * console.log(app._routes) // => []
 * console.log(app.createRoute) // => function
 * console.log(app.addRoute) // => function
 * console.log(app.navigate) // => function
 * ```
 *
 * @name   router()
 * @param  {Object} `opts` no options currently
 * @return {Function} a plugin function which should be passed to `.use` method
 * @api public
 */

module.exports = function dushRouter () {
  return function dushRouter_ (app) {
    var el = null
    app._routes = []

    app.on('route', function onRoute (view, context) {
      return view(context)
    })

    /**
     * > Add/register an actual `route` with `handler`
     * to the `app._routes` array. It uses `.createRoute` method
     * to create an "route" object that is then pushed to `app._routes`.
     *
     * _**Note:** If route handler returns something the `app.navigate` method
     * will return that exact value on route match._
     *
     * **Example**
     *
     * ```js
     * app.addRoute('/foobar', (context) => {
     *   console.log('state:', context.state) // => { hello: 'world' }
     *   console.log('params:', context.params) // => {}
     *   console.log('route:', context.route) // => '/foobar'
     *   console.log('pathname:', context.pathname) // => '/foobar'
     * })
     *
     * app.navigate('/foobar', { hello: 'world' })
     *
     * // or with params
     * app.addRoute('/user/:id', ({ state, params, route, pathname }) => {
     *   console.log('Hello ', state.username) // => 'Hello Charlike'
     *   console.log('Your ID is', params.id) // => 'Your ID is 123'
     *
     *   console.log('route', route) // => '/user/:id'
     *   console.log('path', pathname) // => '/user/123'
     * })
     *
     * app.navigate('/user/123', { username: 'Charlike' })
     * ```
     *
     * @name  .addRoute
     * @param {String} `route` a simple route, express-like definition, e.g. `/user/:id`
     * @param {Function} `handler` a function to be called when `route` match
     * @return {Object} instance for chaining
     * @api public
     */

    app.addRoute = function addRoute (route, handler) {
      app._routes.push(app.createRoute(route, handler))
      return app
    }

    /**
     * > Just create a `route` with `handler`, same as `.addRoute` method,
     * but without adding it to `app._routes` array. This "route" object
     * contains `.match`, `.regex`, `.route` and `.handler` properties.
     * Where `.match` is a function that accepts single argument "pathname"
     * to check against given `route`, `.handler` is the passed `handler`
     * function, `.regex` is the generated regex for that `route` string and
     * the `.route` is the given `route`. The `.match` function returns `null`
     * if passed "pathname" string match to the given `route` but not params
     * and `false` if passed "pathname" not match.
     *
     * _**Note:** This method does not call the given route handler._
     *
     * **Example**
     *
     * ```js
     * const r = app.createRoute('/user/:id', function abc (params) {
     *   console.log('hi user with id:', params.id)
     * })
     *
     * console.log(r.match) // => function
     * console.log(r.handler) // => function
     * console.log(r.handler.name) // => 'abc'
     * console.log(r.route) // => '/user/:id'
     * console.log(r.regex) // => /^\/user\/(\w+)$/i
     *
     * var params = r.match('/user/123')
     * console.log(params) // => { id: 123 }
     *
     * // manually call the route handler
     * if (params !== false) {
     *   r.handler(params || {})
     * }
     *
     * // not match, so returns `false`
     * params = r.match('/foobar')
     * console.log(params) // => false
     *
     * var route = app.createRoute('/foobie', () => {})
     *
     * // match, but no params, so return `null`
     * var res = route.match('/foobie')
     * console.log(res) // => null
     * ```
     *
     * @name  .createRoute
     * @param {String} `route` a simple route, express-like definition, e.g. `/user/:id`
     * @param {Function} `handler` a function to be called when `route` match
     * @return {Object} a "route" object with few properties
     * @api public
     */

    app.use(createRoutePlugin())

    /**
     * > Manually navigate to some route with url `pathname` and
     * returns what the route handler returns. You can pass
     * a custom `state` which will be passed to route handler's context
     * as `context.state`. This method fires `notFound` event when
     * not found match, and `route` when find a route.
     *
     * **Example**
     *
     * ```js
     * app.on('notFound', (context) => {
     *   console.log(`sorry ${context.pathname} page not exist`)
     *   console.log('this is incoming state:', context.state)
     * })
     * app.navigate('/foo/bar/qux', { aa: 11 })
     *
     * app.addRoute('/hello/:place', (context) => {
     *   console.log('hi', context.params.place) // => 'hi world'
     * })
     * app.navigate('/hello/world')
     *
     * // remove default "on route" handler
     * app.off('route')
     *
     * // and define your custom one,
     * // to change route handler arguments
     * app.on('route', (handler, context) => {
     *   return handler(context.state, context.params)
     * })
     *
     * // notice the handler signature, it's different than
     * // the default one seen in above `/hello/:place` route
     * app.addRoute('/user/:name', (state, params) => {
     *   var name = params.name || state.username
     *   console.log('name:', name) // => 'name: john' or 'name: charlike'
     *   return name
     * })
     *
     * // it returns what the route handler return
     * var res = app.navigate('/user/john')
     * console.log(res) // => 'john'
     *
     * var ret = app.navigate('/user', { username: 'charlike '})
     * console.log(ret) // => 'charlike'
     * ```
     *
     * @name   .navigate
     * @param  {String} `pathname` a url to navigate to
     * @param  {any} `state` optionally pass a "state", passed to route's handler
     * @return {any} basically returns what the route handler return
     * @api public
     */

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
          params: params || {},
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
      r.keys.forEach(function (key) {
        r.params[key] = args[i]
      })
      match = true
    }
  })

  return match ? r.params : match
}
