var createAccounts = require('township-accounts')

module.exports = function createTownship (db, config) {
  var accounts = createAccounts(db, config)

  var township = {
    accounts: accounts
  }

  township.register = function (req, res, ctx, callback) {
    if (!ctx || !ctx.body) {
      return callback(new Error('ctx.body.email and ctx.body.password properties required'), 400)
    }

    if (req.method === 'POST') {
      return accounts.register(ctx.body, function (err, account) {
        if (err) return callback(err)
        return callback(null, 201, account)
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  township.login = function (req, res, ctx, callback) {
    if (!ctx || !ctx.body) {
      return callback(new Error('ctx.body.email and ctx.body.password properties required'), 400)
    }

    if (req.method === 'POST') {
      accounts.login(ctx.body, function (err, account) {
        if (err) return callback(err)
        return callback(null, 200, account)
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  township.logout = function (req, res, ctx, callback) {
    if (req.method === 'POST') {
      var token = township.getToken(req)

      accounts.logout(token, function (err) {
        if (err) return callback(err)
        return callback(null, 200)
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  township.destroy = function (req, res, ctx, callback) {
    if (req.method === 'DELETE') {
      township.verify(req, function (err, tokenData, token) {
        if (err) return callback(err)
        accounts.destroy(tokenData.auth.key, function (err) {
          if (err) return callback(err)
          return callback(null, 200)
        })
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  township.updatePassword = function (req, res, ctx, callback) {
    if (req.method === 'POST') {
      township.verify(req, function (err, token, rawToken) {
        if (err) return callback(err, 400)
        ctx.body.token = rawToken
        accounts.updatePassword(ctx.body, function (err, account) {
          if (err) return callback(err, 400)
          return callback(null, 200, account)
        })
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  township.verify = function verify (req, callback) {
    var token = township.getToken(req)

    accounts.verifyToken(token, function (err, tokenData, token) {
      if (err) return callback(err)
      accounts.findByEmail(tokenData.auth.basic.email, function (err, account) {
        if (err) return callback(new Error('Account not found'))
        callback(null, tokenData, token)
      })
    })
  }

  township.getToken = function getToken (req) {
    var authHeader = req.headers.authorization
    if (authHeader && authHeader.indexOf('Bearer') > -1) {
      return authHeader.split('Bearer ')[1]
    }
  }

  return township
}
