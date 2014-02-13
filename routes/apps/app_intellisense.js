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

// catalog  https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2F5.79.20.223%3A3000%2Fcat%2FARM6&traverseKey=d01fe91e8e249618d6c26d255f2a9d42&Submit=Browse
// 
var intellisense = serviceCatalog.findByName('intellisense');  // intellisense

// https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1/inlet_pressure
//  
var systems = {
    'cooling system':[
	    {'device': {url:'https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1'}, 'system':'Cooling System', 'type':'pump' },
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_2'}, 'system':'Cooling System', 'type':'pump' }
		// inlet_pressure  discharge_pressure	 power current  voltage  power_factor
	],
	'heating system':[
	    {'device': {url:'https://5.79.20.223:3000/cat/ARM6/Heating_System/Hot_Water_Pump_1'}, 'system':'Heating System', 'type':'pump' },
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Heating_System/Hot_Water_Pump_2'}, 'system':'Heating System', 'type':'pump' }	
		// inlet_pressure  discharge_pressure	 power current  voltage  power_factor
	],
	'air handling system':[ 
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_2'}, 'system':'"Air Handling Unit', 'type':'Air Handling Unit' },
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_3'}, 'system':'"Air Handling Unit', 'type':'Air Handling Unit' },
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_4'}, 'system':'"Air Handling Unit', 'type':'Air Handling Unit' },
		{'device': {url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_7'}, 'system':'"Air Handling Unit', 'type':'Air Handling Unit' }
		 // power  current  voltage  power_factor	
	]
}

// http://localhost/arm/hvac/test
app.get('/arm/hvac/test',function(req, res, next){
    // var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
    var now = new Date(), 
	    default_start_day = new Date(2014,0,28);//new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day =   new Date(2014,1,5);//new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	console.log('/arm/hvac/test    ',day_begin,day_end );
    intellisense.getResourceData('https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1/inlet_pressure',range,function(err,data){
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