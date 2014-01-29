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
    serviceCatalog = require('../serviceCatalog.js'),
	config = require('../../conf/config'),
	winston = require('../../utils/logging.js'),
	eventModel = require('../../model/event_model.js')
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js');

/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting');  // enlight
var buildingService = serviceCatalog.findByName('armbuilding');  // enlight	

 /*
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB&traverseKey=924a7d4dbfab38c964f5545fd6186559
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fprotected-sands-2667.herokuapp.com%2Fcat&traverseKey=0L8kgshd4Lso3P1UQX7q&Submit=Browse
http://schema.org/Place
*/

	
app.get('/buildings',function(req,res){
    db.getResourceList2("location:building",function(err,data){ 
        console.log('membres building',data.length);  
        for(var i=0;i<data.length;i++){
	        console.log(data[i]);
	    }
		res.send(data);
    })
})


/*
getResourceList2("location:building:ARM6",function(err,data){ 
    console.log('membres  arm5',data.length);  
    for(var i=0;i<data.length;i++){
	    console.log(data[i]);	
	}
})
*/

app.get('/buildings/:name',function(req,res){
    var name = req.params.name;
    db.getResourceList2("location:building:"+name,function(err,data){ 
        console.log('membres',name,data.length);  		
		var array = [];
		async.forEach(data, function(item,callback){ 
		     db.findResource2(item,['email','name','url','address'],function(err,data){ 
			    //winston.debug("data1111".green,item,data);               				
			    array.push({ 'email':data[0],'name':data[1],'url':data[2] ,'address':data[3].toString()  });
				callback();
			 })
		 }, function(err) {      
            if(err){
                 console.log(err);
				 res.send(404);
            }
			else{
			    console.log(array);
				res.send(array);
			}
        });		
    })
})

// http://localhost/room/event?url=https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4
// http://localhost/room/event?url=Room.UKCMaple   Room.UKCBeech  Room.UKCWillowA  Room.UKCWillowB  Room.UKCFM10  Room.UKCFM7  Room.UKCFM9
// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF&traverseKey=924a7d4dbfab38c964f5545fd6186559

// http://localhost/room/events?url=Room.UKCMaple,Room.UKCBeech,Room.UKCWillowA 

app.get('/meetings/arm/tomorrow',function(req,res){
 	getRoomEvents(true,res);
})

app.get('/meetings/arm/now',function(req,res){
 	getRoomEvents(false,res);
})

app.get('/meetings/arm/building',function(req,res){
	
})

function getRoomEvents(tomorrow, res){
    var rooms = [
    { 
	  'name': 'Room.UKCWillowA',
      'displayname':'WilA',	
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
      'temperature': 43,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCWillowB',
	  'displayname':'WilB',
      "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
	  'temperature': 12,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCFM10',
	  'displayname':'FM10',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCLectureTheatre',
	  'displayname':'Lec',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCLectureTheatre",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCElm',
	  'displayname':'Elm',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm",
      'temperature': 27,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCOak',
	  'displayname':'Oak',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak",
      'temperature': 21,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCTrainingRoomB',
	  'displayname':'TrainB',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomB",
      'temperature': 21,
	  'time':new Date()	
	},
    {
	  'name': 'Room.UKCTrainingRoomA',
	  'displayname':'TrainA',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCTrainingRoomA",
      'temperature': 21,
	  'time':new Date()	
	}	
    ];
	
	async.forEach(rooms, 
	  function(room, callback){        
		url = simulation.rooms[room.name];
		winston.debug('........................'+room.name+"       " +url);
		
		buildingService.fetchResourceDetail(url+"/events",function(err,eventlist){
            if(err){
	            winston.error('error    '+url+"/events");
				room.events = [];	
	        }else{
                var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
				// all events in this day
				if(tomorrow)
				eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() > late_day.getTime(); });
                else
				eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() <= late_day.getTime(); });				
                room.events = eventlist;
                //winston.debug('filtered  ... '+room.events.length);				
	        }		
            callback();			
	    });		
      },
	  function(err){
        //winston.debug('get all the messages ',util.inspect(events, false, null));
		res.send(200,{rooms:rooms});
	  } 
	);
}

app.get('/room/events',function(req,res){
    var url = req.query.url;
		
	var list = url.split(',');
	winston.debug(url);

	var events = [];
	async.forEach(list, 
	  function(room_nmae, callback){        
		url = simulation.rooms[room_nmae];
		winston.debug(room_nmae,url);
		buildingService.fetchResourceDetail(url+"/events",function(err,eventlist){
            if(err){
	            winston.error('error    '+url+"/events");
	        }else{
			    //winston.debug(obj);
				
				var roomObj = {};
				roomObj.name = room_nmae;
				roomObj.temperature = 18+  (Math.floor(Math.random() * 16) + 1)/4;
				
				var now = new Date();
				var eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);    return (eventDate.getTime() >= now.getTime())&&(eventDate.getDate()==now.getDate()); });				
				roomObj.events = eventlist;
				events.push(roomObj);				
	        }
            callback();			
	    });		
      },
	  function(err){
        //winston.debug('get all the messages ',util.inspect(events, false, null));
		res.send(200,{rooms:events});
	  } 
	);    
})









var agenda = new Agenda({db: { address: 'localhost:27017/agenda-example'}});

agenda.define('request events for arm room', function(job, done) {
    getArmMeetingSchedules(done)
});

agenda.every('1 minutes', 'request events for arm room');
//agenda.start();
agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});
agenda.once('success:request events for arm room', function(job) {
  console.log("success:request events for arm room: %s", job);
});
agenda.on('fail:request events for arm room', function(err, job) {
  console.log("Job failed with error: %s", err.message);
});


function getArmMeetingSchedules(done){
	done();
}

/**********************************************   ********************************************************/
appBuilder.createApp('meetingroom',new MeetingRoomMQTTHandler().handleMessage, function(err,app){
	if(err) winston.error('error in create app');
	else winston.info('app is created  meetingroom   '+app.id);  // 
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
		    console.log('MQTT:  '.green,"https://geras.1248.io/series"+url, value);
			
            sensorLayer.queryRoomFromSensor( "res:sensor:"+"https://geras.1248.io/series"+url ,function(err,data){
			    if(err) console.log('err  ',err)
			    else if(data) console.log('find the room '.green,data);
				else if(!data) console.log('room not found'.red);
			})
			
			
			/*
		    var array = url.split('/');
		    //console.log(array[0],array[1],array[2],array[3],array[4],array[5], value);
			var device_id = array[4] , device_attr = array[5];
			//winston.debug('url :'+url+ device_id+device_attr);
		    console.log('url :'+url.substring(0,url.lastIndexOf("/")));
	        var url1 = url.substring(0,url.lastIndexOf("/"));
			db.findResource2("device:"+url1, 'loc',function(err,data){ 
			    if(err) winston.error('hmget 11 '+err);
				else if(data) winston.info('hmget find location 11:'.green+"  "+data.url+"  " +data+"   id:"+device_id+"   attribute:"+device_attr+"   value:".green+value);	  
			    else winston.error('hmget find no location11');
			});
			*/
		
			var room_uniqueURl = simulation.mapping[url];
			if(room_uniqueURl){			    
				var getShortName = function(url){
				   var array = url.split('/');
				   return array[array.length-1];
				}				
				var room_shortName = getShortName(room_uniqueURl);
				//winston.debug(" simulation mode :   room  is  "+room_uniqueURl, room_shortName);
                sensorLayer.updateMotion(room_shortName,function(err,data){});	
				//winston.debug("io send message  "+room_shortName);
				io.sockets.emit('info',{room:room_shortName,type:'motion', value:100});
			}		
			   
		}catch(e){
			console.log('some thing wrong   ......'.red+e);   
		}
    }		
}

var sensorLayer = new SensorLayer();
function SensorLayer(){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
	
	function getRoomByBuilding(name,callback){
		var rooms = [];
		var redisClient;	
			try{ 
				redisClient = redis.createClient(redis_port,redis_ip);
			}
			catch (error){
				console.log('updateMotion  error' + error);
				redisClient.quit();
				return callback(error,null);
			}		
		redisClient.keys("res:room:*", function(err, keys) {
			console.log('res key room',keys.length);
			
			var mul = redisClient.multi();
			keys.forEach(function(key){		
			   mul.hmget( key , 'building');
			})		           		
			mul.exec(function (err, replies) {
				console.log("res:room Resource ".green + replies.length + " replies");
				//console.log("res:room Resource ".green + replies + " replies");
				//console.log("res:room Resource ".green + keys + " keys");
			    if(err) { redisClient.quit(); return callback(err,null);}			    
			    else if(!replies){ redisClient.quit(); return callback(null,null);}					
				else{											
					for(var i=0;i<keys.length;i++){		
						 rooms.push({'room':keys[i],'building':replies[i]});							 
					}

					var groups = _.groupBy(rooms,function(room){
									return room.building;		
						        })
					redisClient.quit();
                    return callback(null,groups);					
                }									
			});						
		});	
	
	
	}
	
	function updateMotion(name,callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('updateMotion  error' + error);
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

	function getSensorData( items, callback ){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('getSensorData  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	

		var mul = redisClient.multi();
		for(var i=0;i<items.length;i++){
		   mul.hgetall(items[i]);
		}
		mul.exec(function (err, replies) {            
			redisClient.quit();
			if(err) {return callback(err,null);}
			else if(replies) { return callback(null,replies);}
			else { return callback(null,null);}			
		});		
		redisClient.quit();
	}
	
	
	function updateTempData(name,temp,callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('updateTempData' + error);
			redisClient.quit();
			return callback(error,null);
		}	
		
		redisClient.hmset(name, 'temp',temp, function(err, data){
			redisClient.quit();
			if(err) {return callback(err,null);}
			else if(data) { return callback(null,data);}
			else { return callback(null,null);}	
		});

		redisClient.quit();	
	}
	
	
	function queryRoomFromSensor( url, callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			//console.log('queryRoomFromSensor' + error);
			redisClient.quit();
			return callback(error,null);
		}	
		
		redisClient.hmget(url, 'room', function(err, data){
			
			if(err) { redisClient.quit();	 return callback(err,null);}
			else if(!data) { redisClient.quit();	 return callback(null,null);}
			else { 
			    var room_id = data
				
				redisClient.hgetall(room_id,function(err,room){
				//redisClient.hmget(room_id,'floor building time temp ',function(err,room){
                    //console.log('room Data: ' + room);
					redisClient.quit();
					if(err) {return callback(err,null);}
					else if(!data) { return callback(null,null);}
					else return callback(null,room);
                })
			}	
		});

		
	}
		
    return {
	    getSensorData:getSensorData,
	    updateMotion:updateMotion,
		updateTempData:updateTempData,
		queryRoomFromSensor:queryRoomFromSensor
	}
}
/********************88   *********************/
//  updateRoomEvents on 2:00 pm

var RoomScheduleEvents = function(){
	var rooms = [
		{ 
		  'name': 'Room.UKCWillowA ',
		  'displayname':'WilA',	
		  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA"
		} ,
		{
		  'name': 'Room.UKCFM10',
		  'displayname':'FM10',
		  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
		  'temperature': 23,
		  'time':new Date()
		}	
	] ;
		
	function updateRoomEvents(req,res,next){
  
		var tomorrow = false;		
		async.forEach(rooms, 
		  function(room, callback){ 

				console.log('update room events  ', room.url, room.name);		  
				buildingService.fetchResourceDetail(room.url+"/events",function(err,eventlist){
					if(err){
						winston.error('error    '+url+"/events");
						room.events = [];	
					}else{
						var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
						// all events in this day
						if(tomorrow)
						eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() > late_day.getTime(); });
						else
						eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() <= late_day.getTime(); });				
						room.events = eventlist;
						winston.debug('filtered  ... '+room.events.length);
						_.map(room.events,function(event){
							delete event.url;
							delete event.location;
						})
						eventModel.pushRoomEvents(room.name,room.url,early_day,room.events,function(err,data){
							if(err){
								console.log('events updated error '.red+err);
							}
							else{
								console.log('events updated  '.green);				
							}
						});
						callback();
						//res.send(room.events);			
					}
				})
		  },
		  function(err){
			//winston.debug('get all the messages ',util.inspect(events, false, null));
			res.send(200,{rooms:rooms});
		  } 
		);	
		
	}

	function updateRoomTemp(req,res,next){
		var array = Object.keys(simulation.reversemapping);
		//console.log(array);
		async.forEach(array, function(room,callback){ 
			console.log(room , simulation.reversemapping[room] );		 
			meetingService.getResourceData(simulation.reversemapping[room]+"/temperature" ,null,function(err,data){
				if(err)  console.log(err);
				else {
					var senmlParse = function(data){			
						var e = data.e;
						e.forEach(function(data){
							console.log( room, 'temperature:', data.v );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
							sensorLayer.updateTempData(room,data.v,function(err,data){});	    
						})				
						/// now 									
					}						
					senmlParse(data);
					callback();				
				}	
			})		 		 
		 }, function(err) {      
			if(err){
				 console.log(err);
				 res.send(404);
			}
			else{
				res.send(array);
			}
		});
	}
	
	
	return {
	    updateRoomTemp:updateRoomTemp,
	    updateRoomEvents:updateRoomEvents
	}
}
var roomSchedule = new RoomScheduleEvents();
app.get('/arm/meeting/update', roomSchedule.updateRoomEvents);
app.get('/arm/meeting/temp',roomSchedule.updateRoomTemp);


app.get('/arm/meeting/today', getMultiRoomEvents);
function getMultiRoomEvents(req,res,next){
    var rooms = [  'Room.UKCWillowA', 'Room.UKCFM10', 'Room.UKCARM66MR11' ,'Room.UKCWillowB','Room.UKCOak'] ;
    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
	// certain day
	
	var day_begin  = new Date(2014,1,27,8,0,0);
	var day_end = new Date(2014,1,27,18,0,0);
	
	//var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
    var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
/*
http://geras.1248.io/series/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/motion?start=1392278400&end=1392314400  {"e":[]}				
http://geras.1248.io/series/foo/temperature?start=1234&end=2468				
http://geras.1248.io/series/armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion?start=1392278400&end=1392314400
*/
	
    meetingService.getResourceData('armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion',range,function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data.e.length);			
			var senmlParse = function(data,res){			
			    var e = data.e;
				e.forEach(function(data){
				    console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				})				
				
			}						
			senmlParse(data,res);
		   
		}	
    })	
	
	eventModel.getMultiRoomEvents(rooms,early_day,function(err,data){
		if(err){
			console.log('getting events error '.red+err);
		}
		else{
		    //_.map(data.events,function(event){  delete event._id; })
			console.log('getting events  '.green);
            res.send(data);				
		}		
	});		
}



// http://localhost/tempdata	
/*
app.get('/testevents2', getRoomEvents);
function getRoomEvents(req,res,next){
    var room = { 
	  'name': 'Room.UKCWillowA ',
      'displayname':'WilA',	
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA"
	}  
    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);	
	eventModel.getRoomEvents(room.name,early_day,function(err,data){
		if(err){
			console.log('getting events error '.red+err);
		}
		else{
		    _.map(data.events,function(event){  delete event._id; })
			console.log('getting events  '.green);
            res.send(data);				
		}		
	});		
}
*/
	
/*	// 
    meetingService.getResourceData('armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/temperature',null,function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data.e.length);			
			var senmlParse = function(data,res){			
			    var e = data.e;
				e.forEach(function(data){
				    console.log(data.n , data.v );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				})				
				/// now 				
				res.send(200,{ 'n':data.e[0].n, 'v':data.e[0].v, 't': new Date( data.e[0].t *1000) });
			}						
			senmlParse(data,res);
		   
		}	
    })
*/	
