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


var enlightService; 
serviceCatalog.findByURL('https://geras.1248.io/cat/enlight',function(err,data){
    if(err || !data){
	    console.log('enlight catalog can not be found ',err);
	}else {
	    //console.log('find the service catalog '.green,data);
        enlightService = data; 		
	}    
});   // enlight

// ballastTemperature	dolFinTemperature   lampPower  light   mainsVoltage  psuCurrent   psuVoltage

// http://localhost/light/home/test
app.get('/arm/light/test',function(req, res, next){
    // var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
		
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	console.log('/arm/light/test    ',day_begin,day_end );
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	
    enlightService.getResourceData('https://geras.1248.io/series/enlight/Ballast00002898/ballastTemperature',range,function(err,data){
	    if(err) { res.send(500); console.log(err);}
		else if(!data) res.send(404);
		else if(data) {
		    var s = [];
            console.log('data   ------------------'.green,data.e.length);
			var time = [];										
			var e = data.e;
			e.forEach(function(data){
				//console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				time.push( moment(data.t*1000 ).fromNow() );
			})
			if(e.length>0)
			console.log( 'what the fuck  '.red,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow() );
                          							
			s.push({e:data.e, 'time':time});			
		    res.send(200,s);
		}	
	})
	
})


//serviceCatalog.removeRTService('enlight');

/*
app.get('/catalog',function(req,res,next){   
    var type = req.query.type;
    var enlightService = serviceCatalog.findByName(type);
    try{
        enlightService.fetchResourceList(function(err,data){
	            if(err) {  winston.error(err.name + ": " + err.message);  res.send(404,err);}
	            else res.json(200,data);			
		});		
    }catch(e){  
		winston.error('service not found'); 
		res.send(404);
	}
})

// http://localhost/catalog/tag?type=enlight&url=enlight/Ballast00002897
// http://localhost/catalog/tag?type=armmeeting&url=armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF	   
app.get('/catalog/tag',function(req,res,next){   
    var type = req.query.type, url = req.query.url;
    var enlightService = serviceCatalog.findByName(type);
	
    try{
        enlightService.getResourceTag(url,function(err,data){
	            if(err) {  winston.error(err.name + ": " + err.message);  res.send(404,err);}
	            else res.json(200,data);			
		});		
    }catch(e){  
		winston.error('service not found'); 
		res.send(404);
	}
}) 
*/   
   
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

