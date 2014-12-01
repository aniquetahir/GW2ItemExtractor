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
        connection.query('insert ignore into items values '+valuesSQL,[],function(err, result){
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
    //divide the data in parts of 200
    var start = 0;
    var splittedData = [];
    for(var i=1;i<=data.length;i++){
        if(i%200==0){
            splittedData.push(data.slice(start,i));
            start=i;
        }
    }
    splittedData.push(data.slice(start,data.length));

    var promises = splittedData.map(function(datum){
        return new Promise(function(resolve, reject){
            //Construct url
            var ids='';
            datum.forEach(function(entity){
               ids+=entity+',';
            });
            ids=ids.substr(0,ids.lastIndexOf(','));
            var url = 'https://api.guildwars2.com/v2/items?ids='+ids;
            https.get(url,function(response){
                var content='';
                response.on('data',function(data){
                    content+=data;
                });
                response.on('end',function(){
                    resolve(JSON.parse(content));
                });
            }).on('error',function(err){reject(err);});
        });
    });

    return Promise.all(promises);
}).then(
    function(resolve,reject){
        var connection = mysql.createConnection(mysqlconfig);
        connection.connect();


        resolve.forEach(function(resolution){
            resolution.forEach(function(item){
                /*
                var insId=(typeof(item.id)!='undefined')?item.id:'';
                var insName=(typeof(item.name)!='undefined')?item.id:'';
                var insIcon=(typeof(item.icon)!='undefined')?item.id:'';
                var insType=(typeof(item.type)!='undefined')?item.id:'';
                var insRarity=(typeof(item.rarity)!='undefined')?item.id:'';
                var insLevel=(typeof(item.level)!='undefined')?item.id:'';
                var insVendorValue=(typeof(item.vendor_value)!='undefined')?item.id:'';
                */
                connection.query("INSERT IGNORE INTO item_details\r\n"+
                "(`id`,`name`,`icon`,`type`,`rarity`,`level`,`vendor_value`,`json`)\r\n"+
                "VALUES\r\n"+
                "(?,?,?,?,?,?,?,?)",[item.id,item.name,item.icon,item.type,item.rarity,item.level,item.vendor_value,
                    JSON.stringify(item)],
                function(err,results){
                    // TODO Print values or something
                });
                console.log('item added: '+item.name);
            });
        });


    }
);

