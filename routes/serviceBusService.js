// http://www.windowsazure.com/en-us/develop/nodejs/how-to-guides/service-bus-topics/?fb=zh-cn
// http://jbeckwith.com/2013/01/30/building-scalable-realtime-services-with-node-js-socket-io-and-windows-azure/
//http://davidmarquis.wordpress.com/2013/01/03/reliable-delivery-message-queues-with-redis/
//https://github.com/ServiceStack/ServiceStack/wiki/Single-page-apps
// cache data 
// if redis not available, cache in file system or something else
// use redis or rebbitmq
 
var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	redis= require('redis'),
	request = require('request'),
	amqp = require('amqp');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	ServiceCatalog = require('./serviceCatalog.js'),
	Service = require('./service.js');

var redis_ip= config.redis.host;  
var redis_port= config.redis.port; 
var redisClient, rabbitMqClient; 

var serviceRunning = false;


function startService(type){
	type = type || 'redis';
    
    if(type == 'redis'){
		try{
		    redisClient = redis.createClient(redis_port,redis_ip);
		    redisClient.on("error", function (err) {  
                winston.error("redis Error " + err.red,err); 
                serviceRunning = false;				
                return false;  
            });    

            redisClient.on('connect',function(err){
	            winston.info('start serviceBus service in redis');
				serviceRunning = true;
            })				
        }catch(e){
			winston.error('can not connect to redis server');
		}
    }else if(type == 'rabbitmq'){					
	    rabbitMqClient = amqp.createConnection({host: 'localhost'});
		rabbitMqClient.on('ready',onRabbitStart);
    }else{
		winston.error('do not support other services');
    }
}

function destoryService(){
    if(redisClient){
	    winston.info('destory the service bus ');
        redisClient.close();  
    }
}

function onRabbitStart(){
	winston.info('start serviceBus service in rabbitmq');
	serviceRunning = true;
    rabbitMqClient.queue('hello', {autoDelete: false}, function(queue){
        winston.debug(' [*] Waiting for messages. To exit press CTRL+C')
        queue.subscribe(function(msg){
            console.debug(" [x] Received %s", msg.data.toString('utf-8'));
        });
    });
			
    rabbitMqClient.queue('task_queue', {autoDelete: false,durable: true}, function(queue){                                                    
        queue.subscribe({ack: true, prefetchCount: 1}, function(msg){
                    var body = msg.data.toString('utf-8');
                    winston.debug("task queue1 [x] Received %s", body);
					queue.shift();
					/*
                    setTimeout(function(){
                       //console.log(" [x] Done");
                       queue.shift(); // basic_ack equivalent
                    }, (body.split('.').length - 1) * 1000);
					*/
                });
        });
			
	rabbitMqClient.queue('abc', {autoDelete: false,durable: true}, function(queue){                                    
        queue.bind('logs', '');
		queue.on('queueBindOk', function() { winston.debug('bind ok'); });
        queue.subscribe(function(msg){
            winston.debug("logs [x] %s"+ msg.data.toString('utf-8'));
        });			
    });			
			
};

// channel is the actually the 
function sendTopicMessage(channel,data, type){
    type = type || 'redis';
	if(type == 'redis'){
        if(redisClient){
		    //console.log('publish  channel  '.red,channel, data);
            redisClient.publish(channel,data);	
	    }else{
            winston.error('redis client are not available');	
	    }	
	}else if(type == 'rabbitmq'){
	
	
	}else{
	    winston.error('current do not support messaging');
	}

}

/*******************************************************************************
                    called by the APP layer   
********************************************************************************/
function cleanUpSubscriptions() {
    winston.debug('cleaning up subscriptions...');
    listSubscriptions(topicName, function (error, subs, response) {
        if (!error) {
            winston.debug('found ' + subs.length + ' subscriptions');
            for (var i = 0; i < subs.length; i++) {
                // if there are more than 100 messages on the subscription, assume the edge node is down 
                if (subs[i].MessageCount > 100) {
                    winston.debug('deleting subscription ' + subs[i].SubscriptionName);
                    deleteSubscription(topicName, subs[i].SubscriptionName, function (error, response) {
                        if (error) {
                            winston.error('error deleting subscription', error);
                        }
                    });
                }                
            }
        } else {
            winston.error('error getting topic subscriptions', error);
        }
        setTimeout(cleanUpSubscriptions, 60000);
    });
}

function listSubscription(topic,callback){
    // each topic is a set

}

function createSubscription(topic,appID,callback){
    // add appID to the topic set

}

function deleteSubscription(topic,appID,callback){
    // remove appID from the topic set

}
	

module.exports = {
    startService : startService,
	destoryService : destoryService,
    sendTopicMessage: sendTopicMessage,
	
	listSubscription :listSubscription,
	createSubscription : createSubscription,
	deleteSubscription : deleteSubscription
}	
	