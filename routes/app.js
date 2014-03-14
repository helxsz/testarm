var async = require('async'),
     fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
    mqtt = require('mqtt'),
	socket = require('socket.io'),
	redis= require('redis'),
	request = require('request');
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	catalog = require('./serviceCatalog.js'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js');	
	
var App = function(id,description, messageCallback) {	

        this.id = id;
		this.description = description || 'default description';
		this.callback = messageCallback  || onDefaultMessage;
		init();
		
		this.services={};
		var redisClient; 
		
        this.getServiceList = getServiceList;
		this.subscribeService = subscribeService;
		this.unsubscribeService = unsubscribeService;
		
		this.update = update;
		this.add = add;
        this.remove = remove;

        function remove(){
		    if(redisClient){
			    redisClient.quit();
			}
		}

        function add(){
		
		    
		}

        function update(){
		    
		}		
        
		
		function init(type){
            type = type || 'redis';
            var redis_ip= config.redis.host;  
            var redis_port= config.redis.port; 
            redisClient = redis.createClient(redis_port,redis_ip); 
            /*
            redisClient.auth(config.opt.redis_auth, function(result) {
	            console.log("Redis authenticated.");  
            })
            */ 
            redisClient.on("error", function (err) {  
                winston.error("redis Error " + err.red,err);  
                return false;  
            });    

            redisClient.on('connect',function(err){
	            winston.info('App has subscribe to the channel success');
            })
	  
            redisClient.on('pmessage', messageCallback  );	  // this.callback   onDefaultMessage  messageCallback
        }		
		
		function getServiceList(callback){
		    return callback(null);
		}
		
        // onMessageCallback,
		function subscribeService(name,callback){
		    this.services[name] = name;
			//redisClient.on('pmessage', onMessageCallback);
		    redisClient.psubscribe(name);
            	
		    return callback(null,'success');
		}
		
		function unsubscribeService(name,callback){
		    this.services[name] = null;
			redisClient.punsubscribe(name);
		    return callback(null,'success');
		}	

        function filterCatalog(url,callback){
		
		
		}
		
        
		function onDefaultMessage(pattern, channel, message){	    
	        //winston.debug('message to the app  '+  pattern+"   "+channel+"    " );
			try{
		        var raw = JSON.parse(message);
		        var msg = raw.e[0];  
		        var url = msg.n, value = msg.v, time = msg.t;
		        //console.log(url,value);
		        // stream to interoperbility layer
		        var array = url.split('/');
		        //console.log(array[0],array[1],array[2],array[3],array[4],array[5]);
		        var roomID = array[2], sensorID = array[4], sensorType = array[5];
		        winston.debug(roomID+" "+ sensorID+"  "+ sensorType+"  "+ value);
			    // stream directly to app
			   
			}catch(e){
			   
			}
        }
		
		//////////////////////////////////////////////////////////////////////////
		var notiClient;
		this.subscribeCatalogNotification = subscribeCatalogNotification;
		this.unsubscribeCatalogNotification = unsubscribeCatalogNotification;
		
		function subscribeCatalogNotification(name,notificationCallback){
		    console.log('subscribeCatalogNotification   '.red);
            var redis_ip= config.redis.host;  
            var redis_port= config.redis.port;
            if(!notiClient){			
				notiClient = redis.createClient(redis_port,redis_ip); 
				/*
				redisClient.auth(config.opt.redis_auth, function(result) {
					console.log("Redis authenticated.");  
				})
				*/ 
				notiClient.psubscribe(name);
				notiClient.on("error", function (err) {  
					winston.error("redis Error " + err.red,err);  
					return false;  
				});    

				notiClient.on('connect',function(err){
					winston.info('App has subscribe to the catalog notification  success'.red);
				})
		  
				notiClient.on('pmessage', notificationCallback  );	  // this.callback   onDefaultMessage  messageCallback		
		    }
		}

        function unsubscribeCatalogNotification(name){
		    if(notiClient){
		        notiClient.punsubscribe(name);
			    notiClient.end();
			}	
		}
		
		
}

module.exports = App;