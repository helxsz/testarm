var app = require('../app').app;

var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	ServiceCatalog = require('./serviceCatalog.js'),ServiceBuilder = require('./serviceBuilder.js'),serviceBus = require('./serviceBusService.js'),
	AppBuilder = require('./AppBuilder.js');
	SensMLHandler = require('./senMLHandler.js');

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
appBuilder.createApp('blabla',new MeetingRoomMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created  '+app.id);  // 
	app.subscribeService('armmeeting',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success');
	})
});


setTimeout(function(){
    //serviceCatalog.removeRTService('armmeeting');
},5000);

var mapping = {
    "/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4",
    "/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-30-83/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM5",
    "/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-63/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBeech",
   // "/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-61/motion":"BAY",
    "/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-35-0A/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCMaple",
    "/armmeeting/3/MotionSensor/00-0D-6F-00-00-C1-46-34/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSF8",
   // "/armmeeting/4/MotionSensor/00-0D-6F-00-00-C1-3B-84/motion":"SGM1",
    "/armmeeting/5/MotionSensor/00-0D-6F-00-00-C1-31-4D/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBirch",
    "/armmeeting/6/MotionSensor/00-0D-6F-00-00-C1-45-BA/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSycamore",
    "/armmeeting/6/MotionSensor/00-0D-6F-00-00-C1-3D-53/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak",
    "/armmeeting/7/MotionSensor/00-0D-6F-00-00-C1-31-C1/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAsh",
    "/armmeeting/7/MotionSensor/00-0D-6F-00-00-C1-46-17/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAlder",
    "/armmeeting/8/MotionSensor/00-0D-6F-00-00-C1-46-89/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCHazel",
   // "/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3F-4F/motion":"HOLLY",
    "/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3D-4A/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomA",
    "/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3F-22/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomB",
    "/armmeeting/10/MotionSensor/00-0D-6F-00-00-C1-3F-20/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
    "/armmeeting/10/MotionSensor/00-0D-6F-00-00-C1-38-5F/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
    "/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCLectureTheatre",
    "/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08/motion":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCPatentBox",
    "/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm",
    "/armmeeting/12/MotionSensor/00-0D-6F-00-00-C1-2C-47/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCYew",
    "/armmeeting/12/MotionSensor/00-0D-6F-00-00-C1-48-36/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAspen",
    "/armmeeting/13/MotionSensor/00-0D-6F-00-00-C1-30-9E/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCRowan",
    "/armmeeting/14/MotionSensor/00-0D-6F-00-00-C1-34-AE/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.SHABoardroom.VideoConference",
    "/armmeeting/15/MotionSensor/00-0D-6F-00-00-C1-2F-E7/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM9",
    "/armmeeting/16/MotionSensor/00-0D-6F-00-00-C1-34-AF/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM7",
    "/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
    "/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-3B-67/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR01",
    "/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-31-7E/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR02",
    "/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-3D-59/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR3",
    "/armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-2F-10/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR4",
    "/armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-31-3F/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR5",
    "/armmeeting/20/MotionSensor/00-0D-6F-00-00-C1-30-1E/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR06",
    "/armmeeting/21/MotionSensor/00-0D-6F-00-00-C1-46-1A/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR8",
    "/armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR11",
    "/armmeeting/23/MotionSensor/00-0D-6F-00-00-C1-3F-5E/motion":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Knuth",
    "/armmeeting/23/MotionSensor/00-0D-6F-00-00-C1-2C-88/motion":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Turing",
    "/armmeeting/24/MotionSensor/00-0D-6F-00-00-C1-48-09/motion":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Ritchie"
};	


var rooms = {
   "Room.UKCMaple": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCMaple",
   "Room.UKCBeech": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBeech",
   "Room.UKCWillowA": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
   "Room.UKCWillowB": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
   "Room.UKCFM10": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
   "Room.UKCFM7": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM7",
   "Room.UKCFM9": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM9",
   "Room.UKCGM4": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4",
   "Room.UKCGM5": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM5",
   "Room.UKCSF8": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSF8",
   "Room.UKCBirch": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBirch",
   "Room.UKCSycamore": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSycamore",
   "Room.UKCOak": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak",
   "Room.UKCAsh": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAsh",
   "Room.UKCAlder": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAlder",
   "Room.UKCHazel": "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCHazel",
   
   "Room.UKCElm":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm",
   "Room.UKCLectureTheatre":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCLectureTheatre",
   "RoomUKCPatentBox":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCPatentBox",
   "Room.UKCARM66MR4":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR4",
   "Room.UKCARM66MR5":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR5",
   "RoomUKCPatentBox":"https://protected-sands-2667.herokuapp.com/rooms/RoomUKCPatentBox"
}


var reversemapping = {
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4":"/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM5":"/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-30-83/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBeech":"/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-63/motion",
   // "/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-61/motion":"BAY",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCMaple":"/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-35-0A/motion",
    "/armmeeting/3/MotionSensor/00-0D-6F-00-00-C1-46-34/motion":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSF8",
   // "/armmeeting/4/MotionSensor/00-0D-6F-00-00-C1-3B-84/motion":"SGM1",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBirch":"/armmeeting/5/MotionSensor/00-0D-6F-00-00-C1-31-4D/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCSycamore":"/armmeeting/6/MotionSensor/00-0D-6F-00-00-C1-45-BA/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak":"/armmeeting/6/MotionSensor/00-0D-6F-00-00-C1-3D-53/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAsh":"/armmeeting/7/MotionSensor/00-0D-6F-00-00-C1-31-C1/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAlder":"/armmeeting/7/MotionSensor/00-0D-6F-00-00-C1-46-17/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCHazel":"/armmeeting/8/MotionSensor/00-0D-6F-00-00-C1-46-89/motion",
   // "/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3F-4F/motion":"HOLLY",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomA":"/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3D-4A/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomB":"/armmeeting/9/MotionSensor/00-0D-6F-00-00-C1-3F-22/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA":"/armmeeting/10/MotionSensor/00-0D-6F-00-00-C1-3F-20/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB":"/armmeeting/10/MotionSensor/00-0D-6F-00-00-C1-38-5F/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCLectureTheatre":"/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/RoomUKCPatentBox":"/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm":"/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCYew":"/armmeeting/12/MotionSensor/00-0D-6F-00-00-C1-2C-47/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCAspen":"/armmeeting/12/MotionSensor/00-0D-6F-00-00-C1-48-36/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCRowan":"/armmeeting/13/MotionSensor/00-0D-6F-00-00-C1-30-9E/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.SHABoardroom.VideoConference":"/armmeeting/14/MotionSensor/00-0D-6F-00-00-C1-34-AE/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM9":"/armmeeting/15/MotionSensor/00-0D-6F-00-00-C1-2F-E7/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM7":"/armmeeting/16/MotionSensor/00-0D-6F-00-00-C1-34-AF/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10":"/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR01":"/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-3B-67/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR02":"/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-31-7E/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR3":"/armmeeting/18/MotionSensor/00-0D-6F-00-00-C1-3D-59/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR4":"/armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-2F-10/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR5":"/armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-31-3F/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR06":"/armmeeting/20/MotionSensor/00-0D-6F-00-00-C1-30-1E/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR8":"/armmeeting/21/MotionSensor/00-0D-6F-00-00-C1-46-1A/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/Room.UKCARM66MR11":"/armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Knuth":"/armmeeting/23/MotionSensor/00-0D-6F-00-00-C1-3F-5E/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Turing":"/armmeeting/23/MotionSensor/00-0D-6F-00-00-C1-2C-88/motion",
    "https://protected-sands-2667.herokuapp.com/rooms/RoomUKCCPC-1Ritchie":"/armmeeting/24/MotionSensor/00-0D-6F-00-00-C1-48-09/motion"
};


function MeetingRoomMQTTHandler(){
    
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
		    // stream to interoperbility layer
		    var array = url.split('/');
		    console.log(array[0],array[1],array[2],array[3],array[4],array[5], value);
			var device_id = array[3] , device_attr = array[4];
			console.log('url :'+url);
			/*
		    console.log('url :'+url.substring(0,url.lastIndexOf("/")));
	        var url1 = url.substring(0,url.lastIndexOf("/"));
			db.findResource2("device:"+url1, 'loc',function(err,data){ 
			    if(err) winston.error('hmget 11 '+err);
				else if(data) winston.info('hmget find location 11:'.green+"  "+data.url+"  " +data+"   id:"+device_id+"   attribute:"+device_attr+"   value:".green+value);	  
			    else winston.error('hmget find no location11');
			});
			*/
			var room = mapping[url];
			if(room){
			    console.log("room  is  "+room);
				var array = room.split('/');
				//console.log("io send message  "+array[4]);
				io.sockets.emit('info',{room:array[4],type:'motion', value:100});
			}
			
		    var roomID = array[2], sensorID = array[4], sensorType = array[5];
			url = array[0]+"/"+array[1]+"/"+array[2]+"/"+array[3]+"/"+array[4];
		    //winston.debug('MeetingRoomMQTTHandler  '.green+url+"  "+sensorType+"  "+ value);			   
		}catch(e){
			console.log('some thing wrong   ......'+e);   
		}
    }		
}

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