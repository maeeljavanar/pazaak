var database = require('./database.js');

exports.createCard = async function(gameid, playerid, card) {
    //insert into database
    let response = await database.executeQuery("INSERT INTO hand_card(gameid, playerid, card_code) VALUES(?, ?, ?)", [gameid, playerid, card]);
    console.log("Response from insert: ", response);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.removeCard = async function(gameid, playerid, card) {
    //delete
    let response = await database.executeQuery("DELETE FROM hand_card WHERE gameid = ? AND playerid = ? AND card_code LIKE ?", [gameid, playerid, card]);
    console.log("Response from delete: ", response);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.getCards = async function(gameid, playerid) {
    //select
    let cards = [];
    let response = await database.executeQuery("SELECT card_code FROM hand_card WHERE gameid = ? AND playerid = ?", [gameid, playerid]);
    response.forEach(row => {
        console.log("Row: ", row);
        cards.push(row.card_code);
    });
    return cards;
}

exports.getEnemyCards = async function(gameid, playerid) {
    let response = await database.executeQuery("SELECT COUNT(*) as cards FROM hand_card WHERE gameid = ? AND playerid = ?", [gameid, playerid]);
    return response[0];
}

exports.clearHands = async function(gameid) {
    let response = await database.executeQuery("DELETE FROM hand_card WHERE gameid = ?", [gameid]);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}