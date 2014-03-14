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
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js'),
	access_control = require('../access_control_api.js'),
	sensorHandler = require('../sensorHandler.js'),
	catalogFactsModel = require('../../model/catalog_fact_model.js'),
	roomModel = require('../../model/room_model.js'),
	catalogFilter = require('../catalog_filter.js'),
	catalogDB = require('../catalog_db.js'),
	sensorRoomModel = require('./SensorRoomModel.js');
/****   experiment 2 ********/
var meetingService; 
var buildingService;
serviceCatalog.findByURL('https://geras.1248.io/cat/armmeeting',function(err,service){
    if(err || !service){
	    console.log(' catalog can not be found ',err);
	}else {
	    console.log('find the service catalog '.green,service.serviceObj.url);
        meetingService = service;		
	}    
}); 

serviceCatalog.findByURL('https://protected-sands-2667.herokuapp.com/cat',function(err,service){
    if(err || !service){
	    console.log(' catalog can not be found ',err);
	}else if(!service){  console.log('no data in the catalog ');}
	else{
	    console.log('find the service catalog '.green,service.serviceObj.url);
        buildingService = service;		
	}    
});   
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

function checkCatalogUpdate(catalog){
	//console.log('subscribeCatalogNotification   '.green,catalog.url, catalog.profile, catalog.types);
	if(catalog.profile == 'sensor' && catalog.types.motion ==1 ){   //_.contains(catalog.types, 'motion')
 		catalogFactsModel.getCatalogFacts( catalog.url,function(err,data){
			if(err) console.log('catalog facts  store error '.red,catalog.url, err);
			else if(!data){console.log('no data in the catalog ');}
			else {
				//console.log('catalog sensor facts  get  data'.green, catalog.url, data.facts.length);							
				filter.filterStandard(data.facts,function(results,category){
					var key_array = Object.keys(results);								
					console.log('complete checkCatalogUpdate sensor in application  '.yellow, key_array.length, category);																							
					async.forEach(key_array, function(key,callback){
						//console.log(key , results[key]);
						catalogDB.saveResource('res:sensor:'+key, results[key],function(){callback();});
					},function(err){
						console.log('complete sensor in redis'.yellow);
					});							
				});							
			}	
		});				
	}else if(catalog.profile =='room'){
		catalogFactsModel.getCatalogFacts( 'https://protected-sands-2667.herokuapp.com/cat',function(err,data){
			if(err) console.log('catalog facts  store error '.red,catalog.url, err);
			else if(!data){console.log('no data in the catalog ');}
			else {
				filter.filterStandard(data.facts,function(results,category){
					var key_array = Object.keys(results);								
					console.log('complete checkCatalogUpdate room data  '.yellow, key_array.length, category);																							
					async.forEach(key_array, function(key,callback){
						//console.log(key , results[key]);
						catalogDB.saveResource('res:room:'+key, results[key],function(){  callback(); });
					},function(err){
						console.log('complete room in redis '.yellow);
						roomModel.clearRooms({},function(){})
						sensorRoomModel.getAllRooms(function(err,data){
							if(err) {console.log('get all rooms  error '.red, err);}
							else if(!data){console.log('get all rooms   ',data);}
							else{
							    console.log('-------------------------------------------------');
								console.log(data.length);
                                //sensorRoomModel.saveAllSites(data,function(){});
								data.forEach(function(room){
								    if(room.floor == 'Ground') room.floor = 0;
									else if(room.floor == '1st')  room.floor = 1;
								    roomModel.pushRoom(room,function(err,data1){
									    console.log(err,data1,room);
									});									
								})
                                							
							}
						})						
					});							
				});							
			}	
		});								
	}
}


// http://localhost/meeting/integrate
app.get('/meeting/integrate',function(req,res,next){
    integrateMeetingRoom(function(err,data){
	    res.send(200);
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

        if(_callback) _callback();
		
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

app.get('/meeting/sites/json',access_control.authUser,function(req,res,next){
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.send(200,getSiteRooms(data));
			
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';
						   url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   //url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}        
     		return res.send(200,locals.data);          			
		}
	})
})

app.get('/meeting/sites',access_control.authUser,function(req,res,next){
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.send(200,getSiteRooms(data));
			
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';

						   url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   //url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}
            if(req.xhr) {
			    console.log(' ajax');
     			return res.send(200,locals.data);
            }				
			else {
			    console.log('not ajax');
			    res.render('landingpage.html', locals);
            }				
		}
	})
})

function getSiteRooms(data){
	var sites = [];

	for(var i=0,l=data.length;i<l;i++) {
		var row = data[i];
		var site = false;
		var building = false;
		var floor = false;

	//  search for existing site
		for(var j=0,k=sites.length;j<k;j++) {
			if(sites[j].name == row.site) {
				site = j;
				break;
			}
		}

		if(site === false) {
			site = sites.length;
			sites[site] = {
				name: row.site,
				buildings: []
			};
		}

	//  search for existing building
		for(var j=0,k=sites[site].buildings.length;j<k;j++) {
			if(sites[site].buildings[j].name == row.building) {
				building = j;
				break;
			}
		}

		if(building === false) {
			building = sites[site].buildings.length;
			sites[site].buildings[building] = {
				name: row.building,
				floors: []
			};
		}

	//  search for existing floor
		for(var j=0,k=sites[site].buildings[building].floors.length;j<k;j++) {
			if(sites[site].buildings[building].floors[j] == row.floor) {
				floor = j;
				break;
			}
		}

		if(floor === false) {
			floor = sites[site].buildings[building].floors.length;
			sites[site].buildings[building].floors[floor] = row.floor;
		}
	}
	return sites;
}


function getMenus(site, res){
	roomModel.searchRooms({site:site},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.render('meeting2.html');
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			
							    < for(var i=0; i<locals.menus.length; i++) {>
								    <li>
										<a class='room_nav' ng-click="getRoomInfo($event.target.href);$event.preventDefault()" href="<%= locals.menus[i].url %>"><%= locals.menus[i].name %></a>
                                    </li>
								<} >			
			
			*/
            var groups = _.groupBy(data,function(room){
				return (room.site+","+room.building+","+room.floor);		
			})
			var sites = [];
			var key_array = Object.keys(groups);
			var locals = {};
			var menus = [];
			key_array.forEach(function(key){
			    var subkeys = key.split(',');
			    var site_key = subkeys[0], building_key = subkeys[1], floor_key = subkeys[2];
				console.log(site_key, building_key, floor_key);
				var name = '';
				if(floor_key == 0) name = building_key+"  Ground";
				else if(floor_key > 0) name = building_key+"  Floor"+floor_key;
                menus.push({name: name, url: "/buildings/"+building_key+"/"+floor_key});				
			})
			locals.menus = menus;
			res.render('meeting3.html', locals);
		}
	})
}

function getFlatMenus(site, res){
    //site:site
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			*/
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';
                           // meeting/site/Peterhouse_Technology_Park/building/CPC1/floor/1
						    url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   //url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}		
						
			console.log(locals.data[0].buildings[0].floors[0]);
            //res.send(200,getSiteRooms(data));
			res.render('meeting3.html', locals);
		}
	})
}

function getMenus(site, res){
	roomModel.searchRooms({site:site},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.render('meeting2.html');
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			*/
            var groups = _.groupBy(data,function(room){
				return (room.site+","+room.building+","+room.floor);		
			})
			var sites = [];
			var key_array = Object.keys(groups);
			var locals = {};
			var menus = [];
			key_array.forEach(function(key){
			    var subkeys = key.split(',');
			    var site_key = subkeys[0], building_key = subkeys[1], floor_key = subkeys[2];
				console.log(site_key, building_key, floor_key);
				var name = '';
				if(floor_key == 0) name = building_key+"  Ground";
				else if(floor_key > 0) name = building_key+"  Floor"+floor_key;
                menus.push({name: name, url: "/buildings/"+building_key+"/"+floor_key});				
			})
			locals.menus = menus;
			res.render('meeting3.html', locals);
		}
	})
}
// http://localhost/meeting/site/Peterhouse_Technology_Park/building/ARM3/floor/0
app.get('/meeting/site/:site/building/:building/floor/:floor',access_control.authUser,function(req,res,next){
    var site = req.params.site, building = req.params.building, floor = req.params.floor;
	var  site = replaceAll("_"," ",site);
	console.log("site:"+site+":"+building+":*   floor");
    getFlatMenus(site, res);
	//res.send(200,getSiteRooms(data));
})

app.get('/meeting/site/:site/building/:building',access_control.authUser,function(req,res,next){
    var site = req.params.site, building = req.params.building;	
	var site = replaceAll("_"," ",site);
	console.log("fuck fuck  fuck  site:"+site+":"+building+":*");
    getFlatMenus(site, res);
})

// http://localhost/meeting/site/Capital_Park
// http://localhost/meeting/site/Peterhouse_Technology_Park
app.get('/meeting/site/:site',access_control.authUser,function(req,res,next){
    var site = req.params.site;	
	var site = replaceAll("_"," ",site);
	console.log("site:"+site+":");
    getFlatMenus(site, res);
})




/*
	sensorRoomModel.searchSite("site:"+site+":"+building+":*",function(err,rooms){
		res.send(rooms);
	})
*/

/************************************


*************************************/

app.get('/buildings/test',access_control.authUser,function(req,res){
    sensorRoomModel.getRoomByBuilding('abc',function(err,data){
	    if(err) res.send(404);
	    else if(!data){res.send(404);}
		else{
		    //console.log(data);
		    res.send(data);
		}
	})
})

app.get('/buildinglist',access_control.authUser,function(req,res){
    var list = [
	    {name:'ARM 1', floors:[ {name:'Ground',url:'/buildings/ARM1/0'},{name:'Floor 1',url:'/buildings/ARM1/1'} ]},
        {name:'ARM 2', floors:[ {name:'Ground',url:'/buildings/ARM2/0'},{name:'Floor 1',url:'/buildings/ARM2/1'} ]},	
        {name:'ARM 3', floors:[ {name:'Ground',url:'/buildings/ARM3/0'},{name:'Floor 1',url:'/buildings/ARM3/1'} ]},	
        {name:'ARM 6', floors:[ {name:'Ground',url:'/buildings/ARM6/0'},{name:'Floor 1',url:'/buildings/ARM6/1'} ]},
        {name:'CPC1',  floors:[ {name:'Ground',url:'/buildings/CPC1/0'},{name:'Floor 1',url:'/buildings/CPC1/1'} ]}		
	];
	res.json(200,{buildings:list});
})




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

app.get('/buildings/:building/:floor/cache',access_control.authUser,function(req,res){
    var building = req.params.building, floor = req.params.floor;
	building = building || 'ARM1';
	floor = floor || 0;
	//var rooms = simulation.buildings[name+" "+floor];
	//console.log(rooms);
	
	var array = [];
	
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
		}
	})	
	
	var displayname = function(name){
		var temp_name = name;
		temp_name = temp_name.substring( temp_name.indexOf('UKC')+3,temp_name.length);
		return temp_name;
	}
})

/**********************************************   ********************************************************/


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

app.get('/buildings/map',access_control.authUser,function(req,res){
    var building = req.query.building, floor = req.query.floor;
	console.log('building  map'.green,building,floor);
	var mappath = 'maps/ARM-MAP_Base.svg';
	if(building == 'ARM1' && floor == 0){
        mappath = 'maps/ARM1-FIRST-FLOOR.svg';
	}else if(building == 'ARM1' && floor == 1){
        mappath = 'maps/ARM1-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM2' && floor == 0){
        mappath = 'maps/ARM2-GROUND-FLOOR.svg';	
	}else if(building == 'ARM2' && floor == 1){
        mappath = 'maps/ARM2-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM3' && floor == 0){
        mappath = 'maps/ARM3-GROUND-FLOOR.svg';	
	}else if(building == 'ARM3' && floor == 1){
        mappath = 'maps/ARM3-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM6' && floor == 0){
        mappath = 'maps/ARM6-GROUND-FLOOR.svg';	
	}else if(building == 'ARM6' && floor == 0){
        mappath = 'maps/ARM6-FIRST-FLOOR.svg';	
	}
    res.sendfile(mappath);	
})

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

// https://protected-sands-2667.herokuapp.com/people/Geraint%20Luff 
// http://localhost/arm/people?people=Geraint%20Luff
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


app.get('/cacheevents',access_control.authUser,function(req,res){
    sensorRoomModel.cacheEvents(function(err,rooms){
	    if(err) res.send(500);
		else res.send(200,rooms);
	})
})

  
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 4)];
rule.hour = 3;
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

/**   test **/

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