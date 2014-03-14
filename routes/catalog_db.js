var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
	 path = require('path'),
	request = require('request'),
	redis = require('redis');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js');	

function CatalogDB(){

	function saveResource(name ,hash ,callback){
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
			
		var mul = redisClient.multi();
		//console.log('--------------------------------------------');
		for(var index in hash) {
			mul.hmset(name,index,hash[index],function(){})
			//console.log('save resource '.green, index, hash[index]);
		}		
		mul.exec(function (err, replies) {
		    if(err) console.log('save error '+err);
			else{
			    //console.log("save Resource ".green + replies.length + " replies");
			}
		});
		redisClient.quit();
		return callback(null,1);
	}   

	function checkDB(callback){
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
		redisClient.keys("res:*", function(err, keys) {
		   console.log('res key',keys.length);		   
		   redisClient.quit();
		   if(keys.length >0){
		      return callback(null, 1);
		   }else{
		      return callback(null, 0);   
		   }  
		});       
	}

	// "res:sensor:*"
	// "res:home:*"
	// "res:room:*"
	// "res:*"
	function flushDB(key,callback){
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
		// delete all keys 		
		redisClient.keys(key, function(err, keys) {
		    if(err) redisClient.quit();
			else{
				console.log('res key',keys.length);		   
				var mul = redisClient.multi();
				keys.forEach(function(key){
				   console.log('try to delete the key : '.red,key);
				   //redisClient.del(key, function(err) {console.log(err);});	
					mul.del(key);			   
				})
				mul.exec(function (err, replies) {
					console.log("delete ".green + replies.length + " replies");
					redisClient.quit();				
				});			   
		   }	   
		});        
        return callback(null, 0); 		
	}

    function flushALL(callback){
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
    
		// flush the database
	    redisClient.flushdb(function(err, key) {
		    redisClient.quit();
		});	
        	
        return callback(null, 0); 	
	}
		
	return {
        saveResource:saveResource,
        checkDB:checkDB,
        flushDB:flushDB,
        flushALL:flushALL		
	}
}

module.exports = new CatalogDB();