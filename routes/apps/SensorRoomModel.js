var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto'),	
     _=require('underscore'),
	 redis = require('redis');
 
var errors = require('../../utils/errors'),
	config = require('../../conf/config'),
	winston = require('../../utils/logging.js'),
	eventModel = require('../../model/event_model.js');
	
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
			   mul.hmget( key , 'building','floor','site');
			})		           		
			mul.exec(function (err, replies) {
				console.log("res:room Resource ".green + replies.length + " replies");

			    if(err) { redisClient.quit(); return callback(err,null);}			    
			    else if(!replies){ redisClient.quit(); return callback(null,null);}					
				else{											
					for(var i=0;i<keys.length;i++){
                         if(replies[i][0] != null)					
						 rooms.push({'room':keys[i],'building':replies[i][0], 'floor':replies[i][1],'site':replies[i][2]});                        						 
					}

					var groups = _.groupBy(rooms,function(room){
						return (room.site+" "+room.building+" "+room.floor);		
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
	
	function getAllRooms(callback){
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
			   mul.hmget( key , 'building','floor','site');
			})		           		
			mul.exec(function (err, replies) {
				console.log("res:room Resource ".green + replies.length + " replies");

			    if(err) { redisClient.quit(); return callback(err,null);}			    
			    else if(!replies){ redisClient.quit(); return callback(null,null);}					
				else{											
					for(var i=0;i<keys.length;i++){
                         if(replies[i][0] != null)					
						 rooms.push({'room':keys[i],'building':replies[i][0], 'floor':replies[i][1],'site':replies[i][2]});                        						 
					}
					redisClient.quit();
                    return callback(null,rooms);					
                }									
			});						
		});		
	}

	function searchSite(key,callback){
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
		redisClient.keys(key, function(err, keys) {
			console.log('res key room',keys.length);		
			var mul = redisClient.multi();
			keys.forEach(function(key){		
			   console.log('key    ',key);
			   mul.hmget( key , 'building','floor','site','room');
			})		           		
			mul.exec(function (err, replies) {
				console.log("res:room Resource ".green + replies.length + " replies");

			    if(err) { redisClient.quit(); return callback(err,null);}			    
			    else if(!replies){ redisClient.quit(); return callback(null,[]);}					
				else{											
					for(var i=0;i<keys.length;i++){
                         if(replies[i][0] != null)					
						 rooms.push({'building':replies[i][0], 'floor':replies[i][1],'site':replies[i][2],'room':replies[i][3]}); 
                        console.log(replies[i][0],replies[i][1],replies[i][2]);						 
					}
					redisClient.quit();
                    return callback(null,rooms);
                }									
			});						
		});	
	}
	
    function saveAllSites(rooms , callback){
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
		rooms.forEach(function(room){		
		   mul.sadd( "site:"+room.site+":"+room.building+":"+room.floor, JSON.stringify({'site':room.site, 'room':room.room,'building':room.building,'floor':room.floor}));
		})		           		
		mul.exec(function (err, replies) {
			console.log("saveAllSites".yellow + replies.length + " replies");

			if(err) { redisClient.quit(); return callback(err,null);}			    
			else if(!replies){ redisClient.quit(); return callback(null,null);}					
			else{											
				redisClient.quit();
				return callback(null);					
			}									
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
				var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
				data.events = _.filter(data.events, function(event){  
												  var eventDate = new Date(event.endDate);  
												  return eventDate.getTime() <= late_day.getTime(); 
												});
				//console.log('getting events  '.green);
				callback(null,data);				
			}		
		});        
	}
	
	function getSensorDataFromRoom(meetingService,rooms, option, range, _callback){
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
		searchSite:searchSite,
		getAllRooms:getAllRooms,
		saveAllSites:saveAllSites,
		getRoomByBuilding:getRoomByBuilding,  // get rooms by filtering the building and floor
		getRoomData:getRoomData,       // get room info including room name and room sensor data
		
		/////////////////////////////////// events /////////////////////////////////////////////
		cacheEvents:cacheEvents,
		getCachedEvents:getCachedEvents,
		//////////////////////////////////
        getSensorDataFromRoom:getSensorDataFromRoom		
	}
}
	 
module.exports =  new SensorRoomModel();	 