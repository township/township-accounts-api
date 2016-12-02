var test = require('tape')
var nets = require('nets')
var createClient = require('../')
var createApp = require('./test-server.js')
var http = require('http')

var creds = {
  host: 'http://127.0.0.1',
  port: 9966,
  requiredScopes: {
    useAPI: 'api:access'
  },
  email: {
    fromEmail: 'hi@example.com',
    postmarkAPIKey: 'your api key'
  },
  algorithm: 'ES512'
}

creds.publicKey = `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQAvmJlA/DZl3SVKNl0OcyVbsMTOmTM
qU0Avhmcl6r8qxkBgjwArIxQr7G7v8m0LOeFIklnmF3sYAwA+8llHGFReV8ASW4w
5AUC8ngZThaH9xk6DQscaMmoEFPN5thWpNcwMgUFYovBtPLwtAZjYr9Se+UT/5k4
VltW7ko6SHbCfMgUUbU=
-----END PUBLIC KEY-----`

creds.privateKey = `-----BEGIN EC PRIVATE KEY-----
MIHbAgEBBEFmz7VMXRtCPTlBETqMMx/mokyA3xPXra2SkcA7Xh0N6sgne1rgSZNU
ngT6TR3XLfBOt5+p5GRW6p1FVtn+vtPyRKAHBgUrgQQAI6GBiQOBhgAEAL5iZQPw
2Zd0lSjZdDnMlW7DEzpkzKlNAL4ZnJeq/KsZAYI8AKyMUK+xu7/JtCznhSJJZ5hd
7GAMAPvJZRxhUXlfAEluMOQFAvJ4GU4Wh/cZOg0LHGjJqBBTzebYVqTXMDIFBWKL
wbTy8LQGY2K/UnvlE/+ZOFZbVu5KOkh2wnzIFFG1
-----END EC PRIVATE KEY-----`

var app = createApp(creds)
var server = http.createServer(app)
var token

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
    t.equals(resp.statusCode, 201, '201 created user')
    t.ok(body.token, 'got token in response')
    t.end()
  })
})

test('login', function (t) {
  var json = {
    "email": "foo@example.com",
    "password": "foobar"
  }
  nets({url: root + '/login', method: 'POST', json: json}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 got token')
    t.ok(body.token, 'got token in response')
    token = body.token
    t.end()
  })
})

test('change pw', function (t) {
  var json = {
    "email": "foo@example.com",
    "password": "foobar",
    "newPassword": "tacobar"
  }
  var headers = {authorization: 'Bearer ' + token}
  nets({url: root + '/updatepassword', method: 'POST', json: json, headers: headers}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 got token')
    t.ok(body.token, 'got token in response')
    token = body.token
    t.end()
  })
})

test('login with new pw', function (t) {
  var json = {
    "email": "foo@example.com",
    "password": "tacobar"
  }
  nets({url: root + '/login', method: 'POST', json: json}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 got token')
    t.ok(body.token, 'got token in response')
    token = body.token
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
