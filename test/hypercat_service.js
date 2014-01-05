var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	catalog = require('./serviceCatalog.js'),
	winston = require('../utils/logging.js');
	
/**********************************************************************************
Catalog description

***********************************************************************************/
var enlight = catalog.enlight,armhome = catalog.armhome, armmeeting= catalog.armmeeting,armbuilding= catalog.armbuilding; 
//hypercat.getList(armhome,DeviceListHandler);
//hypercat.getList(enlight,DeviceListHandler);
//hypercat.getList(armmeeting,DeviceListHandler);

//hypercat.getList(armbuilding,LocationListHandler);
//hypercat.getList(armbuilding,'https://protected-sands-2667.herokuapp.com/rooms/Room.BLRCauvery',LocationDetailHandler);
//hypercat.getList(armbuilding,'https://protected-sands-2667.herokuapp.com/rooms/Room.BLRCauvery/events',EventDetailHandler);
function getList(config, callback){
    console.log('-------------',config);

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
			callback(null,obj);
		} 
    }); 
}

function getDetail(config,url, callback){
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

exports.getList = getList;
exports.getDetail = getDetail;

	