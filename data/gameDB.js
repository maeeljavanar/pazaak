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
    return player1ID;
}