/*!
 * dush-router <https://github.com/tunnckoCore/dush-router>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var test = require('mukla')
var dush = require('dush')
var router = require('./index')

var app = dush().use(router())

test('should add `.addRoute`, `.createRoute` and `.navigate` methods', function (done) {
  test.strictEqual(typeof app.addRoute, 'function')
  test.strictEqual(typeof app.createRoute, 'function')
  test.strictEqual(typeof app.navigate, 'function')
  done()
})

test('should `.createRoute` return a Route object', function (done) {
  var handler = function handlerName () {}
  var route = app.createRoute('/foobar', handler)

  test.strictEqual(typeof route, 'object')
  test.strictEqual(route.route, '/foobar')
  test.strictEqual(typeof route.handler, 'function')
  test.strictEqual(typeof route.match, 'function')
  test.strictEqual(route.handler.name, 'handlerName')
  test.strictEqual(app._routes.length, 0)
  done()
})

test('should route.match(pathname) return object on match', function (done) {
  var route = app.createRoute('/user/:name', function () {})

  test.deepEqual(route.keys, ['name'])

  var params = route.match('/user/quxie')
  test.strictEqual(typeof params, 'object')
  test.strictEqual(params.name, 'quxie')
  test.strictEqual(app._routes.length, 0)
  done()
})

test('should `route.match(pathname)` return null if match but no params', function (done) {
  var route = app.createRoute('/hi', function heya () {})
  var res = route.match('/hi')
  test.strictEqual(res, null)
  done()
})

test('should `route.match(pathname)` return false if no match', function (done) {
  var app = dush()
  app.use(router())

  var r = app.createRoute('/xyz', function () {})
  test.strictEqual(r.match('/xxx'), false)
  done()
})

test('should `.addRoute(route, handler)` return self', function (done) {
  var ret = app.addRoute('/foobar', function () {})
  test.strictEqual(typeof ret, 'object')
  test.strictEqual(typeof ret.addRoute, 'function')
  test.strictEqual(typeof ret.navigate, 'function')
  test.strictEqual(typeof ret.createRoute, 'function')
  test.strictEqual(ret._routes.length, 1)
  test.strictEqual(app._routes.length, 1)
  done()
})

test('should `.navigate` call route handler with params and given state', function (done) {
  app.addRoute('/hello/:place', function (context) {
    test.strictEqual(typeof context, 'object')
    test.strictEqual(typeof context.state, 'object')
    test.strictEqual(typeof context.params, 'object')
    test.strictEqual(context.params.place, 'world')
    test.strictEqual(context.state.foo, 'bar')
    test.strictEqual(context.route, '/hello/:place')
    test.strictEqual(context.pathname, '/hello/world')
    done()
  })

  app.navigate('/hello/world', { foo: 'bar' })
})

test('should emit `notFound` event when no route found', function (done) {
  var app = dush().use(router())
  var called = 0

  app.on('notFound', function (context) {
    test.strictEqual(typeof context, 'object')
    test.strictEqual(context.pathname, '/zazzy')
    test.deepEqual(context.state, { aaa: 'bbb' })
    called++
  })

  app.addRoute('/goo/gle', function () {})
  app.addRoute('/foobar', function () {})
  app.navigate('/zazzy', { aaa: 'bbb' })

  test.strictEqual(app._routes.length, 2)
  test.strictEqual(called, 1)
  done()
})

test('should `.navigate` return what is returned from the route handler', function (done) {
  app.addRoute('/abc', function routeHandler (ctx) {
    return 100 + ctx.state.num
  })

  var res = app.navigate('/abc', { num: 200 })
  test.strictEqual(res, 300)
  done()
})

test('should allow custom `.on("route")` to change handler arguments', function (done) {
  var app = dush().use(router())
  var called = 0

  // remove the default handling
  app.off('route')

  // define new one
  app.on('route', function onRoute (handler, context) {
    return handler(context.state, context.params || {})
  })

  app.once('notFound', function (context) {
    test.strictEqual(context.pathname, '/zaz')
    called = called + 1
  })
  app.addRoute('/foo/:id', function fooid (state, params) {
    test.deepEqual(state, { name: 'charlike' })
    test.deepEqual(params, { id: 123 })
    return (called = called + 1)
  })
  app.addRoute('/barry', function (state, params) {
    test.deepEqual(state, {})
    test.deepEqual(params, {})
    return (called = called + 1)
  })

  app.navigate('/zaz')

  var ret = app.navigate('/foo/123', { name: 'charlike' })
  test.strictEqual(ret, 2)

  var res = app.navigate('/barry')
  test.strictEqual(res, 3)

  test.strictEqual(called, 3)
  done()
})
