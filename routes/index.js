const config = require('../config.json');
var express = require('express');
var router = express.Router();
var user = require('../business/user.js');
var jwt = require('jsonwebtoken');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function(req, res, next) {
  user.login(req.body.username, req.body.password, userid => {
    
    if(userid) {

      var token = generateToken(req, userid);
      res.json({"success": true, "token": token});

    } else {
      res.json({"success": false});
    }
  })
});

function generateToken(req, userid) {
  
  var token = jwt.sign({
      "name": req.body.username
    }, config.jwtSecret,
    {
      subject: `${userid}`,
      expiresIn: '24h'
    });

  return token;

}

function validateToken(token) {

  try {
    var decoded = jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch(err) {
    return false;
  }

}

module.exports = router;
