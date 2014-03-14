var app = require('../../app').app;  

var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda'),
	_ = require('underscore');	

// base64 http://jsfiddle.net/peterbenoit/UA9ET/
	
var errors = require('../../utils/errors'),
	config = require('../../conf/config'),
	serviceCatalog = require('../serviceCatalog.js'),
	winston = require('../../utils/logging.js'),
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js');

// catalog  https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2F5.79.20.223%3A3000%2Fcat%2FARM6&traverseKey=d01fe91e8e249618d6c26d255f2a9d42&Submit=Browse
// http://www.greywyvern.com/code/php/binary2base64
var intellisense;
serviceCatalog.findByURL('http://5.79.20.223:4001/cat/ARM6',function(err,data){
    if(err || !data){
	    console.log('intellisense catalog can not be found ',err);
	}else {
	    //console.log('find the service catalog '.green,data);
        enlightService = data; 		
	}    
});

// https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1/inlet_pressure
//  

var systems = [
	    {url:'https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1', 'system':'Cooling System', 'type':'pump','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_2', 'system':'Cooling System', 'type':'pump','month':[] },
	    {url:'https://5.79.20.223:3000/cat/ARM6/Heating_System/Hot_Water_Pump_1', 'system':'Heating System', 'type':'pump','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Heating_System/Hot_Water_Pump_2', 'system':'Heating System', 'type':'pump','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_2', 'system':'"Air Handling Unit', 'type':'Air Handling Unit','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_3', 'system':'"Air Handling Unit', 'type':'Air Handling Unit','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_4', 'system':'"Air Handling Unit', 'type':'Air Handling Unit','month':[] },
		{url:'https://5.79.20.223:3000/cat/ARM6/Air_Handling_Unit/Air_Handling_Unit_7', 'system':'"Air Handling Unit', 'type':'Air Handling Unit','month':[] }
]

// http://localhost/arm/hvac/test
app.get('/arm/hvac/test',function(req, res, next){
    // var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
	getDataByMonth(systems[0].url,'power',2014,0,function(){
        res.send(200);

    })
	
/*	
    var now = new Date(), 
	    default_start_day = new Date(2014,0,0);//new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day =   new Date(2014,0,31);//new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	console.log('/arm/hvac/test',day_begin,day_end );
    intellisense.getResourceData('https://5.79.20.223:3000/cat/ARM6/Cooling_System/Chilled_Water_Pump_1/power',range,function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(404);
		else if(data) {
		    var s = [];
            console.log('data   ------------------'.green,data.e.length);
			var time = [];										
			var e = data.e;

			var groupHour = _.groupBy(e,function(data){
			    var t = new Date(data.t*1000);
			    console.log('date   ',t);
				return t.getMonth()+','+t.getDate()+','+t.getHours();
			})
			
			var i = 0;
			_.map(groupHour,function(hour,key){			    
				var sum =0;
				for(var i=0;i<hour.length;i++){
				    sum +=hour[i].v;
				}
				console.log(hour.length, Math.floor(sum/hour.length/1000*10)/10,  key );
			})			
			
			if(e.length>0)
			console.log( 'what the fuck  '.red,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow() );
                          							
			s.push({e:data.e, 'time':time});			
		    res.send(s);
		}	
	})
	*/
			/*
			e.forEach(function(data){
				//console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				time.push( moment(data.t*1000 ).fromNow() );
			})
			*/	
})

function getNumberOfDays(year, month) {
    var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
    return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

function getDataByMonth(id,attribute, year, month, callback){
    var start_day = new Date(year,month,0);
	    end_day =   new Date(year,month,getNumberOfDays(year,month));
	console.log(' getDataByMonth    '.red,start_day, end_day);	
    getDataByDate(id,attribute,start_day,end_day,callback);
}

function getDataByDate(id, attribute, day_begin, day_end,callback){
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	console.log('/arm/hvac/test'.red,day_begin,day_end ,id+'/'+attribute);

    intellisense.getResourceData(id+'/'+attribute,range,function(err,data){
	    if(err) { callback(err,null);}
		else if(!data) {callback(null,[]);}
		else if(data) {
			var e = data.e;
			var groupHour = _.groupBy(e,function(data){
			    var t = new Date(data.t*1000);
				return t.getMonth()+','+t.getDate()+','+t.getHours();
			})
			
			_.map(groupHour,function(hour,key){			    
				var sum =0;
				for(var i=0;i<hour.length;i++){
				    sum +=hour[i].v;
				}
				console.log(hour.length, key ,  Math.floor(sum/hour.length/1000*10)/10);
			})
			if(e.length>0)
			console.log( 'what the fuck  '.red,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow() );               			
		}
	})
}

function getEnergyconsumption(){
    

}


app.get('arm/building/arm6/energy',function(){
   

})

/*
function EnergyModel(){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
	
	function saveImgReferenceIntoGroup(system ,id ,callback){
		var redisClient;
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			redisClient.quit();
			return callback(error,null);
		}	
		var time = new Date().getTime();
		redisClient.zadd('energy:'+system+':'+,time,JSON.stringify({'img':img_id,'time':time}));
		redisClient.incrby('energy:'+system+':'+':count',1);
		redisClient.quit();
		return callback(null,1);
    }
	
	function getDataFrom(){
		var redisClient;
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			redisClient.quit();
			return callback(error,null);
		}
		var time = new Date().getTime();
		redisClient.zadd('energy:'+system+':'+,time,JSON.stringify({'img':img_id,'time':time}));
		redisClient.incrby('energy:'+system+':'+':count',1);
		redisClient.quit();        	    
	}	
}
*/