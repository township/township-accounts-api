var test = require('tape')
var nets = require('nets')
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
    'email': 'foo@example.com',
    'password': 'foobar'
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
    'email': 'foo@example.com',
    'password': 'foobar'
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
    'email': 'foo@example.com',
    'password': 'foobar',
    'newPassword': 'tacobar'
  }
  var headers = {authorization: 'Bearer ' + token}
  nets({url: root + '/updatepassword', method: 'POST', json: json, headers: headers}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 got token')
    t.ok(body.token, 'got token in response')
    t.notEqual(token, body.token, 'new token is diff from old token')
    token = body.token
    t.end()
  })
})

test('login with new pw', function (t) {
  var json = {
    'email': 'foo@example.com',
    'password': 'tacobar'
  }
  nets({url: root + '/login', method: 'POST', json: json}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 got token')
    t.ok(body.token, 'got token in response')
    t.notEqual(token, body.token, 'login token is diff from token from after changing pw')
    token = body.token
    t.end()
  })
})

test('verify a token', function (t) {
  var headers = {
    'Authorization': 'Bearer ' + token
  }
  nets({url: root + '/verifytoken', method: 'GET', headers: headers, json: true}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 OK')
    t.equals(body.message, 'Token is valid', 'token is valid')
    t.equals(body.rawToken, token, 'rawToken matches')
    t.ok(body.token.auth, 'got body.token.auth')
    t.end()
  })
})

test('require authorization header', function (t) {
  var headers = {}
  nets({url: root + '/verifytoken', method: 'GET', headers: headers, json: true}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 400, '400 status response')
    t.end()
  })
})

test('log out', function (t) {
  var headers = {
    'Authorization': 'Bearer ' + token
  }
  nets({url: root + '/logout', method: 'POST', header: headers, json: true}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 status response')
    t.end()
  })
})

test('destroy account', function (t) {
  var headers = {
    'Authorization': 'Bearer ' + token
  }
  nets({url: root + '/destroy', method: 'DELETE', header: headers, json: true}, function (err, resp, body) {
    t.ifErr(err)
    t.equals(resp.statusCode, 200, '200 status response')
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
