const confg = require('../config.json');
var mysql = require('mysql2');
var connection;

/**
 * Open/close connection for each call for now
 * Later can rewrite to use connection pool
 */
function connect() {
    connection = mysql.createConnection({
        host: confg.dbHost,
        user: confg.dbUser,
        password: confg.dbPassword,
        database: confg.dbName
    });
    
    connection.connect(function(err) {
        if (err) {
            return console.error('error: ' + err.message);
        } else {
            console.log('Connected to the MySQL server.');
        }
    });
}

function close() {
    connection.end(function(err) {
        if (err) {
            console.log('error:' + err.message);
        } else {
            console.log('Close the database connection.');
        }
    });
}

//catch all for now
exports.executeQuery = function(sql, vals) {
    return new Promise(resolve => {
        connect();

        connection.execute(sql, vals, (err, rows) => {
           if(err) {
               console.log("Error: " + JSON.stringify(err));
               resolve(false);
           }
    
            connection.unprepare(sql); //close cached statement
            close(); //close connection
            if(rows) {
                console.log("Response: " + JSON.stringify(rows));
                resolve(rows);
            }
        });
    });  
}
