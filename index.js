var createAuth = require('township-auth')
var basic = require('township-auth/basic')
var createAccess = require('township-access')
var createToken = require('township-token')

var creds = require('./creds')
// var createMailer = require('./email')

module.exports = function createTownship (config, db) {
  var access = createAccess(db)
  var jwt = createToken(db, config)
  var auth = createAuth(db, { providers: { basic: basic } })
  // var mail = createMailer(config.email)
  var verifyScope = access.verifyScope
  var hooks = config.hooks || {}
  hooks.createUser = hooks.createUser || noop
  hooks.addOwner = hooks.addOwner || noop

  var useAPIScope
  var createUserScope
  if (config.requiredScopes) {
    useAPIScope = config.requiredScopes.useAPI
    createUserScope = config.requiredScopes.createUser
  }

  var township = {}

  township.register = function (req, res, ctx, cb) {
    var reqToken = creds(req)
    if (!reqToken) {
      handleRequest()
    } else {
      jwt.verify(creds(req), function (err, token) {
        if (err) {
          // ignore
        }
        handleRequest(token)
      })
    }

    function handleRequest (token) {
      if (req.method === 'POST') {
        handlePost(token)
      } else if (req.method === 'DELETE') {
        return cb(new Error('Method not implemented'), 500)
      } else {
        return cb(new Error('Method not allowed'), 405)
      }
    }

    function createUser (email, password, cb) {
      auth.create({ basic: { email: email, password: password } }, function (err, authData) {
        if (err) return cb(err, 400)

        access.create(authData.key, ['api:access'], function (err, accessData) {
          if (err) return cb(err, 400)

          var newToken = jwt.sign({
            auth: authData,
            access: accessData
          })

          cb(null, 201, { key: authData.key, token: newToken })
        })
      })
    }

    function handlePost (token) {
      if (!ctx.body) {
        return cb(new Error('Server requires email and password properties'), 403)
      }

      var email = ctx.body.email
      var password = ctx.body.password

      if (!email) {
        return cb(new Error('email property required'), 400)
      } else if (!password) {
        return cb(new Error('password property required'), 400)
      }

      if (!token) {
        // if no token: a user is creating their own account
        if (createUserScope) {
          return cb(new Error('Server requires user creation scope'), 403)
        }

        return hooks.createUser({}, function (err) {
          if (err) return cb(err, 400)
          return createUser(email, password, cb)
        })
      } else {
        // if token: an admin is creating an account for a user
        if (useAPIScope && !verifyScope(token.access, useAPIScope)) {
          return cb(new Error('Server requires API access scope'), 403)
        } else if (createUserScope && !verifyScope(token.access, createUserScope)) {
          return cb(new Error('Server requires user creation scope'), 403)
        }

        return hooks.createUser({}, function (err) {
          if (err) return cb(err, 400)
          return createUser(email, password, cb)
        })
      }
    }
  }

  township.login = function (req, res, ctx, cb) {
    if (req.method === 'POST') {
      if (!ctx.body) {
        return cb(new Error('email and password properties required'), 400)
      }

      var email = ctx.body.email
      var password = ctx.body.password

      if (!email) {
        return cb(new Error('email property required'), 400)
      } else if (!password) {
        return cb(new Error('password property required'), 400)
      }

      auth.verify('basic', { email: email, password: password }, function (err, authData) {
        if (err) return cb(err, 400)

        access.get(authData.key, function (err, accessData) {
          if (err) return cb(err, 400)

          var token = jwt.sign({
            auth: authData,
            access: accessData
          })

          cb(null, 200, {key: authData.key, token: token})
        })
      })
    } else {
      cb(new Error('Method not allowed'), 405)
    }
  }

  township.updatePassword = function (req, res, ctx, cb) {
    if (req.method === 'POST') {
      var rawToken = creds(req)
      jwt.verify(rawToken, function (err, token) {
        if (err) return cb(err, 400)
        if (!token) {
          return cb(new Error('token auth required'), 400)
        }
        handlePost(token)
      })
    } else {
      cb(new Error('Method not allowed'), 405)
    }

    function handlePost (token) {
      if (!ctx.body.password) {
        return cb(new Error('password property required'), 400)
      } else if (!ctx.body.newPassword) {
        return cb(new Error('newPassword property required'), 400)
      } else if (!ctx.body.email) {
        return cb(new Error('email property required'), 400)
      }

      var email = ctx.body.email
      var password = ctx.body.password
      var newPassword = ctx.body.newPassword

      auth.verify('basic', { email: email, password: password }, function (err, authData) {
        if (err) return cb(err, 400)
        auth.update({
          key: token.auth.key,
          basic: { email: email, password: newPassword }
        }, function (err, authData) {
          if (err) return cb(err, 400)

          access.create(token.auth.key, ['api:access'], function (err, accessData) {
            if (err) return cb(err, 400)

            var newToken = jwt.sign({
              auth: authData,
              access: accessData
            })

            jwt.invalidate(rawToken, function (err) {
              if (err) return cb(err, 400)
              cb(null, 200, { key: authData.key, token: newToken })
            })
          })
        })
      })
    }
  }

  return township
}

function noop (opts, cb) { return cb(null, opts) }
