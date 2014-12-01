/**
 * Created by AniqueTahir on 12/1/2014.
 */
var mysql = require("mysql");
var https = require("https");
var Promise = require("bluebird");

var mysqlconfig = {
    user: "root",
    password: "root",
    host: "localhost",
    database: "gw2"
};

var itemsPromise = new Promise(function(resolve, reject){
    https.get('https://api.guildwars2.com/v2/items/',function(response){
        var json='';
        response.on('data',function(data){
            json+=data;
        });

        response.on('end', function(){
            var whatever = JSON.parse(json);
            resolve(whatever);
        });
    }).on('error',function (error) {
        reject(error);
    });
});

itemsPromise.then(function(data){
    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection(mysqlconfig);

        var valuesSQL='';
        data.forEach(function(a){
            valuesSQL+='('+a+'),';
        });
        valuesSQL = valuesSQL.substr(0,valuesSQL.lastIndexOf(','));


        connection.connect();
        connection.query('insert into items values '+valuesSQL,[],function(err, result){
            if(err){
                reject(err);
            }else{
                console.log(result);
                resolve(data);
            }

        });
        connection.end();
    });

}).then(function(data){
    var promises = data.map(function(datum){
        return new Promise(function(resolve, reject){
            var url = 'https://api.guildwars2.com/v2/items/'+datum;
            https.get(url,function(response){
                response.on('data',function(data){

                });
                response.on('end',function(){

                });
            }).on(error,function(err){reject(err);});
        });
    });
});

