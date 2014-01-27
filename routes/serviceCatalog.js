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
	winston = require('../utils/logging.js'),
	Service = require('./service.js');


	
var ServiceCatalog = function(database) {

        var list = {};


        if (ServiceCatalog.prototype._singletonInstance) {
             return ServiceCatalog.prototype._singletonInstance;
        }
        ServiceCatalog.prototype._singletonInstance = this;
	       
		this.database = database; 
				
		this.findRawByName = findRawByName;
		this.findByName = findByName;
        this.findByURL = findByURL;
		this.addService = addService;
		this.removeService = removeService;
		this.getList = getList;

		function getList(){
		    return [enlight,armhome,armmeeting,armbuilding];
		}

		function findRawByName(name){
			var rawObj = list[name];
			return rawObj;
		}
		
		function findByName(name){
			var rawObj = list[name];
			if(rawObj)
			return new Service(rawObj);
            else 
            return null;
		}

		function findByURL(url){
		    return new Service(enlight);
		}
		
		function addService(service){
		    winston.info('addService '.green+service);
		    if(service.name)
			list[service.name] = service;
		}

        function removeService(service){
		    winston.info('removeService '+service);
		    if(service){
			    var name = service; 
			    list[name] = null;
			}
		}

        ////////////////////////////////////////////////////////////
		
		this.findRTService = findRTService;
		this.addRTService = addRTService;
		this.removeRTService =removeRTService;
		
		var RTList= {};
		
        function findRTService(name){
		    var RTService = RTList[name];
		    if(RTService)
		    return RTService;
		}		
		
		function addRTService(name,serviceObj){
		    var RTService = RTList[name];
		    if(!RTService) 
			{ 
			    winston.info('add new RT SERVICE '+name);
			    RTList[name] = serviceObj;
				return true;
			}	
			return false;
		}
		
		function removeRTService(name){
		    var RTService = RTList[name];
		    if(RTService) 
			{ 
			    winston.info('removeRTService',name);
			    RTService.stopService();
			    delete RTService;
				RTList[name] = null;
				return true;
			}else{
			    winston.info('removeRTService  service not found',name);
			}	
			return false;		
		}
		
		
};	


module.exports = new ServiceCatalog();
//module.exports = {enlight:enlight,armhome:armhome,armmeeting:armmeeting,armbuilding:armbuilding};	