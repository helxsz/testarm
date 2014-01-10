var app = require('../app').app;

var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda'),
	redis = require('redis');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	ServiceCatalog = require('./serviceCatalog.js'),ServiceBuilder = require('./serviceBuilder.js'),serviceBus = require('./serviceBusService.js'),
	AppBuilder = require('./AppBuilder.js');
	SensMLHandler = require('./senMLHandler.js'),
	simulation = require('./simulation.js');

// http://sailsjs.org/#!documentation/policies	
// http://schema.org/Event
// https://github.com/indexzero/node-schema-org
/************************************************************************
	request to 1248
http://wiki.1248.io/doku.php?id=hypercat
http://geras.1248.io/user/apidoc	
	
List of metadata properties in use   http://wiki.1248.io/doku.php?id=hypercatmetadatalist
https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnx0c2JvcGVuaW90fGd4OjJiMDhjYzRlZWI1OTk2NGI
http://wiki.1248.io/lib/exe/fetch.php?media=hypercat-overview.pdf	
http://imove-project.org/cat i-Move Project
http://strauss.ccr.bris.ac.uk/catalogue/services/api/root IoT-Bay Project	
*************************************************************************/

/**************************************************************
https://github.com/tobyjaffey/coap-cat-proxy/blob/master/coap-cat-proxy.js
http://wiki.1248.io/doku.php?id=senml
http://wiki.1248.io/doku.php?id=hypercat
http://wiki.1248.io/doku.php?id=pathfinderpermissionsapi
https://alertmeadaptor.appspot.com

**************************************************************/

/****   experiment 1 ********/
    var enlight = {
	    'name': 'enlight',
		'description': 'Streetlight data',
		'url': 'https://geras.1248.io/cat/enlight',
		'key':'1bfc8d081f5b1eed8359a7517fdb054a',
        'pattern':'enlight',
		'host':'geras.1248.io',
        'cat':'enlight',
        'RT':'mqtt'		
	},
	armhome = {
	    'name': 'armhome',
		'description': 'ARM homes data',
		'url': 'https://geras.1248.io/cat/armhome',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armhome',
		'host':'geras.1248.io',
        'cat':'armhome',
        'RT':'mqtt'			
	},
	armmeeting = {
	    'name': 'armmeeting',
		'description': 'ARM meeting room data',
		'url': 'https://geras.1248.io/cat/armmeeting',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armmeeting',
		'host':'geras.1248.io',
        'cat':'armmeeting',
        'RT':'mqtt'			
	},
	armbuilding = {
	    'name': 'armbuilding',
		'description': '',
		'url': 'https://protected-sands-2667.herokuapp.com/cat',
		'key':'0L8kgshd4Lso3P1UQX7q',
		'pattern':'',
		'host':'protected-sands-2667.herokuapp.com',
		'cat':''
    };


	

var serviceCatalog = new ServiceCatalog();
var serviceBuilder = new ServiceBuilder(serviceCatalog);
serviceBuilder.build([enlight,armhome,armmeeting,armbuilding]);


serviceBus.startService();
serviceBuilder.buildRTService('armmeeting', SensMLHandler);


var appBuilder = new AppBuilder();

    //serviceCatalog.removeRTService('armmeeting');

appBuilder.createApp('blabla',new MeetingRoomMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created  '+app.id);  // 
	app.subscribeService('armmeeting',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success');
	})
});







function MeetingRoomMQTTHandler(){
    
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
		    // stream to interoperbility layer
		    var array = url.split('/');
		    //console.log(array[0],array[1],array[2],array[3],array[4],array[5], value);
			// device unique url = 
			var device_id = array[4] , device_attr = array[5];
			console.log('url :'+url, device_id,device_attr);
			/*
		    console.log('url :'+url.substring(0,url.lastIndexOf("/")));
	        var url1 = url.substring(0,url.lastIndexOf("/"));
			db.findResource2("device:"+url1, 'loc',function(err,data){ 
			    if(err) winston.error('hmget 11 '+err);
				else if(data) winston.info('hmget find location 11:'.green+"  "+data.url+"  " +data+"   id:"+device_id+"   attribute:"+device_attr+"   value:".green+value);	  
			    else winston.error('hmget find no location11');
			});
			*/
		
			var room_uniqueURl = 	simulation.mapping[url];
			if(room_uniqueURl){			    
				var getShortName = function(url){
				   var array = url.split('/');
				   return array[array.length-1];
				}				
				var room_shortName = getShortName(room_uniqueURl);
				console.log("room  is  "+room_uniqueURl, room_shortName);
                updateMotion(room_shortName,function(err,data){});	
				console.log("io send message  "+room_shortName);
				io.sockets.emit('info',{room:room_shortName,type:'motion', value:100});
			}
			
			url = array[0]+"/"+array[1]+"/"+array[2]+"/"+array[3]+"/"+array[4];
		    //winston.debug('MeetingRoomMQTTHandler  '.green+url+"  "+sensorType+"  "+ value);			   
		}catch(e){
			console.log('some thing wrong   ......'.red+e);   
		}
    }		
}

function updateMotion(name,callback){
	var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('find Resource eInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	

	redisClient.hmset(name, 'time',new Date(), 'displayname',name,function(err, data){
	    redisClient.quit();
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});

	redisClient.quit();

}

/*
io.sockets.on('connection', function (socket) {
    console.log('socket connected');
	socket.emit('connect');
	     
    socket.on('subscribe', function (data) {
        console.log('subscribe  to  ----------------------------'.green,data);
		var rooms = data.room.split(',');
		console.log(rooms.length);
		rooms.forEach(function(room){
		    
		   console.log(roomstatus[room]);
		})
    });
});
*/

// http://localhost/all/meeting
app.get('/all/meeting',function(req,res,next){

    getResourceList2('cat:armmeeting',function(err,data){
	    res.send(200,data);
	
	});
	
})

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


	/*
	client.hgetall("device:"+url, function (err, data) {
        console.log('hgetall  reply 2'+data);	
    });

function findResource(context,url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('find Resource eInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	

	redisClient.hmget(context+url, item,function(err, data){
	    redisClient.quit();
		data.url = url;
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});

	redisClient.quit();
	return callback(null,1);
}

function saveResourceInBulk(context, url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port;	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
		
	var mul = redisClient.multi();
    for(var index in item) {
		mul.hmset(context+url,index,item[index],function(){})
    }		
	mul.exec(function (err, replies) {
        console.log("save Resource ".green + replies.length + " replies");
    });
	redisClient.quit();
	return callback(null,1);
}
 */
 
 
/*
function clearResourceList(service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceIntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers('cat:'+service).exec(function (err, replies) {
		console.log('services     '.green +  replies+"  ");
    });
	redisClient.quit();  
	return callback(null,1);
}

function getResourceList(context,service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('get ResourceList Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers(context+service).exec(function (err, replies) {
		console.log('services     '.green +  replies.length+"  ");
		replies.forEach(function (reply, index) {
             console.log("Reply " + index + ": " + reply.toString() +"\n" );
        });
		return callback(null,replies);
    });
	redisClient.quit();  	
}

function saveResourceList(context,service ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
    //redisClient.zadd('imgs:'+service,time,JSON.stringify({'img':img_id,'time':time}));
	redisClient.sadd(context+service,JSON.stringify({'item':item}));
	redisClient.incrby(context+service+':count',1);
	redisClient.quit();
	return callback(null,1);
}
*/