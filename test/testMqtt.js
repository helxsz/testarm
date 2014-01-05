
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
	im = require('imagemagick'),
	redis= require('redis'),
	request = require('request');	
	
var 
    errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'); 
	
subscribe();

function subscribe(){
    console.log('subscribe');
    // mqtt://1bfc8d081f5b1eed8359a7517fdb054a:@geras.1248.io//enlight/Ballast0000291B/dolFinTemperature
    var mqttclient = mqtt.createClient(1883, "geras.1248.io",{username:'1bfc8d081f5b1eed8359a7517fdb054a' ,password: "" });
    //mqttclient.options.reconnectPeriod = 0; 
    mqttclient.on('connect', function(){
        console.log('MQTT Connected'.green, config.key, config.pattern);
	    mqttclient.subscribe('/enlight/Ballast0000291B/light');
    });

    mqttclient.on('message', function (topic, message) {
        console.log('mqtt message'.green,  message, "    ",new Date());
    });
	
	        mqttclient.on('disconnect', onConnect);
            mqttclient.on('close', onClose);
            mqttclient.on('error', onError);	
}

    function onDisconnect(packet){
        winston.info('MQTT MONITOR disconnect!'+packet);	
		
	}
	
	function onClose(packet){
        winston.info('MQTT MONITOR close!'+packet);	
	}
	
	function onError(err){
        winston.error('MQTT MONITORerror!'+err);	
	
	}
	
	function onConnect(){
        winston.info('MQTT Connected'.green+ '/'+config.pattern);	
	
	}

//subscribeToMQTT(armhome,handleHomeData);
//subscribeToMQTT(armmeeting,handleMeetingMotionData);
//subscribeToMQTT(enlight,handleLightingData);  //,'/Ballast0000291B/light'
function subscribeToMQTT(config,handleCallback,name){
    name = name || '/#';
    var mqttclient = mqtt.createClient(1883, "geras.1248.io",{username:"" ,password: config.key, keepalive: 10000 });
  
    mqttclient.on('connect', function(){
        console.log('MQTT Connected'.green, '/'+config.pattern+name);
	    mqttclient.subscribe('/'+config.pattern+name);
    });

    mqttclient.on('message', handleCallback);
	
	mqttclient.on('disconnect', function(packet) {
        console.log('disconnect!',packet);
    });

    mqttclient.on('close', function(packet) {
        console.log('close!',packet);
	});

    mqttclient.on('error', function(err) {
        console.log('error!',err);
    });
}


function handleHomeData(topic, message) {
        //console.log('mqtt message'.green,  message, "    " );
		var data = JSON.parse(message);
		var msg = data.e[0];  
		var url = msg.n, value = msg.v, time = msg.t;
		console.log(url,value);
		// stream to interoperbility layer
		
		// stream directly to app
		io.sockets.emit('mqtt',{'payload' : data});		
}

function handleLightingData(topic, message) {
        //console.log('mqtt message'.green,  message, "    " );
		var data = JSON.parse(message);
		var msg = data.e[0];  
		var url = msg.n, value = msg.v, time = msg.t;
		console.log(url,value);
		// stream to interoperbility layer
		
		// stream directly to app
		io.sockets.emit('mqtt',{'payload' : data});		
}


function handleMeetingMotionData(topic, message) {
        //console.log('mqtt message'.green,  message, "    " );
		var raw = JSON.parse(message);
		var msg = raw.e[0];  
		var url = msg.n, value = msg.v, time = msg.t;
		//console.log(url,value);
		// stream to interoperbility layer
		var array = url.split('/');
		//console.log(array[0],array[1],array[2],array[3],array[4],array[5]);
		var roomID = array[2], sensorID = array[4], sensorType = array[5];
		console.log(roomID, sensorID, sensorType, value);
		// stream directly to app
		io.sockets.emit('info',{room:roomID,sensor:sensorID,type:sensorType, value:value});
		//io.sockets.emit('raw',{'payload' : raw});		
}

