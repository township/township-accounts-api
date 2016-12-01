var memdb = require('memdb')
var createApp = require('appa')
var township = require('../index.js')

module.exports = function testserver (config) {
  var app = createApp()
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
    
  })
  
  app.on('/password', function (req, res, ctx) {
    
  })
  
  app.ship = ship
  
  return app
}