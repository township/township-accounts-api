# township

route handlers to use in your REST API to handle user management

## quick start

```js
var township = require('township')
var db = require('memdb') // can be any levelup e.g. level-party or level
var config = require('./your-config')
var ship = township(config, db)
```

## API

### var township = require('township')

returns a constructor you can use to make multiple instances

### var ship = township(config, db)

creates a new instance

`db` should be a levelup instance

`config` properties:

  - `secret` (String) - used with township-token
  - `email` (Object) - used to send emails with postmark
  - `email.fromEmail` (String) - from address
  - `email.postmarkAPIKey` (String)

### ship.register(req, res, ctx, cb)

registers a new user. pass `req`, `res` from your http server.

`ctx` should be an object with:

- `body` (Object) - the POST JSON body as a parsed Object
- `body.email` (String)
- `body.password` (String)
