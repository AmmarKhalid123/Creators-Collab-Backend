var express = require('express');

var router = express.Router();
router.use(express.json());

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
})


module.exports = router;
