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
    let turn = await gameDB.getTurn(gameid);
    console.log('Turn: ', turn);
    return turn == playerid;
}

async function endTurn(gameid, playerid) {

    //if end turn with over 20, end set
    let count = await countTable(gameid, playerid);
    if(count > 20) {
        return await endSet(gameid);
    }

    //check if enemy is standing or not
    let stands = await gameDB.getStand(gameid);
    let enemyStand, enemyid;
    if(stands.player1 == playerid) {
        enemyStand = stands.player2_stand;
        enemyid = stands.player2;
    } else {
        enemyStand = stands.player1_stand;
        enemyid = stands.player1;
    }

    //if enemy is standing, start next turn
    if(enemyStand) {

        //if your count is greater than enemy count, end the set
        if(count > await countTable(gameid, enemyid)) {
            return await endSet(gameid);
        }

        return await startTurn(gameid);
    
    //if enemy not standing, change turns
    } else {
        //start new turn
        return await changeTurn(gameid);
    }
    
}

async function changeTurn(gameid) {
    //change turn
    let turn = await gameDB.changeTurn(gameid);
    if(!turn) {
        return false
    }
    console.log("Change turn db success");

    //start new turn
    return await startTurn(gameid);
}

//deals a table card to the player whose turn it is
async function startTurn(gameid) {

    //deal card
    let playerid = await gameDB.getTurn(gameid);
    let card = 't' + random(0, 9);
    let success = await tableDB.createCard(gameid, playerid, card);
    
    if(success) {

        //if at 20, auto stand
        if(await countTable(gameid, playerid) == 20) {
            return await stand(gameid, playerid);
        } else {
            return true;
        }

    } else {
        return false;
    }

}

//stand and check for end of set
async function stand(gameid, playerid) {

    //stand
    if(!(await gameDB.stand(gameid, playerid))) {
        return false; //stand failed
    }

    //check if both players are standing
    let stands = await gameDB.getStand(gameid);
    if(stands.player1_stand && stands.player2_stand) {
        //if both players are standing, do end of set
        return await endSet(gameid);

    //otherwise change turn
    } else {
        return await changeTurn(gameid, playerid);
    }

}

//forfeit the match
async function forfeit(gameid, playerid) {
    let game = await gameDB.getEndOfSet(gameid);

    //if no second player ever joined, delete the game
    if(!game.player2) {
        return await gameDB.deleteGame(gameid);
    }

    //forfeit by giving the other player 3 points
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
    let game = await gameDB.getEndOfSet(gameid);
    let p1Count = await countTable(gameid, game.player1);
    let p2Count = await countTable(gameid, game.player2);

    if(p1Count > 20) {
        //p1 busted, p2 still under 20
        if(p2Count <= 20) {
            game.player2_points += 1;
        }
    } else if(p2Count > 20) {
        //p2 busted, p1 still under
        if(p1Count <= 20) {
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
    console.log("End of set after points: ", game);

    //update points in DB
    await gameDB.updatePoints(gameid, game.player1_points, game.player2_points);

    //check if game over
    if(game.player1_points == 3 || game.player2_points == 3) {
        return await gameOver(game);
    }

    //reset
    return await resetGame(game);

}

async function gameOver(game) {
    //Check the winner
    let winner;
    if(game.player1_points == 3) {
        winner = game.player1;
    } else {
        winner = game.player2;
    }

    //update winner in game
    if(!(await gameDB.setWinner(game.gameid, winner))) {
        return false;
    }

    //remove hands for this match
    if(!(await handDB.clearHands(game.gameid))) {
        return false;
    }

    //remove cards from the table for the finished set
    if(!(await tableDB.removeCardBySet(game.gameid, game.set))) {
        return false;
    }

    return true;
}


async function resetGame(game) {
    //remove all cards from the table for the finished set
    if(!(await tableDB.removeCardBySet(game.gameid, game.set))) {
        return false;
    }
    //move the game to the next set
    if(!(await gameDB.nextSet(game.gameid, game.set + 1))) {
        return false;
    }
    //change turns
    if(!(await changeTurn(game.gameid))) {
        return false;
    }

    return true;
}

async function countTable(gameid, playerid) {
    let count = 0;
    let table = await tableDB.getCards(gameid, playerid);
    table.forEach(card => {
        let type = card.charAt(0);
        let val = parseInt(card.charAt(1));
        if(type == 't' || type == 'p') {
            //t0 represents a 10 table card - there are no 0s and no negative 10s
            if(val == 0) {
                count += 10;
            } else {
                count += val;
            }
        } else if (type == 'n') {
            count -= val;
        }
    });
    return count;

}

async function play(options) {
    console.log("Play: ", options.gameid, " ", options.userid, " ", options.card);

    //check the player actually has the card
    let validCards = await handDB.getCards(options.gameid, options.userid);
    if(await validCards.indexOf(options.card) == -1) {
        //card not in player hand
        return false
    }

    //check the table has space for the card
    let tableCards = await tableDB.getCards(options.gameid, options.userid);
    if (tableCards.length >= 9) {
        return false;
    }

    //remove from hand
    let success = await handDB.removeCard(options.gameid, options.userid, options.card);
    if(!success) {
        return false;
    }

    //if switch card, convert to value
    if(options.switch) {
        options.card = options.switch + options.card.charAt(1);
    }

    //add to table
    success = await tableDB.createCard(options.gameid, options.userid, options.card);
    if(!success) {
        //lmao card just got burned
        return false;
    }

    //if table is now full with this card, stand
    if(tableCards.length == 8) {
        return await stand(options.gameid, options.userid);
    }

    //if at 20, auto stand
    if(await countTable(options.gameid, options.userid) == 20) {
        return await stand(options.gameid, options.userid);
    }
}

exports.openGame = async function(player1ID, callback) {

    //limit open games
    let existing = await gameDB.getUsersGames(player1ID);
    if(existing.length > 1) {
        callback({"error": "You already have open games"});
        return;
    }

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
                //deal first card
                success = await startTurn(gameid);
                if(success) {
                    callback(gameid);
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
    if(!gameSource || (gameSource.player1 != playerid && gameSource.player2 != playerid)) {
        callback({"error": "Requested game does not exist or you do not have access", "code": "gdne"});
        return;
    }

    //Assign values relative to the player asking for status
    let enemyid, playername, enemyname, playerpoints, enemypoints, playerstand, enemystand, winner;
    if(gameSource.player1 == playerid) {
        enemyid = gameSource.player2;
        enemyname = gameSource.p2name;
        enemypoints = gameSource.player2_points;
        enemystand = gameSource.player2_stand;

        playername = gameSource.p1name;
        playerpoints = gameSource.player1_points;
        playerstand = gameSource.player1_stand;
    } else {
        enemyid = gameSource.player1;
        enemyname = gameSource.p1name;
        enemypoints = gameSource.player1_points;
        enemystand = gameSource.player1_stand;

        playername = gameSource.p2name;
        playerpoints = gameSource.player2_points;
        playerstand = gameSource.player2_stand;
    }

    //get winner
    if(gameSource.winner && gameSource.winner == enemyid) {
        winner = enemyname;
    } else if (gameSource.winner && gameSource.winner == playerid) {
        winner = playername;
    } else {
        winner = false;
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
        "winner": winner,
        "set": gameSource.set,
        "stand": playerstand,
        "enemystand": enemystand
    };

    //get all the cards
    game.hand = await handDB.getCards(gameid, playerid);
    game.enemyHand = await handDB.getEnemyCards(gameid, enemyid);
    game.table = await tableDB.getCards(gameid, playerid);
    game.enemyTable = await tableDB.getCards(gameid, enemyid);

    callback({"success": true, "game": game});
}

//No real business logic, these are just SQL queries
exports.getGameList = async function(callback) {
    callback(await gameDB.getGameList());
}

exports.getUsersGames = async function(userid, callback) {
    callback(await gameDB.getUsersGames(userid))
}

exports.getOpenGamesUser = async function(userid, callback) {
    callback(await gameDB.getOpenGamesUser(userid));
}

exports.action = async function(options, callback) {

    console.log("Action taken: ", options);

    //play a card
    if(options.action == 'play') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            callback(false);
            return;
        }

        callback(await play(options));

    } else if(options.action == 'endTurn') {

        //check that it actually is this player's turn
        if(!(await checkTurn(options.gameid, options.userid))) {
            console.log("Check turn evaluated to false");
            callback(false);
            return;
        }

        callback(await endTurn(options.gameid, options.userid));
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

