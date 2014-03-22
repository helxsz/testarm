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
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	simulation = require('../simulation.js'),
	access_control = require('../access_control_api.js'),
	sensorHandler = require('../sensorHandler.js'),
	catalogFactsModel = require('../../model/catalog_fact_model.js'),
	catalogModel = require('../../model/catalog_model.js'),
	roomModel = require('../../model/room_model.js'),
	catalogFilter = require('../catalog_filter.js'),
	catalogDB = require('../catalog_db.js'),
	sensorRoomModel = require('./SensorRoomModel.js'),
	appModel = require('../../model/app_model.js');
/****   experiment 2 ********/
appModel.searchApp('meetingapp',function(err,data){
    if(err)  console.log('app not found with err'.red,err);
	else if(!data){
    	console.log('app not found '.red);
		appModel.createApp({name:'meetingapp'},function(){
			console.log('created meeting app');
		})		
	}else if(data){
	    //console.log('found the app '.green, data);
		/*		test
		appModel.updateAppCatalog('meetingapp',{'url':'https://geras.1248.io/cat/armmeeting',key:'sensor111','profile':'sensor'},function(err,data){
			console.log('update ',data);
		})
		
		appModel.updateAppCatalog('meetingapp',{'url':'https://protected-sands-2667.herokuapp.com/cat-1',key:'room111','profile':'room'},function(err,data){
			console.log('update ',data);
		})

		appModel.updateAppCatalog('meetingapp',{'url':'https://protected-sands-2667.herokuapp.com/cat-2',key:'room232','profile':'room'},function(err,data){
			console.log('remove ',data);
		})
		

		appModel.removeAppCatalog('meetingapp',{'url':'https://protected-sands-2667.herokuapp.com/cat-2'},function(err,data){
			console.log('update ',data);
		})
		*/
        			
        //appModel.findAppCatalogsByProfile('meetingapp','room',function(err,data){
		appModel.searchCatalogProfiles('meetingapp','room',function(err,catalogs){
		    console.log('??????????????????????? catalog app'.yellow,catalogs);
			if(catalogs && catalogs.length>0){          
                catalogModel.searchCatalogResource(catalogs[0].url,'https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBox',function(err,data){
					if(err) { console.log('getCatalogResoures   ---  get local catalog data '.red); }
					else if(!data){  console.log(' no catalogs found');  }
					else{
						console.log('0-----------------------------------'.yellow,data);
					}
				})
			}
		})
	}
})

var filter = new catalogFilter();
initApp();
function initApp(){
	appBuilder.createApp('meetingroom',new MeetingRoomMQTTHandler().handleMessage, function(err,app){
		if(err) winston.error('error in create app');
		else winston.info('app is created  meetingroom   '+app.id);  // 
		app.subscribeService('armmeeting',function(err,success){
			if(err) winston.error('errro in subscrption ');
			else winston.info('subscribe success');
		})		
		app.subscribeCatalogNotification('catalog',function(pattern,channel,message){
		    console.log('meeting app receive catalog notification   '.yellow, message);			
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
}


app.get('/admin/meeting/data/empty',function(req,res,next){
    console.log('clear rooms ...... rquest');
    catalogDB.flushDB('res:sensor:*',function(){
        catalogDB.flushDB('res:room:*',function(){
            roomModel.clearRooms({},function(){
			    console.log('clear rooms ');
			    res.send(200);
			})	
	    });
	});
})


function checkCatalogUpdate(catalog){
	//console.log('subscribeCatalogNotification   '.green,catalog.url, catalog.profile, catalog.types);
	if(catalog.profile == 'sensor' && catalog.types.motion ==1 ){   //_.contains(catalog.types, 'motion')	
		catalogModel.getCatalogResoures(catalog.url,function(err,data){
			if(err) console.log('catalog facts  store error '.red,catalog.url, err);
			else if(!data){console.log('no data in the catalog ');}
			else if(data){
			    /**/
			    appModel.updateAppCatalog('meetingapp',{'url':catalog.url,key:catalog.key,'profile':catalog.profile},function(err,data){
			           console.log('update ',data);
		        })
				
			
				 console.log('-------------------------------------------',data.url,data.res.length);
				 async.forEach(data.res, function(obj,callback){
					catalogDB.saveResource('res:sensor:'+obj.url, obj,function(){callback();});
				 })
			}
		})
	}else if(catalog.profile =='room'){
		catalogModel.getCatalogResoures(catalog.url,function(err,data){
			if(err) console.log('catalog facts  store error '.red,catalog.url, err);
			else if(!data){console.log('no data in the catalog ');}
			else if(data){
				console.log('-------------------------------------------',data.url,data.res.length);
			    appModel.updateAppCatalog('meetingapp',{'url':catalog.url,key:catalog.key,'profile':catalog.profile},function(err,data){
			           console.log('update ',data);
		        })				
				
				async.forEach(data.res, function(obj,callback){
								console.log('.,,,,,,,,',obj.url);
								catalogDB.saveResource('res:room:'+obj.url, obj,function(){  callback(); });
							},function(err){
								console.log('complete room in redis '.yellow);
								sensorRoomModel.getAllRooms(function(err,rooms){
										if(err) {console.log('get all rooms  error '.red, err);}
										else if(!rooms){console.log('get all rooms   ',rooms);}
										else{
											console.log('-------------------------------------------------');
											console.log(rooms.length);
											rooms.forEach(function(room){
												if(room.floor == 'Ground') room.floor = 0;
												else if(room.floor == '1st')  room.floor = 1;
												roomModel.pushRoom(room,function(err,data1){
													if(err) console.log('update error  '.red,err);
													else if(!data1) console.log('push room data empty  '.rred);
													else if (data1)
													{
														console.log('save the room    '.green,catalog.url);
													}  
												});									
											})                              							
										}
								})                       						
					});				 
			}
		})		
	}
}


// http://localhost/meeting/integrate
app.get('/meeting/catalog/integrate',function(req,res,next){
    integrateMeetingRoom(function(data){
	    res.send(200,data);
	})
})

function integrateMeetingRoom(_callback){
	console.log('integate'.green);
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
	// get all keys 
	var rooms  = [];      	
	var sensors = [];

	async.parallel([
		function(callback){
			redisClient.keys("res:room:*", function(err, keys) {
				console.log('res key room',keys.length);			
				var mul = redisClient.multi();
				keys.forEach(function(key){		
				   mul.hmget( key , 'sameAs');
				})		           		
				mul.exec(function (err, replies) {
					console.log("res:room Resource ".green + replies.length + " replies");
					//console.log("res:room Resource ".green + replies + " replies");
					//console.log("res:room Resource ".green + keys + " keys");
																
					for(var i=0;i<keys.length;i++){		
						 rooms.push({'rid':keys[i],'sameas':replies[i][0]});							 
					}					
					callback();
				});					
			});   
		},
		function(callback){
			redisClient.keys("res:sensor:*", function(err, keys) {
				console.log('res key sensor',keys.length);
				var mul = redisClient.multi();
				keys.forEach(function(key){		
				   mul.hmget( key , 'sameAs','motion','temperature','online','lat','long');
				})		           		
				mul.exec(function (err, replies) {
					console.log("res:sensor Resource ".green + replies.length + " replies");
					//console.log("res:sensor Resource ".green + replies + " replies");
					//console.log("res:sensor Resource ".green + keys + " keys");
										
					for(var i=0;i<keys.length;i++){		
						 sensors.push({'sid':keys[i],'sameas':replies[i][0],'motion':replies[i][1],'temperature':replies[i][2],'online':replies[i][3],'lat':replies[i][4],'long':replies[i][5]});
						 
					}
					callback();						
				});            
			});	
		}
	],function(err, results){
		console.log('compare the resources    '.green, rooms.length, sensors.length);
		//console.log(rooms[0], sensors[0]);
		var match = 0, matchs = [];
		for(var i=0;i<sensors.length;i++){
			for(var j=0;j<rooms.length;j++){
				//console.log(sensors[i].sameas[0] , rooms[j].sameas[0]);
				if(sensors[i].sameas == rooms[j].sameas){
					//console.log('find match   '.green, sensors[i].sid, rooms[j].rid);
					match ++;					
					matchs.push({ 'sid':sensors[i].sid, 'rid': rooms[j].rid,'motion':sensors[i].motion,'temperature':sensors[i].temperature,'online':sensors[i].online,'lat':sensors[i].lat,'long':sensors[i].long})
					continue;
				}
			}
		}
		console.log(' found match  number   '.green+matchs.length);	
		var mul = redisClient.multi();		
		for(var i=0;i<matchs.length;i++){
			//console.log('---------------------------- mateched room and sensor pair:',matchs[i]);
			mul.hmset( matchs[i].sid , 'room', matchs[i].rid)  // link the sensor with room
			// link the room with sensor property
			if( matchs[i].temperature){
				mul.hmset( matchs[i].rid , 'query:temperature',matchs[i].temperature );
				//console.log('match temperature'.green,matchs[i].temperature);
			}
			if( matchs[i].motion){
				mul.hmset( matchs[i].rid , 'query:motion',matchs[i].motion );
				//console.log('match motion'.green, matchs[i].motion);
			}			
			if( matchs[i].online){
				mul.hmset( matchs[i].rid , 'query:online',matchs[i].online );
				//console.log('match online'.green, matchs[i].online);
			}
			if( matchs[i].lat){
				mul.hmset( matchs[i].rid , 'lat',matchs[i].lat );
				//console.log('match lat'.green, matchs[i].lat);
			}
			if( matchs[i].long){
				mul.hmset( matchs[i].rid , 'long',matchs[i].long );
				//console.log('match long'.green, matchs[i].long);
			}			
		}
		mul.exec(function (err, replies) {
			console.log("res:sensor Resource ".green + replies.length + " replies");								
		}); 		
		delete sensors, rooms;
		redisClient.quit();	

        if(_callback) _callback(matchs);
		
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
		    //console.log('MQTT:  '.green,"https://geras.1248.io/series"+url, pattern,channel);			
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
						    if( (new Date() - time.getTime())>1000*60*3){
						        console.log('no need to update motion'.red, data.name ,'--------------',data.url , time  );
								sensorRoomModel.updateMotion(data.url,time,function(err,data){});
							}
							else{ 
								console.log('update motion'.green, data.name ,'--------------',data.url);
								sensorRoomModel.updateMotion(data.url,time,function(err,data){});
								io.sockets.emit('info',{room:data.name,type:'motion', value:value, time: time});
                            }							
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

 /*
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB&traverseKey=924a7d4dbfab38c964f5545fd6186559
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fprotected-sands-2667.herokuapp.com%2Fcat&traverseKey=0L8kgshd4Lso3P1UQX7q&Submit=Browse
http://schema.org/Place
*/

app.get('/',access_control.authUser,function(req,res){
   res.render('index.html');
})

app.get('/app/meetingroom',access_control.authUser,function(req,res, next){  
    var token = (Math.random() * 1e18).toString(36);
	console.log('token   ',token);
	
	String.prototype.reverse = function() {
       return this.split('').reverse().join('');
    }
	
	token = token + token.reverse();
	req.session.token = token;
	res.redirect('/apps/'+token);
})

app.get('/apps/:token',access_control.authUser, function(req,res,next){
    
    var url_token = req.params.token;
    var token = req.session.token;
	console.log('apps token  random   ', url_token, token);
    if(token && url_token == token) res.render('meeting2.html');
	else res.redirect('/');
})


function escapeRegExp(str) {
   return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function replaceAll(find, replace, str) {
   return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// the room data  API
app.get('/sites/:site/:building?/:floor?',access_control.authUser,function(req,res){
    var building = req.params.building, floor = req.params.floor, site = req.params.site;
	var query = {};
	if(building !=null) query['building'] = building;
	if(floor !=null) query['floor'] = floor;
	if(site !=null) query['site'] = replaceAll("_"," ",site);;
	var array = [];
	if(query['site']==null){ return res.send(404,{error:'parameter wrong'})};

	console.log('query site ',site,building, floor , query);
	
	roomModel.searchRooms(query,function(err,data){
	    if(err) { console.log('search room error  ');res.send(500); }
		else if(!data) {  console.log('search room empty' ); res.send(400); }
		else if(data){
		    //console.log('query  ',data);
			for(var i=0;i<data.length;i++){
				array.push(data[i].room)
			}			
			sensorRoomModel.getRoomData(array, function(err,rooms){
				if(err) {  console.log('get room error '.red); res.send(500)}
				else if(!rooms) { console.log('no data for room'.red); res.send(404);}
				else{		   
					//console.log('get rooms data ----------------------'.green, rooms);
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
		}
	})	
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		return temp_name;
	}
})

// old API
app.get('/buildings/:building/:floor/cache',access_control.authUser,function(req,res){
    var building = req.params.building, floor = req.params.floor;
	building = building || 'ARM1';
	floor = floor || 0;
	//var rooms = simulation.buildings[name+" "+floor];
	//console.log(rooms);
	console.log('get buildings and floor ',building, floor);
	var array = [];
	
	function escapeRegExp(str) {
	   return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
	function replaceAll(find, replace, str) {
	   return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	}	
	
	var building = replaceAll("_"," ",building);
	
	roomModel.searchRooms({building:building,floor:floor},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
			for(var i=0;i<data.length;i++){
				array.push(data[i].room)
			}			
			sensorRoomModel.getRoomData(array, function(err,rooms){
				if(err) {  console.log('get room error '.red); res.send(500)}
				else if(!rooms) { console.log('no data for room'.red); res.send(404);}
				else{		   
					//console.log('get rooms data ----------------------'.green, rooms);
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
		}
	})	
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		return temp_name;
	}
})

app.get('/sensors/history',function(req,res,next){
    var ids = req.query.urls;
	var urls = ids.split(',');
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	var day_begin = default_start_day;
	var day_end = default_end_day;
	if(req.query.start != null) day_begin  = new Date(req.query.start);
    if(req.query.end != null) day_end = new Date(req.query.end);	
	
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
    console.log(  urls, day_begin, day_end);
    
    searchMotionHistory( urls, range, function(err,data){
	    if(err) res.send(404);
	    else{
		    _.map(data,function(sensor){
			    //console.log('......getSensorDataFromRoom......'.red,sensor.url, sensor.room, day_begin,day_end, sensor.e.length);
			})
    		res.send(200,data);
		}	
	})	

})

function searchMotionHistory( urls, range, _callback){
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

/**********************************************   ********************************************************/

/********************
// http://localhost/room/event?url=https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4
// http://localhost/room/event?url=Room.UKCMaple   Room.UKCBeech  Room.UKCWillowA  Room.UKCWillowB  Room.UKCFM10  Room.UKCFM7  Room.UKCFM9
// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF&traverseKey=924a7d4dbfab38c964f5545fd6186559
// http://localhost/room/events?url=Room.UKCMaple,Room.UKCBeech,Room.UKCWillowA 

get simulated rooms 
meeting service

		appModel.searchCatalogProfiles('meetingapp','sensor',function(err,catalogs){
		    console.log('??????????????????????? catalog app'.yellow,catalogs);
			if(catalogs && catalogs.length>0){
                catalogModel.searchCatalogResource(catalogs[0].url,'https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBox',function(err,data){
					if(err) { console.log('getCatalogResoures   ---  get local catalog data '.red); }
					else if(!data){  console.log(' no catalogs found');  }
					else{
						console.log('0-----------------------------------'.yellow,data);
					}
				})
			}
		})

 *********************/
var meetingService; 

serviceCatalog.findByURL('https://geras.1248.io/cat/armmeeting',function(err,service){
    if(err || !service){
	    console.log(' catalog can not be found ',err);
	}else {
	    console.log('find the service catalog '.green,service.serviceObj.url);
        meetingService = service;
	}
});

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
app.get('/arm/meeting/history/all',access_control.authUser,function(req,res,next){	
	var rooms = getAllMajoryBuildingRooms();
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	var day_begin  = new Date(req.query.start) || default_start_day;
	var day_end = new Date(req.query.end) || default_end_day;
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
	console.log(   day_begin, day_end);
    //var range = "?start="+  ( -60*60*24*2 )+"&end="+ (-100);
	console.log(rooms);
    sensorRoomModel.getSensorDataFromRoom(meetingService,rooms,'motion',range, function(err,data){
	    if(err) res.send(404);
	    else{
		    _.map(data,function(sensor){
			    //console.log('......getSensorDataFromRoom......'.red,sensor.url, sensor.room, day_begin,day_end, sensor.e.length);
			})
    		res.send(200,data);
		}	
	})
});

app.get('/buildings/history/events/all',access_control.authUser,function(req,res){
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


app.get('/meeting/cacheevents',access_control.authUser,function(req,res){
    sensorRoomModel.cacheEvents(buildingService,function(err,rooms){
	    if(err) res.send(500);
		else res.send(200,rooms);
	})
})

/******************************************************************************
building service might not be used

		appModel.searchCatalogProfiles('meetingapp','room',function(err,catalogs){
		    console.log('??????????????????????? catalog app'.yellow,catalogs);
			if(catalogs && catalogs.length>0){
                catalogModel.searchCatalogResource(catalogs[0].url,'https://protected-sands-2667.herokuapp.com/rooms/Room.UKCBox',function(err,data){
					if(err) { console.log('getCatalogResoures   ---  get local catalog data '.red); }
					else if(!data){  console.log(' no catalogs found');  }
					else{
						console.log('0-----------------------------------'.yellow,data);
					}
				})
			}
		})

******************************************************************************/
var buildingService;
serviceCatalog.findByURL('https://protected-sands-2667.herokuapp.com/cat-1',function(err,service){
    if(err || !service){
	    console.log(' catalog can not be found ',err);
	}else if(!service){  console.log('no data in the catalog ');}
	else{
	    console.log('find the service catalog '.green,service.serviceObj.url);
        buildingService = service;		
	}    
});

// https://protected-sands-2667.herokuapp.com/people/Geraint%20Luff 
app.get('/arm/people',access_control.authUser,function(req,res){
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

/***********************************************************************
        schedule
************************************************************************/
  
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 4)];
rule.hour = 3;
rule.minute = 40;

var j = schedule.scheduleJob(rule, function(){
    console.log('running the event schedule rule!');
	sensorRoomModel.cacheEvents(buildingService,function(err,rooms){
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
		if(err) {  console.log('get room error '.red); }
		else if(!rooms) { console.log('no data for room'.red); }
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


/***************************************************
****************************************************
   test 
****************************************************   
****************************************************/
// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-2D-F0/motion   lecture room
// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-35-08/motion   box
// localhost/test/timeseries/now?id=/armmeeting/11/MotionSensor/00-0D-6F-00-00-C1-46-10/motion   elm
app.get('/test/timeseries/now',access_control.authUser,function(req,res,next){
    var id = req.query.id;
    var MS_PER_MINUTE = 60000;
	var now = new Date();
    sensorHandler.getSensorData(id, new Date(now.valueOf() - 10*60 * MS_PER_MINUTE) , now ,function(err,data){
	    if(err) res.send(500,err);
	    else if(data) res.send(200,data);
		else if(!data) res.send(404);
	})
})

// old API
app.get('/buildings/:name/:floor',access_control.authUser,function(req,res){
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

app.get('/buildings/:name/:floor/test',access_control.authUser,function(req,res){
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

app.get('/test/sensor',access_control.authUser,function(req,res){
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


app.get('/test/sensor/2',access_control.authUser,function(req,res){
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