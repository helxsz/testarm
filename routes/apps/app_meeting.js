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
	simulation = require('../simulation.js'),
	sensorHandler = require('../sensorHandler.js');
/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting'); 
var buildingService = serviceCatalog.findByName('armbuilding');  

initApp();
function initApp(){

	appBuilder.createApp('meetingroom',new MeetingRoomMQTTHandler().handleMessage, function(err,app){
		if(err) winston.error('error in create app');
		else winston.info('app is created  meetingroom   '+app.id);  // 
		app.subscribeService('armmeeting',function(err,success){
			if(err) winston.error('errro in subscrption ');
			else winston.info('subscribe success');
		})
	});

}


	
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
		    var url = msg.n, value = msg.v, time = new Date(msg.t*1000);
		    //console.log('MQTT:  '.green,"https://geras.1248.io/series"+url, value, time);			
            var attrs = url.split('/'); var property = attrs[attrs.length-1];var parent_url = url.substring(0, url.indexOf(property)-1);			
				sensorRoomModel.queryRoomFromSensor( "res:sensor:"+"https://geras.1248.io/series"+parent_url ,function(err,data){
					if(err) console.log('err  query room from sensor',err);
					else if(!data) console.log('room not found'.red, parent_url,property,value);
					else if(data) {
						//console.log('find the room '.green,data.url,data.name);
						if(property == 'temperature'){
						    //console.log('update temperature '.yellow, data.name,'----------------', data.url); 
							sensorRoomModel.updateTempData(data.url,value,function(err,data){});
							io.sockets.emit('info',{room:data.name,type:'temperature', value:value});						
						}else if(property == 'motion'){
						    //console.log('update motion'.green, data.name ,'--------------',data.url);
							sensorRoomModel.updateMotion(data.url,time,function(err,data){});
							io.sockets.emit('info',{room:data.name,type:'motion', value:value, time: time});						
						}else if(property == 'online'){
						    //console.log('update online '.yellow, data.name,'----------------', data.url,value);
							if(value == 0) console.log('update offline '.red, data.name,'----------------', data.url);
							sensorRoomModel.updateOnline(data.url,value,function(err,data){});
							io.sockets.emit('info',{room:data.name,type:'online', value:value});							
						}					
					}
				})						
		}catch(e){
			console.log('some thing wrong   ......'.red+e);   
		}
    }		
}


var sensorRoomModel = new SensorRoomModel();


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
		//if(temp_name.length > 3)
		//temp_name = temp_name.substring(0,3)+temp_name[temp_name.length-1];	
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
				//console.log('........................'+room.name+"       " +room.url);
				var tomorrow = false;
				buildingService.fetchResourceDetail(room.url+"/events",function(err,eventlist){
					if(err){
						winston.error('error    '+room.url+"/events");
						room.events = [];	
					}else{
						var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
						// all events in this day
						if(tomorrow)
						eventlist = _.filter(eventlist, function(event){ 
						                                                var eventDate = new Date(event.endDate);  
						                                               // console.log('end date'.green,eventDate); 
                                                  						return eventDate.getTime() > late_day.getTime(); });
						else
						eventlist = _.filter(eventlist, function(event){  
						                                                  var eventDate = new Date(event.endDate);  
																		 //  console.log('end date'.green,eventDate); 
						                                                  return eventDate.getTime() <= late_day.getTime(); 
																	    });
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

app.get('/buildings/:name/:floor/cache',function(req,res){
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
			
    	    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);			
			sensorRoomModel.getCachedEvents(rooms_array,early_day,function(err,data){				
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
	function updateMotion(name,time,callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('updateMotion  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	
		
		redisClient.hmset(name, 'time',time, 'displayname',name,function(err, data){
			redisClient.quit();
			if(err) {return callback(err,null);}
			else if(data) { return callback(null,data);}
			else { return callback(null,null);}	
		});

		redisClient.quit();
	}
	
	function updateOnline(name,online,callback){
		var redisClient;	
		try{ 
			redisClient = redis.createClient(redis_port,redis_ip);
		}
		catch (error){
			console.log('updateOnline  error' + error);
			redisClient.quit();
			return callback(error,null);
		}	
		
		redisClient.hmset(name, 'online',online, function(err, data){
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
        
		items = _.map(items,function(item){
            var begin = item.lastIndexOf('http');
		    if(begin==0) return 'res:room:'+item;
            else return item;		    
		})
		
		var mul = redisClient.multi();
		for(var i=0;i<items.length;i++){
		   //mul.hgetall(items[i]);
		   mul.hmget(items[i], 'event', 'time', 'temp','query:motion','query:temperature','online');  //,'name','diaplayname','temperature','time'
		}
		mul.exec(function (err, replies) {            
			redisClient.quit();
			if(err) {redisClient.quit();return callback(err,null);}			
			else if(!replies){ redisClient.quit(); return callback(null,null);}
            else if(replies) { 
			    redisClient.quit();				
				var rooms = [];
				for(var i=0;i<replies.length;i++){
				    //console.log('get room data ',replies[i]);
					var room = replies[i];
					var short_name = getShortName(items[i]), time = room[1], temp = room[2];
					if(time == null) time = new Date();
					if(temp == null || temp ==0) temp = 22.5 ;
				    //rooms.push({url:items[i],name:short_name,event:room[0],time:room[1],temperature:room[2]});
					var url = getURLFromKey(items[i]);
					
					var m_enabled = false, t_enabled = false, online=false ;
					if(room[3] !=null) m_enabled = true;
					if(room[4]!=null) t_enabled = true;
					if(room[5]!=null) {
					    if(room[5]==1) online = true;
						else if(room[5]==0) online = false;
					}
					if(m_enabled)
					rooms.push({url:url,name:short_name,event:room[0],time:time,temperature:temp, m_enabled:m_enabled, t_enabled:t_enabled, sensor: room[3], online:online});
					else 
					rooms.push({url:url,name:short_name,event:room[0],time:time,temperature:temp, m_enabled:m_enabled, t_enabled:t_enabled, online: online});					
					//console.log('^^^^^^^^^^^^^^^'.green,url, m_enabled, t_enabled);
				}
							
				return callback(null,rooms);
			}			
		});			
	}

    var getURLFromKey = function(key){
	    var begin = key.lastIndexOf('http');
		//console.log(';;;   ',key);
		if(begin==0) return key;
		else{
	        var url = key.substring(9,key.length);
		    return url;
		}
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
								//console.log('eventlist'.green,room.name, eventlist.length, late_day);
								if(tomorrow)
								eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() > late_day.getTime(); });
								else
								eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate); return eventDate.getTime() <= late_day.getTime(); });				
								room.events = eventlist;
								console.log('filtered  ... '+room.events.length);
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
	
	function getCachedEvents(rooms, early_day, callback){
		eventModel.getMultiRoomEvents(rooms,early_day,function(err,data){
			if(err){
				console.log('getting events error '.red+err);
				callback(err,null);
			}
			else{
				_.map(data.events,function(event){  delete event._id; })
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
				_.map(replies,function(url,i){   // res:sensor:
				    //console.log(url);
					if(url[0]!=null){
				        //url = url[0].substring(11,url[0].length);					
					    urls.push({url:url,room:rooms[i]});
					}
				})
				
				var sensors = [];
				async.forEach(urls, function(obj,callback){
                    //var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
                    var sensor = {};
                    sensor.url = obj.url;
					sensor.room = obj.room;
				    meetingService.getResourceData(obj.url, range, function(err,data){
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
		updateOnline:updateOnline,
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
function getAllMajoryBuildingRooms(){
    var ss = ["ARM6 0","ARM6 1","ARM3 0","ARM3 1","ARM2 0","ARM2 1","ARM1 0","ARM1 1"];
	var rooms = [];
    ss.forEach(function(e){
	    var roomarray = simulation.buildings[e];
		for(var i=0;i<roomarray.length;i++){
		   var arr = roomarray[i].room.split('/');
		   rooms.push( "https://protected-sands-2667.herokuapp.com/rooms/"+arr[arr.length-1])
		}	    
	})
	return rooms;
}
// /arm/meeting/history/:name/:floor
app.get('/arm/meeting/history/all',function(req,res,next){	
	var rooms = getAllMajoryBuildingRooms();
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
	    else{
		    _.map(data,function(sensor){
			    //console.log('......getSensorDataFromRoom......'.red,sensor.url, sensor.room, day_begin,day_end, sensor.e.length);
			})
    		res.send(200,data);
		}	
	})
});


app.get('/buildings/history/events/all',function(req,res){
	var array = getAllMajoryBuildingRooms();
	
	sensorRoomModel.getRoomData(array, function(err,rooms){
		if(err) {  console.log('get room error '.red); res.send(500)}
		else if(!rooms) { console.log('no data for room'.red); res.send(404);}
		else{		   
			//console.log('get rooms data '.green, rooms);
			var rooms_array = [];
			_.map(rooms,function(room){
			    rooms_array.push(room.name);
			})
			
	
	        var day_begin  = new Date(req.query.start);
    	    var early_day = new Date(day_begin.getFullYear(),day_begin.getMonth(),day_begin.getDate(),0,0,0);
			
			sensorRoomModel.getCachedEvents(rooms_array,early_day,function(err,data){				
			    if(err) res.send(500);
			    else{					
					var hash = {};
					_.map(data,function(room_event){
						hash[room_event.url] = room_event.events;
					})
					
					_.map(rooms,function(room){
						room.events = hash[room.url];						
					})
					//console.log(rooms);
     				res.send(200,{rooms:rooms});
					delete hash;
					delete rooms_array;
				}				
			})            			
		}
	})
})

// https://protected-sands-2667.herokuapp.com/people/Geraint%20Luff 
// http://localhost/arm/people?people=Geraint%20Luff
app.get('/arm/people',function(req,res){
    var people = req.query.people;
	console.log('people   ',people);
    var list = people.split(',');
	var info = [];
	async.forEach(list, 
		  function(person, callback){
				buildingService.getOtherResource('https://protected-sands-2667.herokuapp.com/people/'+person,function(err,data){
					if(err)  console.log(err);
					else {
						//console.log('data   ------------------'.green,data);
						if(data.length>0) info.push(data[0]);							   
					}
					callback();						
				})			  
		  },			  
		  function(err){
			//winston.debug('get all the messages ',util.inspect(events, false, null));
			res.send(200,info);
		  } 
	);  
})


app.get('/catchevents',function(req,res){
    sensorRoomModel.cacheEvents(function(err,rooms){
	    if(err) res.send(500);
		else res.send(200,rooms);
	})
})

  
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 4)];
rule.hour = 8;
rule.minute = 40;

var j = schedule.scheduleJob(rule, function(){
    console.log('running the event schedule rule!');
	sensorRoomModel.cacheEvents(function(err,rooms){
	    if(err)  console.log('err for catche the events');
		else if(rooms)
        console.log('finsh '.green,'cache all the room events');
	})	
});

var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = [0, new schedule.Range(0, 6)];
rule2.hour = 20;
rule2.minute = 54;

var j = schedule.scheduleJob(rule2, function(){
    console.log('running the event analytics rule!');
	var array = getAllMajoryBuildingRooms();
	
	sensorRoomModel.getRoomData(array, function(err,rooms){
		if(err) {  console.log('get room error '.red); res.send(500)}
		else if(!rooms) { console.log('no data for room'.red); res.send(404);}
		else{		   
			//console.log('get rooms data '.green, rooms);
			
			var rooms_array = _.filter(rooms,function(room){
			    if(room.m_enabled){
			        var hours = (new Date().getTime() - new Date(room.time))/1000/60/60;
				    //console.log(room.name, hours);
                    return room.m_enabled == true && ( hours > 20);				    
				}
                return false;	     
			})
				
	        console.log('these room motion might be not working ',rooms_array.length);          			
		}
	})	
});



// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0/motion   lecture room
// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08/motion   box
// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10/motion   elm
app.get('/test/timeseries/now',function(req,res,next){
    var id = req.query.id;
    var MS_PER_MINUTE = 60000;
	var now = new Date();
    sensorHandler.getSensorData(id, new Date(now.valueOf() - 10*60 * MS_PER_MINUTE) , now ,function(err,data){
	    if(err) res.send(500,err);
	    else if(data) res.send(200,data);
		else if(!data) res.send(404);
	})
})

/**   test **/

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
		//if(temp_name.length > 3)
		//temp_name = temp_name.substring(0,3)+temp_name[temp_name.length-1];	
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

app.get('/test/sensor',function(req,res){
    var sensor = req.query.sensor;

    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);	
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	var day_begin  = new Date(req.query.start) || default_start_day;
	var day_end = new Date(req.query.end) || default_end_day;
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
      
    var sensors = [
	    'armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-31-3F/online',
	    'armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-35-0A/online',
		'armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-63/online',
		'armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/online',
        'armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08/online',
        'armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0/online',
        'armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10/online'		
	]; 
    var s = [];
    async.forEach(sensors, 
			  function(sensor, callback){
					meetingService.getResourceData(sensor,'',function(err,data){
						if(err)  console.log(err);
						else {
							console.log('data   ------------------'.green,data.e.length);
                            var time = [];										
							var e = data.e;
							e.forEach(function(data){
								//console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
								//time.push( moment(data.t*1000 ).fromNow() );
							})
							console.log(sensor, 'what the fuck  '.red,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow() );
                          							
							s.push({e:data.e, 'sensor':sensor, 'time':time});						
									   
						}
                        callback();						
					})			  
			  },			  
			  function(err){
				//winston.debug('get all the messages ',util.inspect(events, false, null));
				res.send(200,s);
			  } 
			);
})


app.get('/test/sensor/2',function(req,res){
    var sensor = req.query.sensor;
      
    var sensors = [
	    '/armmeeting/19/MotionSensor/00-0D-6F-00-00-C1-31-3F',
	    '/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-35-0A',
		'/armmeeting/2/MotionSensor/00-0D-6F-00-00-C1-3F-63',
		'/armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6',
        '/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08',
        '/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0',
        '/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10',
        '/armmeeting/5/MotionSensor/00-0D-6F-00-00-C1-31-4D'		// birch
	]; 
    var s = [];
    async.forEach(sensors,
			  function(sensor, callback){
					meetingService.getResourceDataNow(sensor,'online',function(err,data){
						if(err)  console.log(err);
						else {
						    var e = data.e;
							console.log('data   ------------------ length'.green,data.e.length,moment(e[0].t *1000 ).fromNow() );
                            if(data.e.length>0)	s.push(data.e[0]);																			
						}
                        callback();						
					})			  
			  },			  
			  function(err){
				//winston.debug('get all the messages ',util.inspect(events, false, null));
				res.send(200,s);
			  } 
			);
})