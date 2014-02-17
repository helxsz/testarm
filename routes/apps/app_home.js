var app = require('../../app').app;  
 
var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto'),	
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
	simulation = require('../simulation.js'),
	energyRank = require('../energyRank.js');

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



var devices = [
  {'url':'https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23'},  //  	
  {'url':'https://geras.1248.io/series/armhome/10/MeterReader/00-0D-6F-00-00-C1-4B-7B'},
  {'url':'https://geras.1248.io/series/armhome/11/MeterReader/00-0D-6F-00-00-C2-CE-83'},
  {'url':'https://geras.1248.io/series/armhome/12/MeterReader/00-0D-6F-00-00-C2-8A-92'},
  {'url':'https://geras.1248.io/series/armhome/13/MeterReader/00-0D-6F-00-00-82-AD-19'},
  {'url':'https://geras.1248.io/series/armhome/14/MeterReader/00-0D-6F-00-00-F2-70-B9'},
  {'url':'https://geras.1248.io/series/armhome/15/MeterReader/00-0D-6F-00-00-F2-72-48'},
  {'url':'https://geras.1248.io/series/armhome/16/MeterReader/00-0D-6F-00-00-C1-33-B0'},
  {'url':'https://geras.1248.io/series/armhome/17/MeterReader/00-0D-6F-00-00-C1-2D-CD'},
  {'url':'https://geras.1248.io/series/armhome/18/MeterReader/00-0D-6F-00-00-F2-70-BD'},
  {'url':'https://geras.1248.io/series/armhome/19/MeterReader/00-0D-6F-00-00-82-B7-FA'},  
  {'url':'https://geras.1248.io/series/armhome/2/MeterReader/00-0D-6F-00-00-C1-2C-C0'}
]


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
            var attrs = url.split('/'); var property = attrs[attrs.length-1];
			var parent_url = url.substring(0, url.indexOf(property)-1);
			
			if(property == 'online'){   
			    console.log(' check online property of device  '.red,parent_url, value, time);
			}else{
			
            }			
		}catch(e){
			winston.debug('some thing wrong   ......'.red+e);   
		}
    }
}

function getEnergyMeter(callback){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
	
	var redisClient;	
	try{ 
		redisClient = redis.createClient(redis_port,redis_ip);
	}
	catch (error){
		console.log('get home by building  error' + error);
		redisClient.quit();
		return callback(error,null);
	}	
	var list = [];
	redisClient.keys("res:home:*", function(err, keys) {
		//console.log('res key home',keys.length);		
		var mul = redisClient.multi();
		keys.forEach(function(key){		
		   mul.hmget( key , 'energy','online');
		})		           		
		mul.exec(function (err, replies) {
			for(var i=0;i<replies.length;i++){
				 if(replies[i][0] != null)					
				 list.push({'energy':replies[i][0], 'online':replies[i][1]});                        						 
			}					
			callback(null,list);
		});					
		redisClient.quit();
	}); 
}



//console.log('alert home test');
app.get('/alert/home/test',function(req,res,next){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,0,0,0)
	    default_end_day =   new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,23,59,59);
	
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
 
	getEnergyMeter(function(err, data){	
        if(err) res.send(500);
        else if(!data) {res.send(404);}
        else if(data){
		    //console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    array.push(obj.energy);
			})
			queryDataForDay(array,day_begin, day_end,function(err,data){
				if(err){ res.send(500);}
				else if(!data){res.send(404);}
				else if(data){
					res.send(data);
				}
			});		    
		}		
	})
})

app.get('/alert/home/test2',function(req,res,next){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,0,0,0)
	    default_end_day =   new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,23,59,59);
	
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	getEnergyMeter(function(err, data){	
        if(err) res.send(500);
        else if(!data) {res.send(404);}
        else if(data){
		    //console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    array.push(obj.energy);
			})
			queryDataForDay2(array,day_begin, day_end,function(err,data){
				if(err){ res.send(500);}
				else if(!data){res.send(404);}
				else if(data){
					res.send(data);
				}
			});		    
		}		
	})
})



function queryDataForDay(array, day_begin,day_end, callback){
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1h&rollup=avg';
	var s = [];	
	async.forEach(array, function(device, callback){
		//console.log('start .....'.red,device);
		//armhome.getResourceData(device.url+'/energy',range,function(err,data){
		armhome.getResourceData(device,range,function(err,data){
			if(err){   }
			else if(!data) {}  
			else if(data) {														
				var e = data.e;
                if(e.length>0){
				    console.log( 'what the fuck  '.red,device,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow(), (e[e.length-1].v - e[0].v)/3600000 );				
                    var datapoints = [];
					e.forEach(function(data){
						delete data.n;
						datapoints.push({t:new Date(data.t*1000),v:data.v});
						//console.log(  moment(data.t*1000 ).fromNow(), new Date(data.t*1000) );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
					})				    
					
					// value == energy consumption of one day, rank of the day
					energyRank.storeDayAnalytics(device,{value:e[e.length-1].v - e[0].v, rank:1}, day_begin);
					
					s.push({url:device,  energy: e[e.length-1].v - e[0].v ,   timeline:datapoints});
				}
                else{
                    e.push({url:device, energy:0}  );
                }				
			}
            callback();			
		})					
	},function(err, results){
		console.log('crawler  finished  .....  '.green, results);
        if(err){
		    callback(err,null);
		}else{
		    callback(null,s);
		}		
	});
}


function queryDataForDay2(array, day_begin,day_end, callback){
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1h&rollup=avg';
	var s = [];	
    energyRank.getDayAnalytics(array, day_begin,function(err,data){
	    if(err) callback(err,null);
	    else callback(null,data);
	});
}


function visitHistory(beginDate){

	getEnergyMeter(function(err, data){	
        if(err) {}
        else if(!data) {}
        else if(data){
		    //console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    array.push(obj.energy);
			})
			       
			async.whilst(function () {
			  return beginDate.getTime() < new Date();
			},
			function (next) {
                queryDataForDay(array,beginDate, new Date(beginDate.getTime() + (24 * 60 * 60 * 1000)),function(err,data){
					if(err){ }
					else if(!data){}
					else if(data){
						
					}					
					beginDate.setTime(beginDate.getTime() + (24 * 60 * 60 * 1000));
					next();
				});			
			},
			function (err) {
			    // All things are done!
			    console.log('all things are done');
			});			
			 
		}		
	})

}
