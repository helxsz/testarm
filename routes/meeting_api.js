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
	SensMLHandler = require('./senMLHandler.js')
	db = require('./persistence_api.js');

var serviceCatalog = new ServiceCatalog();	
/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting');  // enlight
var buildingService = serviceCatalog.findByName('armbuilding');  // enlight	
	
app.get('/tempdata',function(req,res){
    meetingService.getResourceData('armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF/temperature','',function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data);
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





setInterval(function(e){
    
    


},300000);





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