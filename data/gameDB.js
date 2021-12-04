var database = require('./database.js');

exports.createGame = async function(player1ID, player2ID) {
    //get id for new game
    let gameid = await database.executeQuery('SELECT MAX(gameid) AS id FROM game', []);
    gameid = gameid[0].id;
    console.log('Max id already present: ', gameid);
    if(gameid == null) {
        gameid = 0;
    } else {
        gameid += 1;
    }
    console.log('Game created with id: ', gameid);

    //initial values
    let turn = player1ID,
        pointsP1 = 0,
        pointsP2 = 0,
        set = 1,
        standP1 = false,
        standP2 = false;

    //insert into database
    let response = await database.executeQuery("INSERT INTO game VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [gameid, player1ID, player2ID, turn, pointsP1, pointsP2, null, set, standP1, standP2]);
    console.log("Response from insert: ", response);
    if(response.affectedRows == 1) {
        return gameid;
    } else {
        return false;
    }
}

exports.getGame = async function(gameid) {
    let game = await database.executeQuery("SELECT gameid, player1, player2, p1.username as p1name, p2.username as p2name, turn, player1_points, player2_points, winner, `set`, player1_stand, player2_stand FROM game LEFT JOIN player as p1 ON game.player1 = p1.userid LEFT JOIN player as p2 ON game.player2 = p2.userid WHERE gameid = ?", [gameid]);
    return game[0];

}

exports.setPlayer2 = async function(gameid, player2ID) {
    let response = await database.executeQuery('UPDATE game SET player2 = ? WHERE gameid = ?', [player2ID, gameid]);
    console.log("Response from update: ", response);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.getPlayer1 = async function(gameid) {
    let player1ID = await database.executeQuery('SELECT player1 FROM game WHERE gameid = ?', [gameid]);
    player1ID = player1ID[0].player1;
    return player1ID;
}

exports.getGameList = async function() {
    let games = await database.executeQuery('SELECT game.gameid, player.userid as hostid, player.username as hostuser FROM game LEFT JOIN player ON game.player1 = player.userid WHERE game.player2 IS NULL', []);
    return games;
}

exports.getUsersGames = async function(userid) {
    let games = await database.executeQuery('SELECT game.gameid, game.player1 as hostid, game.player2 as guestid, p1.username as hostuser, p2.username as guestuser '
            + 'FROM game LEFT JOIN player as p1 ON player1 = p1.userid '
            + 'LEFT JOIN player as p2 ON player2 = p2.userid '
            + 'WHERE (player1 = ? OR player2 = ?) AND winner IS NULL', [userid, userid]);
    
    
    return games;
}

exports.getOpenGamesUser = async function(userid) {
    let games = await database.executeQuery('SELECT game.gameid, player.userid as hostid, player.username as hostuser FROM game LEFT JOIN player ON game.player1 = player.userid WHERE game.player2 IS NULL AND game.player1 != ?', [userid]);

    return games;
}

exports.getTurn = async function(gameid) {
    let turn = await database.executeQuery('SELECT turn FROM game WHERE gameid = ?', [gameid]);
    turn = turn[0];
    return turn.turn;
}

//shame this can't just be done as a subquery
exports.changeTurn = async function(gameid) {
    let newTurn = await database.executeQuery('SELECT p.userid FROM game JOIN player as p ON game.player1 = p.userid OR game.player2 = p.userid WHERE game.turn != p.userid AND game.gameid = ?', [gameid]);
    newTurn = newTurn[0];
    newTurn = newTurn.userid;
    let response = await database.executeQuery('UPDATE game SET turn = ? WHERE gameid = ?', [newTurn, gameid]);
    if(response.affectedRows == 1) {
        return newTurn;
    } else {
        return false;
    }
}

exports.getStand = async function(gameid) {
    let stands = await database.executeQuery('SELECT player1, player2, player1_stand, player2_stand FROM game WHERE gameid = ?', [gameid]);
    return stands[0];
}

exports.stand = async function(gameid, playerid) {
    let response;
    if((await exports.getPlayer1(gameid)) == playerid) {
        response = await database.executeQuery('UPDATE game SET player1_stand = TRUE WHERE gameid = ?', [gameid]);
    } else {
        response = await database.executeQuery('UPDATE game SET player2_stand = TRUE WHERE gameid = ?', [gameid]);
    }
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.getEndOfSet = async function(gameid) {
    let data = await database.executeQuery('SELECT gameid, player1, player2, `set`, player1_points, player2_points FROM game WHERE gameid = ?', [gameid]);
    return data[0];
}

exports.updatePoints = async function(gameid, player1_points, player2_points) {
    let response = await database.executeQuery(`UPDATE game SET player1_points = ?, player2_points = ? WHERE gameid = ?`, [player1_points, player2_points, gameid]);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.setWinner = async function(gameid, winner) {
    let response = await database.executeQuery('UPDATE game SET winner = ?, turn = -1 WHERE gameid = ?', [winner, gameid]);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.nextSet = async function(gameid, set) {
    let response = await database.executeQuery('UPDATE game SET `set` = ?, player1_stand = 0, player2_stand = 0 WHERE gameid = ?', [set, gameid]);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.deleteGame = async function(gameid) {
    let response = await database.executeQuery('DELETE FROM game WHERE gameid = ?', [gameid]);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}