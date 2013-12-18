var app = require('../app').app;

var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request');	
	
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
	

var serviceCatalog = new ServiceCatalog();
var serviceBuilder = new ServiceBuilder(serviceCatalog);
serviceBuilder.build([enlight,armhome,armmeeting,armbuilding]);



/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting1');  // enlight
try{
	 meetingService.fetchResourceList(function(err,obj){
        if(err){
	        winston.error('error ');
	    }else{
            getArmMeetingResource(obj);	
	    }	 	 
	 });
}catch(e){  winston.error('service not found') }

var buildingService = serviceCatalog.findByName('armbuilding');  // enlight
try{
	 buildingService.fetchResourceList(function(err,obj){
        if(err){
	        winston.error('error ');
	    }else{
            getLocationResource(obj);			
	    }	 	 
	 });
}catch(e){  winston.error('service not found') }


/****   experiment 3 ********/
/*********** *************/
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


function MeetingRoomMQTTHandler(){
    
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
		    // stream to interoperbility layer
		    var array = url.split('/');
		    //console.log(array[0],array[1],array[2],array[3],array[4],array[5]);
			findResource("device:",url, 'loc',function(err,data){ 
			    if(err) winston.error('hmget 11 '+err);
				else if(data) winston.info('hmget find location 11:'.green+"  "+data.url+"  " +data);	  
			    else winston.error('hmget find no location11');
			});
			var room = mapping[url];
			if(room){
			    //console.log("room  is  "+room);
				var array = room.split('/');
				//console.log("io send message  "+array[4]);
				io.sockets.emit('info',{room:array[4],type:'motion', value:100});
			}
			
		    var roomID = array[2], sensorID = array[4], sensorType = array[5];
			url = array[0]+"/"+array[1]+"/"+array[2]+"/"+array[3]+"/"+array[4];
		    //winston.debug('MeetingRoomMQTTHandler  '.green+url+"  "+sensorType+"  "+ value);			   
		}catch(e){
			   
		}
    }		
}

// http://localhost/room/event?url=https://protected-sands-2667.herokuapp.com/rooms/Room.UKCGM4
// http://localhost/room/event?url=Room.UKCMaple   Room.UKCBeech  Room.UKCWillowA  Room.UKCWillowB  Room.UKCFM10  Room.UKCFM7  Room.UKCFM9
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
	            //console.log(event.startDate, event.endDate);
				var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
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
                var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
				var hour = startDate.getHours(), min = startDate.getMinutes();
				if(hour < 10) hour = '0'+startDate.getHours();
				if(min < 10) min = '0'+startDate.getMinutes();
                start = hour+":"+min;
				
                hour = endDate.getHours(), min = endDate.getMinutes();
				if(hour < 10) hour = '0'+endDate.getHours();
				if(min < 10) min = '0'+endDate.getMinutes();				
                end = hour+":"+min;				
            if(found) found = 1;
			else found = 0;
			//console.log(' found   ',found, next,start ,end);
            res.send(200,{'found':found,'start':start,'end':end});			
	    }	 	 
	});

})





	
	
	
function LocationHandler(){

    this.onReceiveLocationList = onReceiveLocationList;
	this.onReceiveLocationDetail = onReceiveLocationDetail;
	
    function onReceiveLocationList(err,obj){
        if(err){
	        winston.error('error ');
	    }else{
            parseHyperCat(obj); 
	    }	
	}

    function onReceiveLocationDetail(err,obj){
        winston.debug("LocationDetailHandler".green+obj);
	    var url = obj.url, name = obj.name, address = obj.address,capacity = obj.capacity;		
	}	
}

function EventDetailHandler(){
	this.onReceiveEventDetail = onReceiveEventDetail;
	
	function onReceiveEventDetail(err,obj){
	    for(var i=0;i<obj.length;i++){
	        var event = obj[i];
	        console.log(event.location,event.startDate, event.endDate, event.url);
	    } 
	}
}	

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


/******    catalog  crawler   ********/

function getLocationResource(obj){
  	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		winston.debug('item-metadata'.green+ rel+ val);              				
    }
	winston.debug('parseHyperCat1  item-metadata  length'.green+obj.items.length );
    /**/
	saveResourceListInBulk('cat:',obj.service,obj.items,function(err,data){
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
	            var url = obj.url, name = obj.name, address = obj.address,capacity = obj.capacity, email = obj.email, event = obj.event;  
                var relativeURL = extractRelativeURL(url,buildingService.getHost());				
				winston.debug("LocationDetailHandler  ".green+relativeURL);
                saveResourceInBulk("location:",relativeURL, obj, function(err,data){} );
				// add into attribute groups
                if(obj.building){
				    savePropertyGroup("location:"+"building:"+obj.building, "location:"+relativeURL, function(err,data){} );				
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
				savePropertyGroup("location:"+"addressLocality:"+hash.addressLocality, "location:"+relativeURL, function(err,data){} );
			}				
        }
		saveResourceInBulk("location:",href, hash, function(err,data){} );	
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
                                                saveResourceInBulk("device:",res, {loc:val}, function(err,data){} );													
					                        }else if(rel == 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1'){
													
											}else if(rel == 'urn:X-tsbiot:rels:supports:query'){
													
											}					
                                        }

                                      }catch(e){winston.error(e.name+"    "+data2.toString());} 										
									}
								})
						    }							
                            saveResourceListInBulk('cat:',obj.service,data1.items,function(err,data){
		                        if(err){  winston.error('save resource list error'+err);}
		                        else winston.info(data);
	                        });													
						}	
					})
				}
	       }	 	 
	    });							
	}	
	getResourceList('cat:',obj.service,function(err,data){});
}

/******    catalog  crawler   ********/


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

function saveResourceListInBulk(context,service ,items ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }		
    var mul = redisClient.multi();
    for(var i=0;i<items.length;i++){
	   mul.sadd(context+service,JSON.stringify({'item':items[i].href}))
		 .incrby(context+service+':count',1);
	}
	mul.exec(function (err, replies) {
            console.log("save Resource List2 " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                //console.log("Reply " + index + ": " + reply.toString());
            });
    });		
	redisClient.quit();
	return callback(null,1);
}


/****  attributes = entity+reference+value   for example, room:building:BOX *****/
function savePropertyGroup(attribute ,entity_key ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }		
	redisClient.sadd(attribute,entity_key);
	redisClient.incrby(attribute+':count',1);	
	redisClient.quit();
	return callback(null,1);
}

/***  only for the events ***/

function pushToListInBulk(context,url,items ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	

	// use the zadd
    var mul = redisClient.multi();
    for(var i=0;i<items.length;i++){
	   mul.lpush(context+url,JSON.stringify({'item':items[i]}))
	}
	mul.exec(function (err, replies) {
            console.log("pushToListInBulk  " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                //console.log("Reply " + index + ": " + reply.toString());
            });
    });		
	redisClient.quit();
	return callback(null,1);
}

function getListInBulk(context,url ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	

	
	redisClient.lrange(context+url, 0,-1,function(err, data){
	    redisClient.quit();
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});	
	redisClient.quit();
	return callback(null,1);
}

/*******                                            ***********/
	/*
	client.hgetall("device:"+url, function (err, data) {
        console.log('hgetall  reply 2'+data);	
    });
    */
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
	
	console.log('url :'+url.substring(0,url.lastIndexOf("/")));
	url = url.substring(0,url.lastIndexOf("/"));
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




/*******************************************
  clear the database
********************************************/
function clearResource(){
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 
    var redisClient;
        try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
    redisClient.flushdb(function(){});
}


/****   experiment 4 ********/
// http://localhost/clear
app.get('/clear',function(req,res,next){

    clearResource();
	res.send(200);
})

// http://localhost/all/meeting
app.get('/all/meeting',function(req,res,next){

    getResourceList('cat:','armmeeting',function(err,data){
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


/****   experiment 5 ********/
	/*
function DeviceHandler(){

    this.onReceiveDeviceList = onReceiveDeviceList;
	this.onReceiveDeviceDetail = onReceiveDeviceDetail;

    function onReceiveDeviceList(err,obj){
        if(err){
	        winston.error('error ');
	    }else{
            parseHyperCat(obj);	
	    }	
	}
	
    function onReceiveDeviceDetail(err,obj){
        if(err){
	        winston.error('error ');
	    }else{
            parseHyperCat(obj);	
        }		
	}
}

function parseHyperCat(obj){

 	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		console.log('item-metadata'.green, rel, val);              				
    }
	console.log('item-metadata  length'.green,obj.items.length );
	
	
	for(var i=0;i<obj.items.length;i++){
		var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		console.log("href".yellow, href, metadata.length); //		
		saveResourceList(obj.service,href,function(err,data){
		    if(err){  winston.error('save resource list error'+err);}
			else winston.info(data);
		});				
	}
	
   
	saveResourceListInBulk(obj.service,obj.items,function(err,data){
		if(err){  winston.error('save resource list error'+err);}
		else winston.info(data);
	});	

	
	getResourceList(obj.service,function(err,data){});

}
	*/