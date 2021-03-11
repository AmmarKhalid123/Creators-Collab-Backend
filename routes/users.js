var express = require('express');

const User = require('../models/user');
const authenticate = require('../authenticate');

var router = express.Router();
router.use(express.json());
var passport = require('passport');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', async (req, res, next) => {
  const users = await User.findOne({email: req.body.email});
  if (!users) {
    User.register(new User({ username: req.body.username, email: req.body.email }), req.body.password,
      (err, user) => {
        if (err) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err: err, success: false });
        }
        else {
          if (req.body.username) {
            user.username = req.body.username;
          }
          user.save(async (err, user) => {
            if (err) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ err: err, success: false });
              return;
            }
            passport.authenticate('local')(req, res, () => {
              var token = authenticate.getToken({ _id: user._id });
              var userInfo = { username: user.username, id: user._id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ success: true, status: 'Registration Successful', token, user: userInfo });
          });
        })
      }
    })
  }
  else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: false, err: { name: 'Email Already Exists!' } });
  }
});

router.post('/login', (req, res, next) => {
	if (!req.body.username) {
		res.send("Body doesn't contain username!");
	}
	if (!req.body.password) {
		res.send("Body doesn't contain password!");
	}
	User.findOne({ email: req.body.username })
		.then(u => {
			if (u) {
				req.body.username = u.username;
			}
			passport.authenticate('local', (err, user, info) => {
				if (err) {
					return next(err);
				}
				if (!user) { // if no user is returned, info would contain the reason
					res.statusCode = 401;
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: false, status: 'Login Failed', err: info });
				}
				else {
					req.logIn(user, (err) => {
						if (err) {
							res.statusCode = 401;
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: false, status: 'Login Failed', err: 'Could not log in user!' });
						}
						var token = authenticate.getToken({ _id: user._id });
            var userInfo = { username: user.username, id: user._id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt, image: user.image,};
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, token: token, status: 'Login Successful!', user: userInfo });
					});
				}
			})(req, res, next);
		})
});



module.exports = router;
