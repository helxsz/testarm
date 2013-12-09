var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	redis= require('redis'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	serviceBus = require('./serviceBusService.js');

  	
function handleMessage(topic, message){
	try{
	    var data = JSON.parse(message);
	    var msg = data.e[0];  
	    var url = msg.n, value = msg.v, time = msg.t;
	    //winston.debug(url,value);
		//winston.debug(topic);
		topic = topic.split('/')[1];
		
	    serviceBus.sendTopicMessage(topic,message);
    }catch(err){
	    winston.error("exception in processing received message " + err);
	}			
}


exports.handleMessage = handleMessage;	
	