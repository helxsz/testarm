var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	socket = require('socket.io'),
	request = require('request'),
	redis= require('redis');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js');

var io = socket.listen(3000 
    /*,
	{ logger: {
        debug: winston.debug, 
        info: winston.info, 
        error: winston.error, 
        warn: winston.warn
    }
   }*/
);
io.configure(function () {
        winston.info('web socket io configure'.green);   
      	io.set('log level', 1);
	    //setStore(io);	
	    io.enable('browser client minification');  // send minified client
        io.enable('browser client etag');          // apply etag caching logic based on version number
        io.enable('browser client gzip'); 
	    io.set('heartbeat interval', 45);
    	io.set('heartbeat timeout', 120); 
    	io.set('polling duration', 20);
	
        io.set('close timeout', 60*60*24); // 24h time out
    	io.set('transports', [
            'websocket', 'xhr-polling'
            //'xhr-polling' // for benchmarking
       ]);	
});
io.sockets.on('connection', function (socket) {
    console.log('socket connected');
	socket.emit('connect');
	     
    socket.on('subscribe', function (data) {
        console.log('subscribe  to  ----------------------------'.green,data);
		var room = data.room;
		var rooms = room.split(',');
		    getMotion(rooms,function(err,room_info_list){
			    //console.log('aaaa',room_info_list);
				//
				var room_info_list = _.filter(room_info_list, function(room){ 
				    if(  _.isNull(room))
					return false;
					else{
				     var update = new Date(room.time);
					 return (new Date().getTime() - update.getTime()) < 10000;
                    }  					 
			    });

                console.log('give the socket the active list ',room_info_list);				
				socket.emit('room_status',room_info_list);
				
			})		
        
    });
});


function getMotion( names,callback ){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('find Resource eInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	

	var mul = redisClient.multi();
    names.forEach(function(name){
	    console.log('get motion ',name);
		//mul.hmget(name, 'displayname');
        mul.hgetall(name);		
	})

	mul.exec(function (err, data) {
	    redisClient.quit();
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}		
    });	
}

module.exports = io;