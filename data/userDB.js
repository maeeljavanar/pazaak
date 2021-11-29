var database = require('./database.js');


exports.getPasswordHash = async function(username) {
    var hash = await database.executeQuery("SELECT password FROM player WHERE username = ?", [username]);
    return hash[0].password;
}

exports.getId = async function(username) {
    var id = await database.executeQuery("SELECT userid FROM player WHERE username = ?", [username]);
    return id[0].userid;
}

exports.createAccount = async function(username, password) {
    //get id for new game
    let userid = await database.executeQuery('SELECT MAX(userid) AS id FROM player', []);
    userid = userid[0].id;
    console.log('Max id already present: ', userid);
    if(userid == null) {
        userid = 0;
    } else {
        userid += 1;
    }
    console.log('User created with id: ', userid);
    var response = await database.executeQuery("INSERT INTO player(userid, username, password) VALUES(?, ?, ?)", [userid, username, password]);
    console.log("Response from insert: ", response);
    if(response && response.affectedRows == 1) {
        return userid;
    } else {
        return false;
    }
}