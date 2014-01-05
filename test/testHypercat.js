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
	redis= require('redis'),
	request = require('request');	

	
var 
    errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
    catalog = require('../routes/serviceCatalog.js');	
/**********************************************************************************
Catalog description

***********************************************************************************/
var enlight = catalog.enlight,armhome = catalog.armhome, armmeeting= catalog.armmeeting,armbuilding= catalog.armbuilding; 

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