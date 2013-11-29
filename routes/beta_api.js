var app = require('../app').app;

var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
    mqtt = require('mqtt'),
	socket = require('socket.io'),
	im = require('imagemagick'),
	redis= require('redis'),
	request = require('request');	
	
var 
    errors = require('../utils/errors'),
	config = require('../conf/config');	
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
https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//dev.1248.io%3A8002/cats/ARMAlertMe&traverseKey=ADMINSECRET
**************************************************************/


/*

app.get('/catalog',function(req,res,next){   
    var type = req.query.type;
	if(type == 'enlight'){
	    requestCatalog('enlight','https://geras.1248.io/cat/enlight','1bfc8d081f5b1eed8359a7517fdb054a',function(err,data){
	        if(err) res.send(404,err);
	        else res.json(200,data);
	    });
	}else if(type == 'armhome'){
	    requestCatalog('armhome','https://geras.1248.io/cat/armhome','924a7d4dbfab38c964f5545fd6186559',function(err,data){
	        if(err) res.send(404,err);
	        else res.json(200,data);
	    });
	}else if(type == 'armmeeting'){	
	    requestCatalog('armmeeting','https://geras.1248.io/cat/armmeeting','924a7d4dbfab38c964f5545fd6186559',function(err,data){
	        if(err) res.send(404,err);
	        else res.json(200,data);
	    });
	}else {
	    res.send(404);
	}
})

var ResourceHandler = function() {
        this.getDeviceList = handleCreateAccountRequest;
        this.getAccount = handleGetAccountRequest;
        this.updateAccount = handleUpdateAccountRequest;
        this.deleteAccount = handleDeleteAccountRequest;
};
*/
/**********************************************************************************
Catalog description

***********************************************************************************/
var host = 'https://geras.1248.io/';
var enlight = {
	    'name': 'streetlight',
		'description': 'Streetlight data',
		'url': 'https://geras.1248.io/cat/enlight',
		'key':'1bfc8d081f5b1eed8359a7517fdb054a',
        'pattern':'enlight',
		'host':'https://geras.1248.io',
        'cat':'enlight'		
	},
	armhome = {
	    'name': 'armhome',
		'description': 'ARM homes data',
		'url': 'https://geras.1248.io/cat/armhome',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armhome',
		'host':'https://geras.1248.io',
        'cat':'armhome'		
	},
	armmeeting = {
	    'name': 'armmeeting',
		'description': 'ARM meeting room data',
		'url': 'https://geras.1248.io/cat/armmeeting',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armmeeting',
		'host':'https://geras.1248.io',
        'cat':'armmeeting'		
	},
	armbuilding = {
	    'name': 'armbuilding',
		'description': '',
		'url': 'https://protected-sands-2667.herokuapp.com/cat',
		'key':'0L8kgshd4Lso3P1UQX7q',
		'pattern':'',
		'host':'https://protected-sands-2667.herokuapp.com',
		'cat':''
	};

function requestResource(config, callback){
   request.get({  
        url: config.url,	
        headers: {
		   'Authorization': 'Basic ' + new Buffer(config.key+":").toString('base64')
		   ,'content-type':'application/json'		
        },
	    rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }, function(error, response, body) {
	    if(error)
	    { 
		    console.log("error  ".red, error);
			callback(error,null);
		}
	    else
	    { 			
		    var obj = JSON.parse(body);		
			//interpretDeviceList(obj);
			callback(null,obj);
		} 
    }); 
}

function requestResourceByURL(config,url, callback){
   request.get({  
        url: url,	
        headers: {
		   'Authorization': 'Basic ' + new Buffer(config.key+":").toString('base64')
		   ,'content-type':'application/json'		
        },
	    rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }, function(error, response, body) {
	    if(error){ 
		    console.log("error  ".red, error);
			callback(error,null);
		}
	    else
	    { 			
		    //console.log("----------------",body);
		    var obj = JSON.parse(body);		
			callback(null,obj);
		} 
    }); 
}


/*******************************************************
get device list
********************************************************/
//requestResource(armhome,DeviceListHandler);
//requestResource(enlight,DeviceListHandler);
//requestResource(armmeeting,DeviceListHandler);
function DeviceListHandler(err, obj){
    if(err){
	    console.log('error ');
	}else{
 	    for(var i=0;i<obj['item-metadata'].length;i++){
		    var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		    console.log('item-metadata'.green, rel, val);              				
     	}	
	    for(var i=0;i<obj.items.length;i++){
		    var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		    console.log("href".yellow,href, metadata.length);
            for(var j=0;j<metadata.length;j++){
			    var meta = metadata[j];
				if(meta.rel !="urn:X-tsbiot:rels:isContentType" && meta.rel !="urn:X-tsbiot:rels:hasDescription:en")
			    console.log("ref".green,meta.rel,"val".green,meta.val  );
		    }              				
	    }	
	}
}
/****************************************************************
get Device description
https://geras.1248.io/cat/enlight/Ballast00002919     1bfc8d081f5b1eed8359a7517fdb054a
ballastTemperature  dolFinTemperature  lampPower  light  mainsVoltage  psuCurrent  psuVoltage
https://geras.1248.io/cat/armhome/10      924a7d4dbfab38c964f5545fd6186559
 Keyfob  MeterReader  SkyDisplay
https://geras.1248.io/cat/armmeeting/1    924a7d4dbfab38c964f5545fd6186559
MotionSensor
device value properties url
href
   (description contenttype)
   urn:X-tsbiot:rels:supports:query 
   urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1 
*****************************************************************/
//requestResourceByURL(enlight,'https://geras.1248.io/cat/enlight/Ballast00002919',DeviceDetailHandler);
//requestResourceByURL(armhome,'https://geras.1248.io/cat/armhome/10',DeviceDetailHandler);
//requestResourceByURL(armmeeting,'https://geras.1248.io/cat/armmeeting/1',DeviceDetailHandler);
function DeviceDetailHandler( err, obj){
    if(err){
	    console.log('error ');
	}else{
 	    for(var i=0;i<obj['item-metadata'].length;i++){
		    var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		    console.log('item-metadata'.green, rel, val);              				
     	}
		console.log('item-metadata  length'.green,obj.items.length );
 	    for(var i=0;i<obj.items.length;i++){
		    var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		    console.log('href:'.yellow,href, metadata.length);
            for(var j=0;j<metadata.length;j++){
			    var meta = metadata[j];
				// urn:X-tsbiot:rels:isContentType    urn:X-tsbiot:rels:hasDescription:en 
				if(meta.rel !="urn:X-tsbiot:rels:isContentType" && meta.rel !="urn:X-tsbiot:rels:hasDescription:en")
			    console.log("ref".green,meta.rel,"val".green,meta.val  );
		    }
			            				
	    }
    }		
}

/****************************************************************
get Device data
*****************************************************************/
//requestDataDetail('https://geras.1248.io/cat/armhome/10','924a7d4dbfab38c964f5545fd6186559');
// ?interval=1d&rollup=avg   ?interval=1h&rollup=avg   ?interval=1m&rollup=avg
// ?interval=1d&rollup=min   ?interval=1h&rollup=min   ?interval=1m&rollup=min   
// ?interval=1d&rollup=max   ?interval=1h&rollup=max   ?interval=1m&rollup=max


//requestDataByURL(enlight,'enlight/Ballast00002916/dolFinTemperature','?interval=1h&rollup=avg',DataHandler);
function requestDataByURL(config,url, time,callback){
   request.get({  
        url: config.host+'/series/'+ url +time,	
        headers: {
		   'Authorization': 'Basic ' + new Buffer(config.key+":").toString('base64')
		   ,'content-type':'application/json'		
        },
	    rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }, function(error, response, body) {
	    console.log('requestDataByURL'.green, url);
	    if(error){ 
		    console.log("error  ".red, error);
			callback(error,null);
		}
	    else
	    { 			
		    console.log("----------------",body);
		    //var obj = JSON.parse(body);		
			callback(null,body);
		} 
    }); 
}
function DataHandler(err,obj){
    if(err){
	    console.log('error');
	}else{
	    console.log(obj);
	}
}

/************************************************************************

Location data
	    'name': 'armbuilding',
		'description': '',
		'url': 'https://protected-sands-2667.herokuapp.com/cat',
		'key':'0L8kgshd4Lso3P1UQX7q':		
		
location list	
href url
   (description contenttype)	
   http://schema.org/event	 url
   http://schema.org/addressLocality	
************************************************************************/

//requestResource(armbuilding,LocationListHandler);
//requestResourceByURL(armbuilding,'https://protected-sands-2667.herokuapp.com/rooms/Room.BLRCauvery',LocationDetailHandler);
//requestResourceByURL(armbuilding,'https://protected-sands-2667.herokuapp.com/rooms/Room.BLRCauvery/events',EventDetailHandler);
function LocationListHandler(err,obj){
    if(err){
	    console.log('error ');
	}else{
 	    for(var i=0;i<obj['item-metadata'].length;i++){
		    var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		    console.log('item-metadata'.green, rel, val);              				
     	}
		console.log('item-metadata  length'.green,obj.items.length );	
	    for(var i=0;i<obj.items.length;i++){
		    var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		    console.log("href".yellow, href, metadata.length);
		    if(i==0){
                for(var j=0;j<metadata.length;j++){
			        var meta = metadata[j];
				    if(meta.rel !="urn:X-tsbiot:rels:isContentType" && meta.rel !="urn:X-tsbiot:rels:hasDescription:en")
			        console.log("ref".green,meta.rel,"val".green,meta.val  );
		        }
            }		
	    }
	}	
}

function LocationDetailHandler(err,obj){
    console.log("LocationDetailHandler".green,obj);
	var url = obj.url, name = obj.name, address = obj.address,capacity = obj.capacity;
}

function EventDetailHandler(err,obj){
    //console.log("EventDetailHandler".green,obj);
	for(var i=0;i<obj.length;i++){
	    var event = obj[i];
	    console.log(event.location,event.startDate, event.endDate, event.url);
	} 
}




/**************************************************************************
[
    'catalog':{
	    'name': 'streetlight',
		'description': 'Streetlight data',
		'url': 'https://geras.1248.io/cat/enlight',
		'key':'1bfc8d081f5b1eed8359a7517fdb054a:' 
	},
    'catalog':{
	    'name': 'armhome',
		'description': 'ARM homes data',
		'url': 'https://geras.1248.io/cat/armhome',
		'key':'924a7d4dbfab38c964f5545fd6186559:' 
	},
    'catalog':{
	    'name': 'armmeeting',
		'description': 'ARM meeting room data',
		'url': 'https://geras.1248.io/cat/armmeeting',
		'key':'924a7d4dbfab38c964f5545fd6186559:' 
	},
    'catalog':{
	    'name': 'armbuilding',
		'description': '',
		'url': 'https://protected-sands-2667.herokuapp.com/cat',
		'key':'0L8kgshd4Lso3P1UQX7q:' 
	}	
]

f99864c3e8bf55b2de28d76fca76d10e
***************************************************************************/	
    // mqtt://1bfc8d081f5b1eed8359a7517fdb054a:@geras.1248.io//enlight/Ballast0000291B/dolFinTemperature
    var mqttclient = mqtt.createClient(1883, "geras.1248.io",{username:'1bfc8d081f5b1eed8359a7517fdb054a' ,password: "" });
  
    mqttclient.on('connect', function(){
        console.log('MQTT Connected'.green, config.key, config.pattern);
	    mqttclient.subscribe('//enlight/Ballast0000291B/light');
    });

    mqttclient.on('message', function (topic, message) {
        console.log('mqtt message'.green,  message, "    ",new Date());
		/*
		 io.sockets.emit('mqtt',
           {   'topic'  : topic,
              'payload' : message
           }
        );
		*/
    });


//subscribeToMQTT(armhome);
//subscribeToMQTT(armmeeting);
//subscribeToMQTT(enlight);
function subscribeToMQTT(config){

    var mqttclient = mqtt.createClient(1883, "geras.1248.io",{username:config.key ,password: "" });
  
    mqttclient.on('connect', function(){
        console.log('MQTT Connected'.green, config.key, config.pattern);
	    mqttclient.subscribe(config.pattern+'/#');
    });

    mqttclient.on('message', function (topic, message) {
        console.log('mqtt message'.green,  message, "    ",new Date());
		/*
		 io.sockets.emit('mqtt',
           {   'topic'  : topic,
              'payload' : message
           }
        );
		*/
    });
}




var io = socket.listen(3000);
io.configure(function () {
        console.log('web socket io configure'.green);   
      	io.set('log level', 1);
	    //setStore(io);	
	    io.enable('browser client minification');  // send minified client
        io.enable('browser client etag');          // apply etag caching logic based on version number
        io.enable('browser client gzip'); 
	    io.set('heartbeat interval', 45);
    	io.set('heartbeat timeout', 120); 
    	io.set('polling duration', 20);
	
        io.set('close timeout', 60*60*24); // 24h time out
    	io.set('transports', [
            'websocket', 'xhr-polling'
            //'xhr-polling' // for benchmarking
       ]);	
});
io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function (data) {
        mqttclient.subscribe(data.topic);
    });

});



app.get('/lab/mqtt',function(req,res,next){
    res.render('lab/mqtt/app');
})



/********************************
   publish / subscribe 
*********************************/
var parking_pattern = 'parking/*/spot/*';
function listenParkingEvent(pattern){

    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 
    var redisClient = redis.createClient(redis_port,redis_ip); 
    /*
    redisClient.auth(config.opt.redis_auth, function(result) {
	    console.log("Redis authenticated.");  
    })
    */ 
    redisClient.on("error", function (err) {  
        console.log("redis Error " + err.red,err);  
        return false;  
    });    

    redisClient.on('connect',function(err){
	    console.log('redis connect success');
    })
	
    redisClient.psubscribe(pattern);
    redisClient.on('pmessage', function(pattern, channel, message){	    
	    console.log('on publish / subscribe   ',  pattern+"   "+channel+"    " );
	    if(pattern == parking_pattern){
	        try {
    		    var data = JSON.parse(message);   		
				var array = channel.split('/');
				var pid = array[1], sid = array[3];
				console.log("data:".green, pid+"    "+sid+"    ");				
	        } catch (e) {
	            return;
	        }
	    }
    });	   
}

// why publish / subscribe on the server side
//  a group of server receiving data(sensor data),   a group of server in the queue for background processing ,  a group of server sending data to client(web hook)

setTimeout(function(){ 
    publishMsg('parking/1/spot/1',{'t':new Date(),'a':0});  // t = timestamp , a = availablity
    publishMsg('parking/1/spot/1',{'t':new Date(),'a':1});
    publishMsg('parking/2/spot/2',{'t':new Date(),'a':0});
    publishMsg('parking/2/spot/3',{'t':new Date(),'a':1});
}  , 4000);


function publishMsg( channel , mssage){
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 
    var redisClient = redis.createClient(redis_port,redis_ip);   
    redisClient.publish(channel,JSON.stringify({'test':'test'}));
	redisClient.quit();
}


var data = {
    e:[
        {n:"humidity", v:22.5, t:12345},
        {n:"humidity", v:23.5, t:24680},
        {n:"lightcc", v:100, t:12345},
        {n:"lightcc", v:200, t:13692}
    ]
};
//  small chunks

// big chunks
// http://data.openiot.org/cat
//  https://dev.1248.io:8002/cats/ARMAlertMe (key = ADMINSECRET)
//  http://212.49.230.229:8000/cats/ARM1 (no key)
//  http://geras.1248.io/cat/enlight (key = 1bfc8d081f5b1eed8359a7517fdb054a) 
/*
This is being republished by 1248's Geras as the catalogue http://geras.1248.io/cat/enlight (key = 1bfc8d081f5b1eed8359a7517fdb054a)
The republished catalogue provides SenML resources which support time and rollup queries, allowing apps to fetch just the data they need.
You can see an example of this by using the browser, http://dev.1248.io:8000/browser.html?url=https://geras.1248.io/cat/enlight&key=1bfc8d081f5b1eed8359a7517fdb054a

The AlertMe and Enlight data can both be accessed directly from Geras using the keys (924a7d4dbfab38c964f5545fd6186559 and 1bfc8d081f5b1eed8359a7517fdb054a respectively).
The examples of doing this are in the client-side HTML+JS apps I shared last Friday (https://www.dropbox.com/sh/btilo6qsqyjwluv/ilhsMU5MFA)
Geras allows time and rollup queries as well as subscribing using MQTT/WebSockets.
To view the full Geras API, signup for an account at http://geras.1248.io, then login and see the API tab.

I would suggest that, given the short timeframe for the 29th, you start by modifying the apps I shared last Friday - which access known data series from Geras.
For example, motion.html and energy.html should get you most of what you need for the ARM app presentation you shared.

http://212.49.230.229:8000/cats/ARM1       ........To access ARM cat from us.
http://dev.1248.io:8001/cats/ARM1            .........To access ARM cat through Toby's PathFinder.

"https://dev.1248.io:8002/cats/ARMAlertMe?key=f99864c3e8bf55b2de28d76fca76d10e", //
    //url:"http://212.49.230.229:8000/cats/ARM1",
	//url:"http://geras.1248.io/cat/enlight?key=1bfc8d081f5b1eed8359a7517fdb054a",

*/

/*
request.get({
    url: 'http://geras.1248.io/cat',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("HyperCat discovery".green,body);
});


request.post({
    url: "http://geras.1248.io/series/abc",
	body: JSON.stringify(data),
    headers: {
        'content-type':'application/json',
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("post series ".green,body);
});

//https://geras.1248.io/public/armhome_16_SkyDisplay_00-0D-6F-00-00-F2-62-A5_signal
//https://geras.1248.io/public/armhome_1_MeterReader_00-0D-6F-00-00-F2-6E-23_energy?key=ADMINSECRET

request.get({
    url: 'http://geras.1248.io/serieslist',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("response get serieslist".green,body);
});


request.get({
    url: 'http://geras.1248.io/serieslist?pattern='+encodeURIComponent('/abc/+'),
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("List series matching MQTT pattern".green,body);
});



function getHistoryDataOnDevice(url,key){
    request.get({
        url: 'http://geras.1248.io/now/abc/lightcc',
        headers: {
            'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
        }
    }, function(error, response, body) {
	    if(error)
	    console.log("error  ".red, error);
	    else
	    console.log("Read most recent value".green,body);
    });
}

function getRealTimeData(url,key){
    request.get({
        url: 'http://geras.1248.io/series/foo/temperature?start=1234&end=2468',
        headers: {
            'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
        }
    }, function(error, response, body) {
	    if(error)
	    console.log("error  ".red, error);
	    else
	    console.log("Time windowing".green,body);
    });
}




request.get({
    url: 'http://geras.1248.io/series/abc/lightcc',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("Read single series data".green,body);
});


request.get({
    url: 'http://geras.1248.io/series/abc?recursive',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("Read single recursive data".green,body);
});




*/