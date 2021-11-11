var database = require('./database.js');


exports.getPasswordHash = async function(username) {
    var hash = await database.executeQuery("SELECT password FROM player WHERE username = ?", [username]);
    return hash[0].password;
}

exports.getId = async function(username) {
    var id = await database.executeQuery("SELECT userid FROM player WHERE username = ?", [username]);
    return id[0].userid;
}

