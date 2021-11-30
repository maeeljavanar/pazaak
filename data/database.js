const config = require('../config.json');
var mysql = require('mysql2');

/**
 * Open/close connection for each call for now
 * Later can rewrite to use connection pool
 */
function connect() {
    let connection = mysql.createConnection({
        host: config.dbHost,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName
    });
    
    connection.connect(function(err) {
        if (err) {
            console.error('error: ' + err.message);
        } else {
            console.log('Connected to the MySQL server.');
        }
    });

    return connection;
}

function close(connection) {
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
        let connection = connect();

        connection.execute(sql, vals, (err, rows) => {
           if(err) {
               console.log("Error: ", JSON.stringify(err), err);
               resolve(false);
           }
    
            connection.unprepare(sql); //close cached statement
            close(connection); //close connection
            if(rows) {
                console.log("Response: " + JSON.stringify(rows));
                resolve(rows);
            }
        });
    });  
}
