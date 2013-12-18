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

var Service = function(obj) {
        
		this.serviceObj = obj; 
				
		this.getName = getName;
		this.getDescription = getDescription;
		this.getHost = getHost;
		this.getURL = getURL;
		this.getKey = getKey;
		this.getRaw = getRaw;
		this.getPattern = getPattern;
		this.supportMQTT = supportMQTT;
		
		function getPattern(){
		    if(this.serviceObj) return this.serviceObj.pattern;			
			else return null; 
		}
		
        function getRaw(){
		    return this.serviceObj;
		}		
		
		function getName(){
		    if(this.serviceObj) return this.serviceObj.name;			
			else return null;
		}

		function getDescription(){
		    if(this.serviceObj) return this.serviceObj.description;			
			else return null;		
		}
		
		function getHost(){
		    if(this.serviceObj) return this.serviceObj.host;			
			else return null;
		}		
		
		function getURL(){
		    if(this.serviceObj) return this.serviceObj.url;			
			else return null;		
		}

		function getKey(){
		    if(this.serviceObj) return this.serviceObj.key;			
			else return null;		
		}

        function supportMQTT(){
		    if(this.serviceObj.RT=='mqtt')
		    return true;
			else return false;
		}
		
	    //////////////////////////////////
        this.fetchResourceList = fetchResourceList;
		this.fetchResourceDetail = fetchResourceDetail;
		this.getResourceData = getResourceData;
        this.getResourceTag = getResourceTag;
		
        function fetchResourceList( callback){
            var service = this.serviceObj;
            request.get({  
                url: this.serviceObj.url,	
                headers: {
		            'Authorization': 'Basic ' + new Buffer(service.key+":").toString('base64')
		            ,'content-type':'application/json'		
                },
	            rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }, function(error, response, body) {
	            if(error)
	            { 
		            winston.error("error  ".red, error);
			        callback(error,null);
		        }
	            else
	            {  	
                    var obj ;				
                    try{	
                        //winston.debug('getResourceList'+body);					
		                obj = JSON.parse(body);
						obj.service = service.name;
						obj.host = service.host;
                    }catch(e){
					    return callback(e,null);
					}					
			        callback(null,obj);
		        } 
            }); 
        }

        function fetchResourceDetail(url, callback){
		    var service = this.serviceObj;
            request.get({  
                url: url,	
                headers: {
		            'Authorization': 'Basic ' + new Buffer(service.key+":").toString('base64')
		            ,'content-type':'application/json'		
                },
	            rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }, function(error, response, body) {
	            if(error){ 
		            winston.error("error  ".red, error);
			        callback(error,null);
		        }
	            else
	            { 		
                    //winston.debug('getResourceDetail'+body);				
                    var obj ;		
                    					
                    try{				
		                obj = JSON.parse(body);
                    }catch(e){
					    return callback(e,null);
					}	
                    obj.url = url;					
			        callback(null,obj);
		        } 
            }); 
        }

		
		//requestDataByURL(enlight,'enlight/Ballast00002916/dolFinTemperature','?interval=1h&rollup=avg',DataHandler);

        function getResourceData(url, time,callback)	{
		    var service = this.serviceObj;
            request.get({  
                url: 'http://'+service.host+'/series/'+ url +time,	
                headers: {
		            'Authorization': 'Basic ' + new Buffer(service.key+":").toString('base64')
		            ,'content-type':'application/json'		
                },
	            rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }, function(error, response, body) {
	            console.log('requestDataByURL'.green, url);
	            if(error){ 
		            winston.error("error  ".red, error);
			        callback(error,null);
		        }
	            else
	            { 	
                    winston.debug('getResourceData'+body);				
                    var obj ;				
                    try{				
		                obj = JSON.parse(body);
                    }catch(e){
					    return callback(e,null);
					}					
			        callback(null,obj);
		        } 
             }); 
        }

        function getResourceTag(url, callback)	{
		    var service = this.serviceObj;
            request.get({  
                url: 'http://'+service.host+'/tags/'+ url,	
                headers: {
		            'Authorization': 'Basic ' + new Buffer(service.key+":").toString('base64')
		            ,'content-type':'application/json'		
                },
	            rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }, function(error, response, body) {
	            console.log('requestDataByURL'.green, 'http://'+service.host+'/tags/'+ url);
	            if(error){ 
		            winston.error("error  ".red, error);
			        callback(error,null);
		        }
	            else
	            {
                    winston.debug('getResourceTag'+body);				
                    var obj ;				
                    try{				
		                obj = JSON.parse(body);
                    }catch(e){
					    return callback(e,null);
					}					
			        callback(null,obj);
		        } 
             }); 
        }		
		
};

module.exports = Service;