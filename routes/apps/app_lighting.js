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
	simulation = require('../simulation.js'),
	catalogModel = require('../../model/catalog_model.js'),
	catalogFilter = require('../catalog_filter.js'),
	appModel = require('../../model/app_model.js'),
	catalogDB = require('../catalog_db.js');

appModel.searchApp('enlight',function(err,data){
    if(err)  console.log('app not found with err'.red,err);
	else if(!data){
    	console.log('app not found '.red);
		appModel.createApp({name:'enlight'},function(){
			console.log('created enlight app');
		})		
	}else if(data){
	
		appModel.searchCatalogProfiles('enlight','sensor',function(err,catalogs){
		    console.log('??????????????????????? catalog app'.yellow,catalogs);
			if(catalogs && catalogs.length>0){
                appModel.findAppCatalogsByProfile('meetingapp','room',function(err,data){
                //catalogModel.searchCatalogResource(catalogs[0].url,'https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBox',function(err,data){
					if(err) { console.log('getCatalogResoures   ---  get local catalog data '.red); }
					else if(!data){  console.log(' no catalogs found');  }
					else{
						console.log('find englight catalog '.yellow,data.length);
					}
				})
			}
		})
	}
})	

var filter = new catalogFilter();
appBuilder.createApp('enlight',new EnlightingMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created enlight '+app.id);  // 
	app.subscribeService('enlight',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success  enlight  '.green);
	})
	
	app.subscribeCatalogNotification('catalog',function(pattern,channel,message){
		console.log('enlight app receive catalog notification   '.yellow, message);			
		try{
			var catalogs = JSON.parse(message);
			async.forEach(catalogs, function(catalog,callback){
				//console.log(catalog ); 
				checkCatalogUpdate(catalog);
				callback();
			},function(err){
				console.log('');
			});
		}catch(e){
			console.log(' message   pattern   error  '.red,e);
		} 				
	})	
});


function checkCatalogUpdate(catalog){
	//console.log('subscribeCatalogNotification   '.green,catalog.url, catalog.profile, catalog.types);
	if(catalog.profile == 'sensor' && catalog.url =='https://geras.1248.io/cat/enlight' ){  	
		catalogModel.getCatalogResoures(catalog.url,function(err,data){
			if(err) console.log('catalog facts  store error '.red,catalog.url, err);
			else if(!data){console.log('no data in the catalog ');}
			else if(data){
			    appModel.updateAppCatalog('enlight',{'url':catalog.url,key:catalog.key,'profile':catalog.profile},function(err,data){
			           console.log('update ',data);
		        })						
				 console.log('-------------------------------------------',data.url,data.res.length);
				 async.forEach(data.res, function(obj,callback){
					catalogDB.saveResource('res:enlight:'+obj.url, obj,function(){callback();});
				 })
			}
		})
	}
}

var model = new LightSensorModel();
function LightSensorModel(){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
		
	function updateLightAndTemperature(name,temperature,light,callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('updateMotion  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	
		
		redisClient.hmset(name, 'temperature',temperature, 'light',light,function(err, data){
			redisClient.quit();
			if(err) {return callback(err,null);}
			else if(data) { return callback(null,data);}
			else { return callback(null,null);}	
		});

		redisClient.quit();
	}

	function getLightSensorData( items, callback ){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('getSensorData  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	
        
		items = _.map(items,function(item){
            var begin = item.lastIndexOf('http');
		    if(begin==0) return 'res:enlight:'+item;
            else return item;		    
		})
		
		var mul = redisClient.multi();
		for(var i=0;i<items.length;i++){
		   //mul.hgetall(items[i]);
		   mul.hmget(items[i],  'temperature','time','lat','long'); 
		}
		mul.exec(function (err, replies) {            
			redisClient.quit();
			if(err) {redisClient.quit();return callback(err,null);}			
			else if(!replies){ redisClient.quit(); return callback(null,null);}
            else if(replies) { 
			    redisClient.quit();				
				var sensors = [];
				for(var i=0;i<replies.length;i++){
				    console.log('get enlight data ',replies[i],items[i]);
					var values = replies[i];
					sensors.push({temperature:values[0],time:values[1], lat:values[2], lng:values[3]});
				}							
				return callback(null,sensors);
			}			
		});			
	}
	
	return {
	   updateLightAndTemperature:updateLightAndTemperature,
	   getLightSensorData:getLightSensorData
	}
}	



function EnlightingMQTTHandler(){  
	this.handleMessage = handleMessage;
	var caches = [];
	var lastUpdateTime;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = new Date(msg.t*1000);   //+value+"   "+time+"   "
            
			var attr = url.split('/');
			
			var attribute = attr[attr.length-1]; var id = attr[attr.length-2];
			winston.info("EnlightingMQTTHandler handle message  "+url+"   "+ attribute + id);
			//if(attribute == 'light' || attribute == 'dolFinTemperature')
            //caches.push();
		}catch(e){
			winston.debug('some thing wrong   ......'.red+e);   
		}
    }		
}	
	
	
	
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


app.get('/arm/enlight',function(req,res,next){
    catalogModel.getCatalogResoures('https://geras.1248.io/cat/enlight',function(err,data){
		if(err) console.log('catalog facts  store error '.red,catalog.url, err);
		else if(!data){console.log('no data in the catalog ');}
		else if(data){
			var urls = [];
			async.each(data.res,function(item,callback){
				urls.push(item.url);
				callback();
			
			},function(err,data){
				model.getLightSensorData(urls,function(err,sensors){
					if(err) { console.log(errs);res.send(500);}
					else if(!sensors) { console.log(sensors); res.send(404); }
					else if(sensors){
					   res.send(200,sensors);
					}
				})
			
			}) 
		}
	})
})







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

Your statement is not correct. It is 0.5 deg accurate. The light does not corrupt the reading. If you are monitoring the Ballast temp then this is the temp for the the installed product. The DolFin temp sensor monitors the internal temp of the sensor. We keep a bit of warmth within the product to stop the really low temperatures effecting the microelectronics. Lee spoke to me a he wanted to use the DolfIn sensor to measure external temp. So we said to try removing 10 deg and see how that would work.


*/