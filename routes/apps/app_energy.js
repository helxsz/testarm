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

app.get('/buildings/arm/floor',function(req,res,next){
    var buildings = [
    { 'name': 'ARM1', 
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
	  "floors":[]
	},
    {'name': 'ARM1',
     "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
	  "floors":[]
	},
    {'name': 'ARM5',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
	  "floors":[]
	},
    {'name': 'ARM6',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
	}
    ];
	
	res.send(200, buildings);
})

app.get('/sensors/arm/',function(req,res,next){
    var sensors = [
       {'name': 'aaa' , 'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[396,526], 'room':'abc'},
	   {'name': 'bbb',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[419,552], 'room':'bcd'},
	   {'name': 'ccc' , 'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[396,526], 'room':'abc'},
	   {'name': 'ddd',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[369,521], 'room':'bcd'},
	   {'name': 'eee',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[311,477], 'room':'bcd'},
	   {'name': 'fff',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[339,500], 'room':'bcd'},
	   {'name': 'ggg',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[358,585], 'room':'bcd'},
	   {'name': 'zzz',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[358,585], 'room':'bcd'},
    ];
        
    res.send(200,{sensors:sensors});
})