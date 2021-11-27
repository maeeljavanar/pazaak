var gameDB = require('../data/gameDB.js');
var tableDB = require('../data/tableDB.js');
var handDB = require('../data/handDB.js');
var availableCards = require('./cardcodes.json');

//helper so I don't have to keep writing this
function random(min, max) {
    return parseInt((Math.random() * (max - min + 1)), 10) + min;
}

async function dealHand(gameid, player) {
    let length = availableCards.length;
    for(let i = 0; i < 4; i++) {
        let success = await handDB.createCard(gameid, player, availableCards[random(0, length-1)]);
        if(!success) {
            return {"success":false, "error": "Error adding card to hand"}
        }
    }
    return {"success": true};
}

async function dealCard(gameid, playerid, set) {
    let card = 't' + random(0, 9);
    let success = await tableDB.createCard(gameid, playerid, set, card);
    
    return success;
}

exports.openGame = async function(player1ID, callback) {
    //create game, no cards dealt
    let game = await gameDB.createGame(player1ID, null);
    if(game) {
        callback(game);
    } else {
        callback({"error": "Error opening lobby"});
    }
}

exports.joinGame = async function(gameid, player2ID, callback) {
    //join player 2 to the game
    let success = await gameDB.setPlayer2(gameid, player2ID);
    if(success) {

        //deal p2 hand
        success = await dealHand(gameid, player2ID);
        if(success.success) {

            //deal p1 hand
            let player1ID = await gameDB.getPlayer1(gameid);
            success = await dealHand(gameid, player1ID);

            if(success.success) {
                callback(gameid)

                //deal first card
                success = dealCard(gameid, player1ID, 1);
                if(success) {
                    callback(success);
                } else {
                    callback({"error": "error dealing cards"});
                }
            } else {
                callback({"error": "error dealing cards"});
            }
        } else {
            callback({"error": "error dealing cards"});
        }
    } else {
        callback({"error": "Error joining lobby"});
    }
}

exports.getStatus = async function(gameid, playerid, callback) {

    let game = gameDB.getGame(gameid);

    //error if the player is not part of this game
    if(game.player1 != playerid && game.player2 != playerid) {
        return {"error": "Requested game does not exist or you do not have access"};
    }

    //get other player id
    let enemyid;
    if(game.player1 == playerid) {
        enemyid = game.player2;
    } else {
        enemyid = game.player1;
    }

    game.hand = await handDB.getCards(gameid, playerid);
    game.enemyHand = await handDB.getEnemyCards(gameid, enemyid);
    game.table = await tableDB.getCards(gameid, playerid);
    game.enemyTable = await tableDB.getCards(gameid, enemyid);

    return {"success": true, "game": game};
}

exports.getGameList = async function(callback) {
    callback(await gameDB.getGameList());
}