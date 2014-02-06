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
var meetingService = serviceCatalog.findByName('armmeeting'); 
var buildingService = serviceCatalog.findByName('armbuilding');  

 /*
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB&traverseKey=924a7d4dbfab38c964f5545fd6186559
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fprotected-sands-2667.herokuapp.com%2Fcat&traverseKey=0L8kgshd4Lso3P1UQX7q&Submit=Browse
http://schema.org/Place
*/

app.get('/app/meetingroom',function(req,res){  
    res.render('meeting.html');
})
	
app.get('/buildings/test',function(req,res){
    sensorRoomModel.getRoomByBuilding('abc',function(err,data){
	    if(err) res.send(404);
	    else if(!data){res.send(404);}
		else{
		    //console.log(data);
		    res.send(data);
		}
	})
})

app.get('/buildinglist',function(req,res){
    var list = [
	    {name:'ARM 1', floors:[ {name:'Ground',url:'/buildings/ARM1/0'},{name:'Floor 1',url:'/buildings/ARM1/1'} ]},
        {name:'ARM 2', floors:[ {name:'Ground',url:'/buildings/ARM2/0'},{name:'Floor 1',url:'/buildings/ARM2/1'} ]},	
        {name:'ARM 3', floors:[ {name:'Ground',url:'/buildings/ARM3/0'},{name:'Floor 1',url:'/buildings/ARM3/1'} ]},	
        {name:'ARM 6', floors:[ {name:'Ground',url:'/buildings/ARM6/0'},{name:'Floor 1',url:'/buildings/ARM6/1'} ]},
        {name:'CPC1',  floors:[ {name:'Ground',url:'/buildings/CPC1/0'},{name:'Floor 1',url:'/buildings/CPC1/1'} ]}		
	];
	res.json(200,{buildings:list});
})


app.get('/buildings/:name/:floor/test',function(req,res){
    var name = req.params.name, floor = req.params.floor;
	name = name || 'ARM1';
	floor = floor || 0;
	var rooms = simulation.buildings[name+" "+floor];
	console.log(rooms);
	
	var array = [];
	for(var i=0;i<rooms.length;i++){
	   array.push(rooms[i].room)
	}
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		if(temp_name.length > 3)
		temp_name = temp_name.substring(0,3)+temp_name[temp_name.length-1];	
		return temp_name;
	}
	
	sensorRoomModel.getRoomData(array, function(err,rooms){
		if(err) {  console.log('get room error '.red); res.send(500)}
		else if(!rooms) { console.log('no data for room'.red); res.send(404);}
		else{
			console.log('get rooms data '.green, rooms);
            res.send(200,{rooms:rooms});						
		}
	})
})

app.get('/buildings/:name/:floor',function(req,res){
    var name = req.params.name, floor = req.params.floor;
	name = name || 'ARM1';
	floor = floor || 0;
	var rooms = simulation.buildings[name+" "+floor];
	console.log(rooms);
	
	var array = [];
	for(var i=0;i<rooms.length;i++){
	   array.push(rooms[i].room)
	}
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		if(temp_name.length > 3)
		temp_name = temp_name.substring(0,3)+temp_name[temp_name.length-1];	
		return temp_name;
	}
	
	sensorRoomModel.getRoomData(array, function(err,rooms){
		if(err) {  console.log('get room error '.red); res.send(500)}
		else if(!rooms) { console.log('no data for room'.red); res.send(404);}
		else{
			console.log('get rooms data '.green, rooms);
			
			async.forEach(rooms, 
			  function(room, callback){        
				room.displayname = displayname(room.name);
				winston.debug('........................'+room.name+"       " +room.url);
				var tomorrow = false;
				buildingService.fetchResourceDetail(room.url+"/events",function(err,eventlist){
					if(err){
						winston.error('error    '+room.url+"/events");
						room.events = [];	
					}else{
						var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
						// all events in this day
						if(tomorrow)
						eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() > late_day.getTime(); });
						else
						eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() <= late_day.getTime(); });
                        _.map(eventlist,function(event){  delete event.url; })						
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
	})
})

app.get('/buildings/:name/:floor/2',function(req,res){
    var name = req.params.name, floor = req.params.floor;
	name = name || 'ARM1';
	floor = floor || 0;
	var rooms = simulation.buildings[name+" "+floor];
	console.log(rooms);
	
	var array = [];
	for(var i=0;i<rooms.length;i++){
	   array.push(rooms[i].room)
	}
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		if(temp_name.length > 3)
		temp_name = temp_name.substring(0,3)+temp_name[temp_name.length-1];	
		return temp_name;
	}
	
	sensorRoomModel.getRoomData(array, function(err,rooms){
		if(err) {  console.log('get room error '.red); res.send(500)}
		else if(!rooms) { console.log('no data for room'.red); res.send(404);}
		else{		   
			//console.log('get rooms data '.green, rooms);
			var rooms_array = [];
			_.map(rooms,function(room){
			    rooms_array.push(room.name);
			})
			sensorRoomModel.getCachedEvents(rooms_array,function(err,data){				
			    if(err) res.send(500);
			    else{
					//console.log(data);
					
					var hash = {};
					_.map(data,function(room_event){
						hash[room_event.url] = room_event.events;
					})
					
					_.map(rooms,function(room){
						room.events = hash[room.url];
                         room.displayname = displayname(room.name);						
					})
     				res.send(200,{rooms:rooms});
					delete hash;
					delete rooms_array;
				}
				
			})            			
		}
	})
})

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
	var getShortName = function(url){
	   var array = url.split('/');
	   return array[array.length-1];
	}	
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
		    console.log('MQTT:  '.green,"https://geras.1248.io/series"+url, value);
			
            sensorRoomModel.queryRoomFromSensor( "res:sensor:"+"https://geras.1248.io/series"+url ,function(err,data){
			    if(err) console.log('err  query room from sensor',err);
				else if(!data) console.log('room not found'.red, url);
			    else if(data) {
				    //console.log('find the room '.green,data);
                    if(url.lastIndexOf('motion') >0){
					    console.log('update motion'.green, data.name ,'--------------',data.url);        // "res:sensor:"+"https://geras.1248.io/series"+url,  ,"res:sensor:"+"https://geras.1248.io/series"+url
 						sensorRoomModel.updateMotion(data.url,function(err,data){});
						io.sockets.emit('info',{room:data.name,type:'motion', value:value});
					}
					else if(url.lastIndexOf('temperature') >0){
					    console.log('update temperature '.yellow, data.name,'----------------', data.url); //  "res:sensor:"+"https://geras.1248.io/series"+url,						
						sensorRoomModel.updateTempData(data.url,value,function(err,data){});
						io.sockets.emit('info',{room:data.name,type:'temperature', value:value});
					}
				}
			})	
			
		}catch(e){
			console.log('some thing wrong   ......'.red+e);   
		}
    }		
}


var sensorRoomModel = new SensorRoomModel();
function SensorRoomModel(){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
	
	// name == building name
	function getRoomByBuilding(name,callback){
		var rooms = [];
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('get room by building  error' + error);
			redisClient.quit();
			return callback(error,null);
		}		
		redisClient.keys("res:room:*", function(err, keys) {
			console.log('res key room',keys.length);
			
			var mul = redisClient.multi();
			keys.forEach(function(key){		
			   mul.hmget( key , 'building','floor');
			})		           		
			mul.exec(function (err, replies) {
				console.log("res:room Resource ".green + replies.length + " replies");

			    if(err) { redisClient.quit(); return callback(err,null);}			    
			    else if(!replies){ redisClient.quit(); return callback(null,null);}					
				else{											
					for(var i=0;i<keys.length;i++){
                         if(replies[i][0] != null)					
						 rooms.push({'room':keys[i],'building':replies[i][0], 'floor':replies[i][1]});                        						 
					}

					var groups = _.groupBy(rooms,function(room){
						return (room.building+" "+room.floor);		
					})
					
					_.map(groups,function(group){
					    console.log(group.length);
						console.log('--------------------------------------------------------');
						var array = _.map(group,function(room){
						    delete room.building; delete room.floor;
						    return room.room;
						})
					    return [];
					})
					redisClient.quit();
                    return callback(null,groups);					
                }									
			});						
		});		
	}
	// name == room url
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
	
    // room url
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
	}
 
	// items == room urls
	function getRoomData( items, callback ){
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
		   //mul.hgetall(items[i]);
		   mul.hmget(items[i], 'event', 'time', 'temp','query:motion','query:temperature');  //,'name','diaplayname','temperature','time'
		}
		mul.exec(function (err, replies) {            
			redisClient.quit();
			if(err) {redisClient.quit();return callback(err,null);}			
			else if(!replies){ redisClient.quit(); return callback(null,null);}
            else if(replies) { 
			    redisClient.quit();				
				var rooms = [];
				for(var i=0;i<replies.length;i++){
				   // console.log('get room data ',replies[i]);
					var room = replies[i];
					var short_name = getShortName(items[i]), time = room[1], temp = room[2];
					if(time == null) time = new Date();
					if(temp == null || temp ==0) temp = 0;
				    //rooms.push({url:items[i],name:short_name,event:room[0],time:room[1],temperature:room[2]});
					var url = getURLFromKey(items[i]);
					
					var m_enabled = false, t_enabled = false;
					if(room[3] !=null) m_enabled = true;
					if(room[4]!=null) t_enabled = true;
					
					rooms.push({url:url,name:short_name,event:room[0],time:time,temperature:temp, m_enabled:m_enabled, t_enabled:t_enabled});
				}
							
				return callback(null,rooms);
			}			
		});			
	}

    var getURLFromKey = function(key){
	    //var begin = key.lastIndexOf('res:room:');
		//console.log('getURLfROM KEY'.yellow, key,begin);
	    var url = key.substring(9,key.length);
		return url;
	}
	
	// url == sensor url
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
			    var room_id = data;				
				//redisClient.hgetall(room_id,function(err,room){
				redisClient.hmget(room_id,'event', 'time', 'temp',function(err,room){
                    //console.log('room Data: ' + room_id);
					redisClient.quit();
					if(err) {return callback(err,null);}
					else if(!room[0]) { return callback(null,null);}
					else {					    
						var short_name = getShortName(room_id[0]);					    
					    return callback(null,{url:room_id[0],name:short_name,event:room[0],time:room[1],temperature:room[2]});
					}	
                })
			}	
		});		
	}

	var getShortName = function(url){
	   var array = url.split('/');
	   return array[array.length-1];
	}
	
	function cacheEvents( _callback){
	
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('get room by building  error' + error);
			redisClient.quit();
			return callback(error,null);
		}		
		redisClient.keys("res:room:*", function(err, keys) {
			console.log('res key room',keys);			
            redisClient.quit();

            if(keys!=null){
			    var rooms = [];
			    _.map(keys,function(key){
				    key = key.substring(9,key.length);
					var arr = key.split('/');
					rooms.push({url:key, name: arr[arr.length-1]});
				})
				//console.log(rooms);	
				var tomorrow = false;		
				async.forEach(rooms, 
				  function(room, callback){ 
						console.log('update room events  ', room.url, room.name);		  
						buildingService.fetchResourceDetail(room.url+"/events",function(err,eventlist){
							if(err){
								winston.error('error    '+room.url+"/events");
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
										console.log('events updated  '.green,room.url);				
									}
								});
								callback();
							}
						})
				  },
				  function(err){
					//winston.debug('get all the messages ',util.inspect(events, false, null));
					if(err) _callback(err,null);
					else _callback(null,rooms);
				  } 
				);						
			}			
		});	
	}
	
	function getCachedEvents(rooms, callback){
	    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
		eventModel.getMultiRoomEvents(rooms,early_day,function(err,data){
			if(err){
				console.log('getting events error '.red+err);
				callback(err,null);
			}
			else{
				//_.map(data.events,function(event){  delete event._id; })
				//console.log('getting events  '.green);
				callback(null,data);				
			}		
		});        
	}
	
	function getSensorDataFromRoom(rooms, option, range, _callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('get room by building  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	    
		var mul = redisClient.multi();
		for(var i=0;i<rooms.length;i++){
		   mul.hmget("res:room:"+rooms[i], 'query:'+option); 
		}
		mul.exec(function (err, replies) {            
			redisClient.quit();
			if(err) {redisClient.quit();return _callback(err,null);}			
			else if(!replies){ redisClient.quit(); return _callback(null,null);}
            else if(replies) { 
			    redisClient.quit();				
				var urls = [];
				_.map(replies,function(url){   // res:sensor:
				    url = url[0].substring(11,url[0].length);
					console.log(url);
					urls.push(url);
				})
				
				var sensors = [];
				async.forEach(urls, function(url,callback){
                    //var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
                    var sensor = {};
                    sensor.url = url;					
				    meetingService.getResourceData(url, range, function(err,data){
						if(err)  {
						   console.log(err);
						   sensor.data = [];
						}   
						else {
							//console.log('data   ------------------'.green,url, data.e.length);			
							var senmlParse = function(data){			
								var e = data.e;
								e.forEach(function(data){
								    delete data.n;
									//console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
								})			
							}						
							senmlParse(data);
                            sensor.e = data.e;							
						}
						sensors.push(sensor);
                        callback();						
					})							
				},function(err) {      
				    if(err){
					   console.log(err);
					   _callback(err,null);
				    }
				    else{
					    _callback(null,sensors);
				    }
			    })              
			}			
		});
	}
	
    return {
	    // update the sensor data for the room model
	    updateMotion:updateMotion,        // update room model with sensor data
		updateTempData:updateTempData,    // update room model with sensor data
		// know which room this sensor belongs to
		queryRoomFromSensor:queryRoomFromSensor, // find room from the sensor url
		// get all the meetings for building
		getRoomByBuilding:getRoomByBuilding,  // get rooms by filtering the building and floor
		getRoomData:getRoomData,       // get room info including room name and room sensor data
		
		/////////////////////////////////// events /////////////////////////////////////////////
		cacheEvents:cacheEvents,
		getCachedEvents:getCachedEvents,
		//////////////////////////////////
        getSensorDataFromRoom:getSensorDataFromRoom		
	}
}
/********************88   *********************/

// http://localhost/room/event?url=https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4
// http://localhost/room/event?url=Room.UKCMaple   Room.UKCBeech  Room.UKCWillowA  Room.UKCWillowB  Room.UKCFM10  Room.UKCFM7  Room.UKCFM9
// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF&traverseKey=924a7d4dbfab38c964f5545fd6186559

// http://localhost/room/events?url=Room.UKCMaple,Room.UKCBeech,Room.UKCWillowA 

function getRoomEvents(tomorrow, res){
    var rooms = [
    { 
	  'name': 'Room.UKCWillowA',
      'displayname':'WilA',	
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCWillowB',
	  'displayname':'WilB',
      "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
	  'temperature': 22,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCElm',
	  'displayname':'Elm',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCOak',
	  'displayname':'Oak',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak",
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

app.get('/meetings/arm/tomorrow',function(req,res){
 	getRoomEvents(true,res);
})

app.get('/meetings/arm/now',function(req,res){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	
	var day_begin  = new Date(req.query.start) || default_start_day;
	var day_end = new Date(req.query.end) || default_end_day;
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
	
 	getRoomEvents(false,res);
})

app.get('/arm/meeting/data/motion',function(req,res,next){
    var rooms = [  'Room.UKCWillowA', 'Room.UKCFM10', 'Room.UKCARM66MR11' ,'Room.UKCWillowB','Room.UKCOak'] ;
    _.map(rooms,function(room){	
	    return "https://protected-sands-2667.herokuapp.com/rooms/"+room;
	})
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	var day_begin  = new Date(req.query.start) || default_start_day;
	var day_end = new Date(req.query.end) || default_end_day;
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
	console.log(   day_begin, day_end);
    //var range = "?start="+  ( -60*60*24*2 )+"&end="+ (-100);
    sensorRoomModel.getSensorDataFromRoom(rooms,'motion',range, function(err,data){
	    if(err) res.send(404);
	    else res.send(200,data);
	})
});


app.get('/arm/meeting/today', getMultiRoomEvents);
function getMultiRoomEvents(req,res,next){
    var rooms = [  'Room.UKCWillowA', 'Room.UKCFM10', 'Room.UKCARM66MR11' ,'Room.UKCWillowB','Room.UKCOak'] ;
    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
	// certain day	
	var day_begin  = new Date(2014,1,27,8,0,0);
	var day_end = new Date(2014,1,27,18,0,0);
		
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

app.get('/catchevents',function(req,res){

    sensorRoomModel.cacheEvents(function(err,rooms){
	    if(err) res.send(500);
		else res.send(200,rooms);
	})
	
})

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

	//var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
    var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
	
    meetingService.getResourceData('armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion',range,function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data.e.length);			
			var senmlParse = function(data){			
			    var e = data.e;
				e.forEach(function(data){
				    console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				})			
			}						
			senmlParse(data);		   
		}	
    })	
	
}
*/


var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 7;
rule.minute = 11;

var j = schedule.scheduleJob(rule, function(){
    console.log('Today is recognized by Rebecca Black!');
	sensorRoomModel.cacheEvents(function(err,rooms){
	    if(err)  console.log('err for catche the events');
		else if(rooms)
        console.log('finsh '.green,'cache all the room events');
	})	
});


/*
var agenda = new Agenda({db: { address: 'localhost:27017/agenda-example'}});
agenda.schedule('today at 8:47am', 'cacheARMEvents');
agenda.start();
agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});
agenda.once('success:cacheARMEvents', function(job) {
  console.log("success:request events for arm room: %s", job);
});
agenda.on('fail:cacheARMEvents', function(err, job) {
  console.log("Job failed with error: %s", err.message);
});

agenda.define('cacheARMEvents', function(job, done) {
    getArmMeetingSchedules(done)
});
function getArmMeetingSchedules(done){

}
*/