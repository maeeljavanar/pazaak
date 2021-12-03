const config = require('../config.json');
var express = require('express');
var router = express.Router();
var user = require('../business/user.js');
var game = require('../business/game.js');
var jwt = require('jsonwebtoken');
var chat = require('../business/chat.js');
chat.openChat('lobby');

/**
 * Frontend Routes
 */
router.get('/', (req, res) => {
  res.sendFile('./public/html/lobby.html', {root: config.root});
});

router.get('/signup', (req, res) => {
  res.sendFile('./public/html/signup.html', {root: config.root});
});

router.get('/logout', (req, res) => {
  res.sendFile('./public/html/logout.html', {root: config.root});
});

router.get('/login', (req, res) => {
  res.sendFile('./public/html/login.html', {root: config.root});
});

router.get('/game', (req, res) => {
  res.sendFile('./public/html/game.html', {root: config.root});
});

/**
 * Chat routes
 */
router.post('/chat/', (req, res) => {
  if(req.body.chatid) {
    res.json(chat.getChat(req.body.chatid));
  }
});

router.post('/chat/message', (req, res) => {
  let requestJWT = validateToken(req.body.token);
  if(requestJWT && req.body.chatid && req.body.message) {
    chat.messageChat(req.body.chatid, requestJWT.name, req.body.message);
    res.json({"success": true});
  } else {
    res.json({"error": "Invalid request"})
  }
});

/**
 * Backend Routes
 */
router.post('/createAccount', function(req, res) {
  user.createAccount(req.body.username, req.body.password, userid => {
    if(userid != undefined) {
      var token = generateToken(req, userid);
      res.json({"success": true, "token": token});
    } else {
      res.json({"success": false});
    }
  });
});

router.post('/login', function(req, res, next) {
  user.login(req.body.username, req.body.password, userid => {
    if(userid != undefined) {
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

    chat.openChat(req.body.gameid);
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

router.post('/gameAction', function(req, res, next) {
  let requestJWT = validateToken(req.body.token);
  if(req.body.action) {
    let options = {
      "userid": requestJWT.sub,
      "action": req.body.action,
      "gameid": req.body.gameid
    }
    if(req.body.card) {
      options.card = req.body.card;
    }
    if(req.body.switch) {
      options.switch = req.body.switch;
    }
    game.action(options, success => {
      res.json({"success": success});
    });

  } else {
    res.json({
      "success": false,
      "error": "Invalid request"
    });
  }
});

router.get('/gameList', function(req, res, next) {
  //No login required
  game.getGameList(list => {
    res.json(list);
  });
});

router.post('/myGames', function(req, res, next) {
  let requestJWT = validateToken(req.body.token);
  game.getUsersGames(requestJWT.sub, list => {
    res.json(list);
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
    console.log(err);
    return false;
  }

}

module.exports = router;
