var gameDB = require('../data/gameDB.js');
var tableDB = require('../data/tableDB.js');
var handDB = require('../data/handDB.js');
var availableCards = require('./cardcodes.json');

async function dealHand(gameid, player) {
    let length = availableCards.length;
    for(let i = 0; i < 4; i++) {
        let success = handDB.createCard(gameid, player, availableCards[Math.round(Math.random() * length)]);
        if(!success) {
            return {"success":false, "error": "Error adding card to hand"}
        }
    }
    return {"success": true};
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
            } else {
                callback({"error": "error dealing cards"});
            }
        } else {
            callback({"error": "error dealing cards"});
        }

        //deal p1 hand
        let player1ID = await gameDB.getPlayer1(gameid);
        dealHand(gameid, player1ID);

        callback(success);
    } else {
        callback({"error": "Error joining lobby"});
    }
}