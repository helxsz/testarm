var app = require('../app').app;  

var async = require('async'),
    fs = require('fs'),
	util = require('util'),
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
	AppBuilder = require('./AppBuilder.js'),
	SensMLHandler = require('./senMLHandler.js'),
	db = require('./persistence_api.js'),
	simulation = require('./simulation.js');

var serviceCatalog = new ServiceCatalog();	
/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting');  // enlight
var buildingService = serviceCatalog.findByName('armbuilding');  // enlight	

/*
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//geras.1248.io/cat/armmeeting/17/MotionSensor/00-0D-6F-00-00-C1-34-EB&traverseKey=924a7d4dbfab38c964f5545fd6186559
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fprotected-sands-2667.herokuapp.com%2Fcat&traverseKey=0L8kgshd4Lso3P1UQX7q&Submit=Browse
http://schema.org/Place
*/

// http://localhost/tempdata	
app.get('/tempdata',function(req,res){
    meetingService.getResourceData('armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/temperature','',function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data.e.length);
			
			var dataParse = function(data){			
			    var e = data.e;
				e.forEach(function(data){
				    console.log(data.n , data.t ,data.v  ,  new Date(data.v));	//,  moment(data.t ).fromNow()
				})
			}
			dataParse(data);
		    res.send(200,data);
		}	
    })
})


	
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

app.get('/buildings/arm/floor',function(req,res,next){
    var buildings = [
    { 'name': 'ARM1', 
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
	  "floors":[]
	},
    {'name': 'ARM1',
     "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
	  "floors":[]
	},
    {'name': 'ARM5',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
	  "floors":[]
	},
    {'name': 'ARM6',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10",
	}
    ];
	
	res.send(200, buildings);
})

app.get('/sensors/arm/',function(req,res,next){
    var sensors = [
       {'name': 'aaa' , 'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[396,526], 'room':'abc'},
	   {'name': 'bbb',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[419,552], 'room':'bcd'},
	   {'name': 'ccc' , 'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[396,526], 'room':'abc'},
	   {'name': 'ddd',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[369,521], 'room':'bcd'},
	   {'name': 'eee',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[311,477], 'room':'bcd'},
	   {'name': 'fff',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[339,500], 'room':'bcd'},
	   {'name': 'ggg',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[358,585], 'room':'bcd'},
	   {'name': 'zzz',  'url':"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCFM10", 'loc':[358,585], 'room':'bcd'},
    ];
        
    res.send(200,{sensors:sensors});
})



app.get('/meetings/arm/now',function(req,res){
    var rooms = [
    { 
	  'name': 'Room.UKCWillowA ',
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
			    winston.debug(eventlist);
                //var now = new Date();
				//var eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);    return (eventDate.getTime() >= now.getTime())&&(eventDate.getDate()==now.getDate()); });								
                room.events = eventlist;				
	        }		
            callback();			
	    });		
      },
	  function(err){
        //winston.debug('get all the messages ',util.inspect(events, false, null));
		res.send(200,{rooms:rooms});
	  } 
	); 	
})

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


// socket.io 


app.get('/room/event',function(req,res){
    var url = req.query.url;
	
	url = rooms[url];
	buildingService.fetchResourceDetail(url+"/events",function(err,obj){
        if(err){
	        winston.error('error    '+url+"/events");
			res.send(404);
	    }else{
		    var currentDate = new Date();
			var found = false, next = -1;
	        for(var i=0;i<obj.length;i++){
	            var event = obj[i];
	            //console.log(url,event.startDate, event.endDate);
				var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
				if(i==0&&currentDate.getTime() < startDate.getTime() ) break;
				if(currentDate.getTime() >= startDate.getTime()  ) {  next ++; }
				if(startDate.getTime()<=currentDate.getTime() &&  currentDate.getTime() <= endDate.getTime()){
				    found = true;
					next = i;
					break
				}
	        }
			
			var start, end,event ;
			if(found) {  
			    event = obj[next];
			}else{
			    event = obj[next+1];
			}
			try{
                var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
				var hour = startDate.getHours(), min = startDate.getMinutes();
				if(hour < 10) hour = '0'+startDate.getHours();
				if(min < 10) min = '0'+startDate.getMinutes();
                start = hour+":"+min;
				
                hour = endDate.getHours(), min = endDate.getMinutes();
				if(hour < 10) hour = '0'+endDate.getHours();
				if(min < 10) min = '0'+endDate.getMinutes();				
                end = hour+":"+min;	
            }catch(e){
			    console.log(url,'not found , not nexts'.red);
			    return res.send(200,{'found':0});
			}
				
            if(found) found = 1;
			else found = 0;
			//console.log(' found   ',found, next,start ,end);
            res.send(200,{'found':found,'start':start,'end':end, 'temperature': 22+  (Math.floor(Math.random() * 8) + 1)/4 });			
	    }	 	 
	});
})




app.get('/service/armbuilding/build',function(req,res){
    try{
	    buildingService.fetchResourceList(function(err,obj){
            if(err){
	            winston.error('error ');
	        }else{
                getLocationResource(obj);			
	        }	 	 
	    });
    }catch(e){  winston.error('service not found') }
    res.send(200);
})

app.get('/service/armmeeting/build',function(req,res){
    try{
	    meetingService.fetchResourceList(function(err,obj){
            if(err){
	            winston.error('error ');
	        }else{
                getArmMeetingResource(obj);	
	        }	 	 
	   });
    }catch(e){  winston.error('service not found') }
	res.send(200);
})


/******    catalog  crawler   ********/

function getLocationResource(obj){
  	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		winston.debug('item-metadata'.green+ rel+ val);              				
    }
	winston.debug('parseHyperCat1  item-metadata  length'.green+obj.items.length );
    /**/
	db.saveResourceListInBulk2('cat:'+obj.service,obj.items,function(err,data){
		                        if(err){  winston.error('save resource list error'+err);}
		                        else winston.info(data);
	});
	
	
	for(var i=0;i<obj.items.length;i++){
		var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		winston.debug("parseHyperCat1  href".yellow+ href +"  "+ metadata.length+"   "+isAbsoluteURL(href)+"   "+isAbsoluteURL("https://"+obj.host+href) ); //
		
		//////////////////////////////////////////////////////////////////////////////////
		var relativeURL, absoluteURL ;
		if(!isAbsoluteURL(href)){
		    relativeURL = href;
			absoluteURL = "https://"+obj.host+href;
		    href = "https://"+obj.host+href;

		}
		winston.debug("parseHyperCat2  href".yellow+ href ); //
		// get the location
		buildingService.fetchResourceDetail(href,function(err,obj){
            if(err){
	            winston.error('error ',err);
	        }else{               
	            var url = obj.url, name = obj.name, address = JSON.stringify(obj.address),capacity = obj.capacity, email = obj.email, event = obj.event;  
                var relativeURL = extractRelativeURL(url,buildingService.getHost());				
				winston.debug("LocationDetailHandler  ".green+relativeURL);
                db.saveResourceInBulk2("location:"+relativeURL, obj, function(err,data){} );
				// add into attribute groups
                if(obj.building){
				    db.savePropertyGroup("location:"+"building:"+obj.building, "location:"+relativeURL, function(err,data){} );	
                    db.saveResourceList2("location:"+"building",obj.building,function(err,data){});					
				}				
		    }
        })
       					
		//////////////////////////////////////////////////////////////////////////////////
		var hash = {};
		for(var j=0;j<metadata.length;j++){
		    var item  = metadata[j], rel = item.rel, val= item.val;
			//console.log(rel+"  "+val);
			
            if(rel == 'urn:X-tsbiot:rels:isContentType'){
				winston.debug('this is a room');						                       
			}else if(rel == 'http://www.w3.org/2002/07/owl#sameAs'){				                            
				
				winston.debug('email link :'+"   "+val);
                hash.sameAs = val;													
			}else if(rel == 'http://schema.org/event'){
			    winston.debug('event :'+"   "+val);
				hash.event = val;
				if(!isAbsoluteURL(val)){
		            val = "https://"+obj.host+val;
		        }
		        winston.debug("parseHyperCat3  event href".yellow+ val ); //
		        // get the event of a location
		        /*
				buildingService.fetchResourceDetail(val,function(err,events){
				    
                        if(err){
	                     winston.error('error ',err);
	                    }else{
						    var relativeURL = extractRelativeURL(events.url, buildingService.getHost());
							console.log( "relative:".green,  relativeURL );
                            for(var i=0;i<events.length;i++){
	                            var event = events[i];								
				                winston.debug("event handler  ".green+event.location+event.startDate+ event.endDate+ event.url);                               								
		                    }
							
							pushToListInBulk( 'events:',relativeURL ,events,function(err,data){});
						}
                })
				*/		
			}else if(rel=='http://schema.org/addressLocality'){
			    winston.debug('addressLocality :'+"   "+val);
				hash.addressLocality = val;
				db.savePropertyGroup("location:"+"addressLocality:"+hash.addressLocality, "location:"+relativeURL, function(err,data){} );
			}				
        }
		db.saveResourceInBulk2("location:"+href, hash, function(err,data){} );	
	}	
}


function getArmMeetingResource(obj){
    	
 	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		console.log('item-metadata'.green, rel, val);              				
    }
	console.log('parseHyperCat1  item-metadata  length'.green,obj.items.length );
	
	for(var i=0;i<obj.items.length;i++){
		var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		console.log("parseHyperCat1  href".yellow, href, metadata.length); //
	    meetingService.fetchResourceDetail(href,function(err,data){
            if(err){
	            winston.error('error ');
	       }else{
                for(var i=0;i<data.items.length;i++){
		            var item  = data.items[i], href = item.href, metadata= item['i-object-metadata'];
                    console.log("fetchResourceDetail  href".yellow, href, metadata.length);
					meetingService.fetchResourceDetail(href,function(err,data1){
					    if(err){
                                winston.error('error ');
						}else{
						    for(var i=0;i<data1.items.length;i++){
		                        var item  = data1.items[i], href = item.href, metadata= item['i-object-metadata'];
                                console.log("fetchResourceDetail 2  href".yellow, href, metadata.length);
								 
								meetingService.fetchResourceDetail(href,function(err,data2){ 
                                    if(err){
								        winston.error('error ');
								    }else{
									  try{
									    for(var i=0;i<data2['item-metadata'].length;i++){
		                                    var item  = data2['item-metadata'][i], rel = item.rel, val= item.val;
		                                    //console.log('item-metadata'.green, rel, val); 
                                            if(rel == 'urn:X-tsbiot:rels:isContentType'){
						                            winston.debug('this is a sensor');						                       
					                        }else if(rel == 'http://www.w3.org/2002/07/owl#sameAs'){
					                            
												var res = href.replace("https://geras.1248.io/cat","");
												winston.debug('location :'+res+"   "+val+"  "+meetingService.getName());
                                                db.saveResourceInBulk2("device:"+res, {loc:val}, function(err,data){} );													
					                        }else if(rel == 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1'){
													
											}else if(rel == 'urn:X-tsbiot:rels:supports:query'){
													
											}					
                                        }

                                      }catch(e){winston.error(e.name+"    "+data2.toString());} 										
									}
								})
						    }							
                            db.saveResourceListInBulk2('cat:'+obj.service,data1.items,function(err,data){
		                        if(err){  winston.error('save resource list error'+err);}
		                        else winston.info(data);
	                        });													
						}	
					})
				}
	       }	 	 
	    });							
	}	
	db.getResourceList2('cat:'+obj.service,function(err,data){});
}

/******    catalog  crawler   ********/
function isAbsoluteURL(s) {
    return s.charAt(0) != "#"
      && s.charAt(0) != "/"
      && ( s.indexOf("//") == -1 
        || s.indexOf("//") > s.indexOf("#")
        || s.indexOf("//") > s.indexOf("?")
    );
}

function extractRelativeURL(href,host){

   return href.replace("https://"+host,"");
}



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

//getArmMeetingSchedules(function(){})

function getArmMeetingSchedules(done){

    db.getResourceList2("location:addressLocality:Cambridge",function(err,data){ 
        //winston.debug('getArmMeetingSchedules  '+data.length);  
		async.forEach(data, function(item,callback){ 
		     db.findResource2(item,['event'],function(err,data){ 
			    //winston.debug("data222".green,item,data[0]); 				
                buildingService.fetchResourceDetail(data[0],function(err,events){			    
                        if(err){
	                     winston.error('error ',err);
	                    }else{
						    var relativeURL = extractRelativeURL(events.url, buildingService.getHost());
							//winston.debug( "relative:".green,  relativeURL );
                            for(var i=0;i<events.length;i++){
	                            var event = events[i];								
				                //winston.debug("event handler  ".green+event.location+event.startDate+ event.endDate+ event.url); 
                                event.start = new Date(event.startDate).getTime();								
		                    }
							db.addEventsForRoom( 'events:'+relativeURL ,events,function(err,data){});
							callback();
						}
                })				
				
			 })
		 }, function(err) {      
            if(err){
                 //winston.error(err);
            }
			else{
                
			}
			done();
        });            			
    })
}

