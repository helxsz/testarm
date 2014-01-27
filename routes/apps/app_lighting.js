var app = require('../../app').app;  

var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda');	
	
var errors = require('../../utils/errors'),
	config = require('../../conf/config'),
	serviceCatalog = require('../serviceCatalog.js'),
	winston = require('../../utils/logging.js'),
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js');


var enlightService = serviceCatalog.findByName('enlight');  // enlight
//serviceCatalog.removeRTService('enlight');
   
   
appBuilder.createApp('enlight',new EnlightingMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created enlight '+app.id);  // 
	app.subscribeService('enlight',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success  enlight  '.green);
	})
});

function EnlightingMQTTHandler(){  
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
            //winston.debug("EnlightingMQTTHandler handle message  "+url+"   "+value+"   "+time);		   
		}catch(e){
			winston.debug('some thing wrong   ......'.red+e);   
		}
    }		
}	