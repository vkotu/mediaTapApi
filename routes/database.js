var ejs= require('ejs');
var mysql = require('mysql');

function getConnection(){
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'password',
        database : 'media_tap'
    });
    return connection;
}


function fetchData(sqlQuery,params,callback){

    console.log("\nSQL Query::"+sqlQuery);
    var connection=getConnection();


    connection.query(sqlQuery,params, function(err, rows, fields) {
        if(err){
            console.log("ERROR: " + err.message);
        }
        else
        {	// return err or result
            console.log("DB Results:"+rows);
            callback(err, rows);
        }
    });
    console.log("\nConnection closed..");
    connection.end();
}
//params is an array
function execQuery(query, params,callback) {
    var connection=getConnection();

    connection.query(query, params,function(err,result){
        console.log("In exec Qeury = "+ err);
        callback(err,result);
    });

    console.log("\nConnection closed..");
    connection.end();

}

exports.fetchData=fetchData;
exports.execQuery=execQuery;