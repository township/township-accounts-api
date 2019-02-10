var memdb = require('memdb')
var createApp = require('appa-api')
var send = require('appa-api/send')
var error = require('appa-api/error')

var TownshipAccountsApi = require('../index.js')

module.exports = function testserver (config) {
  var app = createApp({ log: { level: 'silent' } })
  var db = memdb()
  app.db = db
  var ship = new TownshipAccountsApi(db, config)

  app.on('/register', function (req, res, ctx) {
    ship.register(req, res, ctx, function (err, code, data) {
      if (err) return error(res, code, err.message)
      send(res, code, data)
    })
  })

  app.on('/login', function (req, res, ctx) {
    ship.login(req, res, ctx, function (err, code, data) {
      if (err) return error(res, code, err.message)
      send(res, code, data)
    })
  })

  app.on('/logout', function (req, res, ctx) {
    ship.logout(req, res, ctx, function (err, code, data) {
      if (err) return error(res, code, err.message)
      send(res, code, data)
    })
  })

  app.on('/destroy', function (req, res, ctx) {
    ship.destroy(req, res, ctx, function (err, code, data) {
      if (err) return error(res, code, err.message)
      send(res, code, data)
    })
  })

  app.on('/updatepassword', function (req, res, ctx) {
    ship.updatePassword(req, res, ctx, function (err, code, data) {
      if (err) return error(res, code, err.message)
      send(res, code, data)
    })
  })

  app.on('/verifytoken', function (req, res, ctx) {
    ship.verify(req, function (err, token, rawToken) {
      if (err) return error(res, 400, err.message)
      var body = {
        token: token,
        message: 'Token is valid',
        rawToken: rawToken
      }
      send(res, 200, body)
    })
  })

  app.ship = ship
  return app
}
