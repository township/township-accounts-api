var memdb = require('memdb')
var createApp = require('appa')
var township = require('../index.js')

module.exports = function testserver (config) {
  var app = createApp({log: {level: 'silent'}})
  var db = memdb()
  app.db = db
  var ship = township(config, db)

  app.on('/register', function (req, res, ctx) {
    ship.register(req, res, ctx, function (err, code, data) {
      if (err) return app.error(res, code, err.message)
      app.send(res, code, data)
    })
  })

  app.on('/login', function (req, res, ctx) {
    ship.login(req, res, ctx, function (err, code, data) {
      if (err) return app.error(res, code, err.message)
      app.send(res, code, data)
    })
  })

  app.on('/updatepassword', function (req, res, ctx) {
    ship.updatePassword(req, res, ctx, function (err, code, data) {
      if (err) return app.error(res, code, err.message)
      app.send(res, code, data)
    })
  })

  app.ship = ship

  return app
}
