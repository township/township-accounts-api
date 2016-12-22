var memdb = require('memdb')
var createApp = require('appa')
var send = require('appa/send')
var error = require('appa/error')

var township = require('../index.js')

module.exports = function testserver (config) {
  var app = createApp({log: {level: 'silent'}})
  var db = memdb()
  app.db = db
  var ship = township(db, config)

  app.on('/register', function (req, res, ctx) {
    ship.register(req, res, ctx, function (err, code, data) {
      if (err) return error(code, err.message).pipe(res)
      send(code, data).pipe(res)
    })
  })

  app.on('/login', function (req, res, ctx) {
    ship.login(req, res, ctx, function (err, code, data) {
      if (err) return error(code, err.message).pipe(res)
      send(code, data).pipe(res)
    })
  })

  app.on('/updatepassword', function (req, res, ctx) {
    ship.updatePassword(req, res, ctx, function (err, code, data) {
      if (err) return error(code, err.message).pipe(res)
      send(code, data).pipe(res)
    })
  })

  app.on('/verifytoken', function (req, res, ctx) {
    ship.verify(req, function (err, token, rawToken) {
      if (err) return error(400, err.message).pipe(res)
      var body = {
        token: token,
        message: 'Token is valid',
        rawToken: rawToken
      }
      send(200, body).pipe(res)
    })
  })

  app.ship = ship
  return app
}
