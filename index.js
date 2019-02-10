const TownshipAccounts = require('township-accounts')

class TownshipAccountsAPI {
  constructor (leveldb, config) {
    this.accounts = new TownshipAccounts(leveldb, config)
  }

  register (req, res, context, callback) {
    if (!context || !context.body || !context.body.email || !context.body.password) {
      return callback(new Error('context.body.email and context.body.password properties required'), 400)
    }

    if (req.method === 'POST') {
      return this.accounts.register(context.body, function (err, account) {
        if (err) return callback(err)

        return callback(null, 201, account)
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  login (req, res, context, callback) {
    if (!context || !context.body) {
      return callback(new Error('context.body.email and context.body.password properties required'), 400)
    }

    if (req.method === 'POST') {
      this.accounts.login(context.body, function (err, account) {
        if (err) return callback(err)

        return callback(null, 200, account)
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  logout (req, res, context, callback) {
    if (req.method === 'POST') {
      const token = this.getToken(req)

      this.accounts.logout(token, function (err) {
        if (err) return callback(err)

        return callback(null, 200, { message: 'account logged out' })
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  destroy (req, res, context, callback) {
    var self = this

    if (req.method === 'DELETE') {
      this.verify(req, function (err, tokenData, token) {
        if (err) return callback(err)

        self.accounts.destroy(tokenData.auth.key, function (err) {
          if (err) return callback(err)

          return callback(null, 200, { message: 'account destroyed' })
        })
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  updatePassword (req, res, context, callback) {
    var self = this

    if (req.method === 'POST') {
      this.verify(req, function (err, token, rawToken) {
        if (err) return callback(err, 400)

        context.body.token = rawToken

        self.accounts.updatePassword(context.body, function (err, account) {
          if (err) return callback(err, 400)

          return callback(null, 200, account)
        })
      })
    } else {
      callback(new Error('Method not allowed'), 405)
    }
  }

  verify (req, callback) {
    var self = this
    const token = this.getToken(req)

    this.accounts.verifyToken(token, function (err, tokenData, token) {
      if (err) return callback(err)

      self.accounts.findByEmail(tokenData.auth.basic.email, function (err, account) {
        if (err) return callback(new Error('Account not found'))

        callback(null, tokenData, token)
      })
    })
  }

  getToken (req) {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.indexOf('Bearer') > -1) {
      return authHeader.split('Bearer ')[1]
    }
  }
}

module.exports = TownshipAccountsAPI
