var gameDB = require('../data/gameDB.js');
var tableDB = require('../data/tableDB.js');
var handDB = require('../data/handDB.js');
var availableCards = require('./cardcodes.json');
const turnDelay = 1000;

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

async function checkTurn(gameid, playerid) {
    let turn = gameDB.getTurn(gameid);
    return turn == playerid;
}

async function endTurn(gameid, playerid, callback) {

    //check if enemy is standing or not
    let stand = gameDB.getStand(gameid);
    let enemyStand;
    if(stand.player1 = playerid) {
        enemyStand = stand.player2_stand;
    } else {
        enemyStand = stand.player1_stand;
    }

    //enemy did not stand
    if(!enemyStand) {
        //actually change turn
        if(!(await gameDB.changeTurn(options.gameid))) {
            callback(false);
            return;
        }
    }

    //start new turn
    callback(await startTurn(gameid));
    
}

//deals a table card to the player whose turn it is
async function startTurn(gameid) {
    let playerid = gameDB.getTurn(gameid);
    let card = 't' + random(0, 9);

    return await tableDB.createCard(gameid, playerid, card);

}

//stand and check for end of set
async function stand(gameid, playerid) {

    //stand
    if(!(await gameDB.stand(gameid, playerid))) {
        return false; //stand failed
    }

    //check if both players are standing
    let stands = gameDB.getStand(gameid);
    if(stands.player1_stand && stands.player2_stand) {
        //if both players are standing, do end of set
        return endSet(gameid);
    }

    return true;

}

//forfeit the match
async function forfeit(gameid, playerid) {
    let game = gameDB.getEndOfSet(gameid);
    if(game.player1 == playerid) {
        game.player2_points = 3;
    } else {
        game.player1_points = 3;
    }
    
    return gameOver(game);

}

//End of set, check winner, reset if game not over
async function endSet(gameid) {
    
    //check winner
    let game = gameDB.getEndOfSet(gameid);
    let p1Count = countTable(gameid, game.player1);
    let p2Count = countTable(gameid, game.player2);

    if(p1Count > 20) {
        //p1 busted, p2 still under 20
        if(p2Count < 20) {
            game.player2_points += 1;
        }
    } else if(p2Count > 20) {
        //p2 busted, p1 still under
        if(p1Count < 20) {
            game.player1_points += 1;
        } 
    //no bust, p1 higher
    } else if(p1Count > p2Count) {
        game.player1_points += 1;
    //no bust, p2 higher
    } else if(p2Count > p1Count) {
        game.player2_points += 1;
    }
    //else tie and nothing happens

    //update points in DB
    gameDB.updatePoints(gameid, game.player1_points, game.player2_points);

    //check if game over
    if(game.player1_points == 3 || game.player2_points == 3) {
        return gameOver(game);
    }

    //reset
    return resetGame(game);

}

async function gameOver(game) {
    let winner;
    if(game.player1_points == 3) {
        winner = game.player1;
    } else {
        winner = game.player2;
    }

    if(!(await gameDB.setWinner(game.gameid, winner))) {
        return false;
    }
    if(!(await handDB.clearHands(game.gameid))) {
        return false;
    }
    if(!(await tableDB.removeCardBySet(game.gameid, game.set))) {
        return false;
    }

    return true;
}


async function resetGame(game) {
    if(!(await tableDB.removeCardBySet(game.gameid, game.set))) {
        return false;
    }
    if(!(await gameDB.nextSet(game.gameid, game.set + 1))) {
        return false;
    }
    if(!(await gameDB.changeTurn(game.gameid))) {
        return false;
    }

    return true;
}

async function countTable(gameid, playerid) {
    let count = 0;
    let table = await tableDB.getCards(gameid, playerid);
    table.forEach(card => {
        let type = card.charAt(0);
        if(type == 't' || type == 'p') {
            count += card.charAt(1);
        } else if (type == 'n') {
            count -= card.charAt(0);
        }
    });
    return count;

}

async function play(gameid, userid, card) {
    //check the player actually has the card
    let validCards = await handDB.getCards(gameid, userid);
    if(await validCards.indexOf(card) == -1) {
        //card not in player hand
        return false
    }

    //check the table has space for the card
    let tableCards = await tableDB.getCards(gameid, userid);
    if (tableCards.length >= 9) {
        return false;
    }

    //remove from hand
    let success = await handDB.removeCard(gameid, userid, card);
    if(!success) {
        return false;
    }

    //add to table
    success = await tableDB.createCard(gameid, userid, card);
    if(!success) {
        //lmao card just got burned
        return false;
    }

    //if table is now full with this card, stand
    if(tableCards.length == 8) {
        return await stand(gameid, userid);
    }
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

    //get host and make sure player is not joining their own game
    let player1ID = await gameDB.getPlayer1(gameid);
    if(player1ID == player2ID) {
        callback({"error": "Cannot join a game you are hosting"});
        return;
    }

    //join player 2 to the game
    let success = await gameDB.setPlayer2(gameid, player2ID);
    if(success) {

        //deal p2 hand
        success = await dealHand(gameid, player2ID);
        if(success.success) {

            //deal p1 hand
            success = await dealHand(gameid, player1ID);

            if(success.success) {
                callback(gameid)

                //deal first card
                success = await startTurn(gameid);
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

    let gameSource = await gameDB.getGame(gameid);

    //error if the player is not part of this game
    if(gameSource.player1 != playerid && gameSource.player2 != playerid) {
        callback({"error": "Requested game does not exist or you do not have access"});
        return;
    }

    //get other player id
    let enemyid, playername, enemyname, playerpoints, enemypoints, playerstand, enemystand;
    if(gameSource.player1 == playerid) {
        enemyid = gameSource.player2;
        playername = gameSource.p1name;
        enemyname = gameSource.p2name;
        playerpoints = gameSource.player1_points;
        enemypoints = gameSource.player2_points;
        playerstand = gameSource.player1_stand;
        enemystand = gameSource.player2_stand;
    } else {
        enemyid = gameSource.player1;
        playername = gameSource.p2name;
        enemyname = gameSource.p1name;
        playerpoints = gameSource.player2_points;
        enemypoints = gameSource.player1_points;
        playerstand = gameSource.player2_stand;
        enemystand = gameSource.player1_stand;
    }

    //get user relative turn
    let turn = gameSource.turn == playerid;

    let game = {
        "gameid": gameSource.gameid,
        "playerid": playerid,
        "enemyid": enemyid,
        "playername": playername,
        "enemyname": enemyname,
        "turn": turn,
        "points": playerpoints,
        "enemypoints": enemypoints,
        "winner": gameSource.winner,
        "set": gameSource.set,
        "stand": playerstand,
        "enemystand": enemystand
    };

    game.hand = await handDB.getCards(gameid, playerid);
    game.enemyHand = await handDB.getEnemyCards(gameid, enemyid);
    game.table = await tableDB.getCards(gameid, playerid);
    game.enemyTable = await tableDB.getCards(gameid, enemyid);

    callback({"success": true, "game": game});
}

//No real business logic, these two are just SQL queries
exports.getGameList = async function(callback) {
    callback(await gameDB.getGameList());
}

exports.getUsersGames = async function(userid, callback) {
    callback(await gameDB.getUsersGames(userid))
}

/**
 * Perform player action
 * @param {userid, gameid, action, ?card} options 
 * @param {*} callback 
 */
exports.action = async function(options, callback) {
    //play a card
    if(options.action == 'play') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            callback(false);
            return;
        }

        callback(await play());

    } else if(options.action == 'endTurn') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            callback(false);
            return;
        }

        callback(await endTurn(options.gameid, options.userid, callback))
        return;

    } else if(options.action == 'stand') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            callback(false);
            return;
        }

        callback(await stand(options.gameid, options.userid));
        return;

    } else if(options.action == 'forfeit') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            callback(false);
            return;
        }

        callback(await forfeit(options.gameid, options.userid));

    }
}

