var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	ServiceCatalog = require('./serviceCatalog.js'),
	Service = require('./service.js');
	
// accessed by the admin

var ServiceBuilder = function(serviceCatalog) {

    this.catalog = serviceCatalog;
    
    if (ServiceBuilder.prototype._singletonInstance) {
             return ServiceBuilder.prototype._singletonInstance;
    }
    ServiceBuilder.prototype._singletonInstance = this;
	       				
	this.build = build;
    this.test = test;
	this.monitor = monitor;
	this.buildRTService = buildRTService;

	function build(serviceObj){
	    "use strict";
		if( Object.prototype.toString.call( serviceObj ) === '[object Array]' ) {
			if(this.catalog){
			    for(var i=0;i<serviceObj.length;i++)
		        this.catalog.addService(serviceObj[i]); 
		    }else{
		        winston.error('catalog do not exist');
		    }
        }
		
		else{
		    if(this.catalog){
		        this.catalog.addService(serviceObj); 
		    }else{
		        winston.error('catalog do not exist');
		    }		
		}
		
	}

	function test(serviceObj){
	    "use strict";		
	}
	
	function monitor(serviceObj){
	    "use strict";	
	}

    function buildRTService(name,mqttHandler){
	    
		mqttHandler = mqttHandler || new DefaultMQTTHandler();
		var catalog = this.catalog;
		if(catalog){
		    var service = catalog.findByName(name); 
			if(service.supportMQTT()){
			    
			    buildMQTT(service, new MQTTMonitor(catalog), mqttHandler,function(mqttService){
                     winston.info('listen to the MQTT service succfully   - '+name);
				    catalog.addRTService(name,mqttService);
				})
			}else{
			    winston.error('service do not support MQTT');
				delete mqttHandler;
			}
		}	
	    else{
		    winston.error('catalog have no real time service');
		    delete mqttHandler;
		}
	}
	
	
   function buildMQTT(service,monitor, handler, callback){
        var name = '/#';
        var mqttclient = mqtt.createClient(1883, service.getHost(),{username:"" ,password: service.getKey() });
		//mqttclient.options.reconnectPeriod = 0;
        monitor.setClient(mqttclient);
        // monitor.getClient();		
        mqttclient.on('connect', function onConnect(){
            winston.info('MQTT Connected'.green, '/'+service.getPattern()+name);
            mqttclient.subscribe('/'+service.getPattern()+name);
		    mqttclient.on('message', handler.handleMessage);
	    });	
	        mqttclient.on('disconnect', monitor.onConnect);
            mqttclient.on('close', monitor.onClose);
            mqttclient.on('error', monitor.onError);		

        var mqttService = new MQTTService(mqttclient,monitor,handler);
        callback(mqttService);		
    }		
};	


function MQTTService(mqttclient, monitor, handler){
    
	this.mqttclient = mqttclient;
	this.monitor =monitor;
	this.handler = handler;
	
	this.stopService = stopService;
	function stopService(){
	    if(mqttclient){
		    winston.info('mqtt client stop');
	        mqttclient.end();
		    delete mqttclient;
		}
		delete monitor;
		delete handler;
	}
}


function DefaultMQTTHandler(){
    
	this.handleMessage = handleMessage;

    function handleMessage(topic, message){
        console.log('default mqtt message'.green,  topic );	
	
	}
}

function MQTTMonitor(serviceCatalog){
    this.catalog = serviceCatalog;
	this.client;
		
	this.setClient = setClient;
	this.getClient = getClient;
	
	function setClient(client){
	    
	    this.client = client;
		console.log('set client  ');
		//this.client.end();
	}
	
	function getClient(){
	    console.log(this.client);
	    return this.client;
	}

	
	this.onDisconnect =onDisconnect;
	this.onClose = onClose;
	this.onError = onError;
	this.onConnect = onConnect;
	
    function onDisconnect(packet){
        winston.info('MQTT MONITOR disconnect!'+packet);	
		
	}
	
	function onClose(e){
        winston.info('MQTT MONITOR close!'+e);
		try{
		  //  problem class variables in the callback are always unidentified
          this.client.end();
        }catch(err){   // problem how to tell what type of error
		    winston.error(err.name + ": " + err.message);
		} 		
	}
	
	function onError(err){
        winston.error('MQTT MONITORerror!'+err);	
	
	}
	
	function onConnect(){
        winston.info('MQTT Connected'.green+ '/'+config.pattern);	
	
	}
}


module.exports = ServiceBuilder;