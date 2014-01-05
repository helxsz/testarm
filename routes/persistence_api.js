var app = require('../app').app;

var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	ServiceCatalog = require('./serviceCatalog.js'),ServiceBuilder = require('./serviceBuilder.js'),serviceBus = require('./serviceBusService.js'),
	AppBuilder = require('./AppBuilder.js');
	SensMLHandler = require('./senMLHandler.js');
	
	
function clearResourceList2(name,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceIntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers(name).exec(function (err, replies) {
		console.log('services     '.green +  replies+"  ");
    });
	redisClient.quit();  
	return callback(null,1);
}

function getCountOnResource(name,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log(' getCountOnResource  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers(name).exec(function (err, replies) {
		console.log('services     '.green +  replies+"  ");
    });
	redisClient.quit();  
	return callback(null,1);  

}

function getResourceList2(name,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('get ResourceList Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.smembers(name,function(err, members){
        if( !members ){
            members = [];
        }
        callback(null,members);    
    });
	redisClient.quit();  	
}

function saveResourceList2(name ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }		
    
	redisClient.sadd(name,item);redisClient.incrby(name+':count',1);
	
	redisClient.quit();
	return callback(null,1);
}

function saveResourceListInBulk2(name ,items ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }		
    var mul = redisClient.multi();
    for(var i=0;i<items.length;i++){
	   mul.sadd(name,items[i].href)
		 .incrby(name+':count',1);
	}
	mul.exec(function (err, replies) {
            console.log("save Resource List2 " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                //console.log("Reply " + index + ": " + reply.toString());
            });
    });		
	redisClient.quit();
	return callback(null,1);
}
/****  attributes = entity+reference+value   for example, room:building:BOX *****/
function savePropertyGroup(attribute ,entity_key ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }		
	redisClient.sadd(attribute,entity_key);
	redisClient.incrby(attribute+':count',1);	
	redisClient.quit();
	return callback(null,1);
}

/***  only for the events ***/

function addEventsForRoom(name,items ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        //winston.debug('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	

	// use the zadd
    var mul = redisClient.multi();
    for(var i=0;i<items.length;i++){
	   mul.zadd(name,items[i].start,JSON.stringify({'item':items[i]}));
	}
	
	mul.exec(function (err, replies) {
            //winston.debug("pushToListInBulk  " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                //winston.debug("Reply " + index + ": " + reply.toString());
            });
    });		
	redisClient.quit();
	return callback(null,1);
}

function getEventFromHome(name ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	

	
	redisClient.lrange(name, 0,-1,function(err, data){
	    redisClient.quit();
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});	
	redisClient.quit();
	return callback(null,1);
}

/*******                                            ***********/

 
 
function findResource2(name ,item ,callback){
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
	

	redisClient.hmget(name, item,function(err, data){
	    redisClient.quit();
		//data.url = name;
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});

	redisClient.quit();
	//return callback(null,1);
}



function saveResourceInBulk2(name ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port;	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
		
	var mul = redisClient.multi();
    for(var index in item) {
		mul.hmset(name,index,item[index],function(){})
    }		
	mul.exec(function (err, replies) {
        console.log("save Resource ".green + replies.length + " replies");
    });
	redisClient.quit();
	return callback(null,1);
}


/*******************************************
  clear the database
********************************************/
function clearResource(){
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 
    var redisClient;
        try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
    redisClient.flushdb(function(){});
}


exports.clearResource = clearResource;
exports.saveResourceInBulk2 = saveResourceInBulk2;
exports.findResource2 = findResource2;
exports.getEventFromHome = getEventFromHome;
exports.addEventsForRoom = addEventsForRoom;
exports.savePropertyGroup = savePropertyGroup;
exports.saveResourceListInBulk2 = saveResourceListInBulk2;
exports.saveResourceList2 = saveResourceList2;
exports.clearResourceList2 = clearResourceList2;
exports.getResourceList2 = getResourceList2
