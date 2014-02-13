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

//https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Farmhome&traverseKey=924a7d4dbfab38c964f5545fd6186559&Submit=Browse
var armhome = serviceCatalog.findByName('armhome');  // armhome

// http://localhost/arm/home/test
// https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23/energy
app.get('/arm/home/test',function(req, res, next){
    // var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	console.log(req.query.start,req.query.end);
	var day_begin , day_end;
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	console.log('/arm/home/test   ',day_begin,day_end);
    armhome.getResourceData('https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23/energy',range,function(err,data){
	    if(err) res.send(500);
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
		    res.send(s);
		}	
	})
	
})




appBuilder.createApp('armhome',new ArmhomeMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created enlight '+app.id);  // 
	app.subscribeService('enlight',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success  enlight  '.green);
	})
});

function ArmhomeMQTTHandler(){  
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
            //winston.debug("ArmhomeMQTTHandler handle message  "+url+"   "+value+"   "+time);		   
		}catch(e){
			winston.debug('some thing wrong   ......'.red+e);   
		}
    }		
}