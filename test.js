var test = require('tape')
var nets = require('nets')
var createClient = require('./')
var createApp = require('./test-server.js')
var http = require('http')

var creds = {
  host: 'http://127.0.0.1',
  port: 9966,
  secret: 'this is not very secret',
  requiredScopes: {
    useAPI: 'api:access',
    createUser: 'user:create'
  },
  email: {
    fromEmail: 'hi@example.com',
    postmarkAPIKey: 'your api key'
  }
}

var app = createApp(creds)
var server = http.createServer(app)

test('start test server', function (t) {
  server.listen(creds.port, function (err) {
    t.ifErr(err)
    t.end()
  })
})

var root = creds.host + ':' + creds.port

test('register', function (t) {
  var json = {
    "email": "foo@example.com",
    "password": "foobar"
  }
  nets({url: root + '/register', method: 'POST', json: json}, function (err, resp, body) {
    t.ifErr(err)
    console.log(resp.statusCode, body)
    t.equals(resp.statusCode, 200, '200 OK created user')
    t.ok(body.token, 'got token in response')
    t.end()
  })
})

test('stop test server', function (t) {
  app.db.close(function () {
    server.close(function () {
      t.ok(true, 'closed')
      t.end()
    })    
  })
})

//
// test('login', function (t) {
//   var json = {
//     "client_id": creds.id,
//     "connection": creds.connection,
//     "grant_type": "password",
//     "username": "foo",
//     "password": "foobar",
//     "scope": "openid"
//   }
//   nets({url: root + '/oauth/ro', method: 'POST', json: json}, function (err, resp, body) {
//     t.ifErr(err)
//     t.equals(resp.statusCode, 200, 'logged in OK')
//     t.ok(body.id_token, 'got id_token')
//     t.ok(body.access_token, 'got access_token')
//     t.equals(body.token_type, 'bearer', 'is bearer type')
//     t.end()
//   })
// })
