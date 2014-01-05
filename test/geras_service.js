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
	winston = require('../utils/logging.js');
	
	
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