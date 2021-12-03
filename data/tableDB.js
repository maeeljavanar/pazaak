var database = require('./database.js');

exports.createCard = async function(gameid, playerid, card) {
    //insert into database
    let response = await database.executeQuery("INSERT INTO table_card(gameid, playerid, `set`, card_code) VALUES(?, ?, (SELECT `set` FROM game WHERE gameid = ?), ?)", [gameid, playerid, gameid, card]);
    console.log("Response from insert: ", response);
    if(response.affectedRows == 1) {
        return true;
    } else {
        return false;
    }
}

exports.removeCardBySet = async function(gameid, set) {
    //delete
    let response = await database.executeQuery("DELETE FROM table_card WHERE gameid = ? AND `set` = ?", [gameid, set]);
    console.log("Response from delete: ", response);
    if(response.affectedRows >= 1) {
        return true;
    } else {
        return false;
    }
}

exports.getCards = async function(gameid, playerid) {
    //select
    let cards = [];
    let response = await database.executeQuery("SELECT card_code FROM table_card WHERE gameid = ? AND playerid = ?", [gameid, playerid]);
    response.forEach(row => {
        cards.push(row.card_code);
    });
    return cards;
}