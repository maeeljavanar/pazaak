const config = require('../config.json');
var express = require('express');
var router = express.Router();
var user = require('../business/user.js');
var game = require('../business/game.js');
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

router.post('/openLobby', function(req, res, next) {
  let requestJWT = validateToken(req.body.token);
  game.openGame(requestJWT.sub, success => {
    if(success.error) {
      res.json({
        "success": false,
        "error": success.error
      });
    } else {
      res.json({
        "success": true,
        "gameid": success
      });
    }
  });
  
});

router.post('/joinLobby', function(req, res, next) {
  let requestJWT = validateToken(req.body.token);
  if(req.body.gameid) {
    game.joinGame(req.body.gameid, requestJWT.sub, success => {
      if(success.error) {
        res.json({
          "success": false,
          "error": success.error
        });
      } else {
        res.json({
          "success": true,
          "gameid": success
        });
      }
    });
  } else {
    res.json({
      "success": false,
      "error": "Gameid required"
    });
  }
  
});

router.post('/gameStatus', function(req, res, next) {
  let requestJWT = validateToken(req.body.token);
  if(req.body.gameid) {
    game.getStatus(req.body.gameid, requestJWT.sub, status => {
      res.json(status);
    });
  }
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
