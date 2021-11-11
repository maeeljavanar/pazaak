var userdb = require('../data/userDB.js');
const argon2 = require('argon2');

//this is separated into a function in case I want to use any options in the future
async function hashPassword(password) {
    return await argon2.hash(password);
}

async function verifyPassword(storedHash, password, username, callback) {
    if (await argon2.verify(storedHash, password)) {
        callback(userdb.getId(username));
    } else {
        callback();
    }
}

exports.login = function(username, password, callback) {

    userdb.getPasswordHash(username).then(storedHash => {

        verifyPassword(storedHash, password, username, callback)

    }); //getPassword

} //login

