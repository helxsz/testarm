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
	winston = require('../../utils/logging.js'),
	serviceCatalog = require('../serviceCatalog.js'),	
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	SensMLHandler = require('../senMLHandler.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js');

var enlightService = serviceCatalog.findByName('intellisense');  // enlight

appBuilder.createApp('intellisense',new EnergyMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created    intellisense   '+app.id);  // 
	app.subscribeService('intellisense',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success intellisense   '.green);
	})
});

function EnergyMQTTHandler(){
    
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
		    // stream to interoperbility layer
            console.log("EnlightingMQTTHandler handle message  "+url+"   "+value+"   "+time);		   
            		   
		}catch(e){
			console.log('some thing wrong   ......'.red+e);   
		}
    }		
}

////////////////////////////////////////////////////////////////////