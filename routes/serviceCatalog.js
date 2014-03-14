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
	Service = require('./service.js'),
	catalogModel = require('../model/catalog_model.js');
 
/*	
catalogModel.storeCatalog(enlight.url,  enlight.key, enlight.name, enlight.description, function(err,data){
    if(err) console.log('storing the data wrong'.red, data);
	else console.log('success '.green, data);
})

catalogModel.getCatalogs(function(err,data){
    if(err) console.log('get catalog sensor data '.red);
    else console.log('success get catalogs '.green, data);
})

catalogModel.searchCatalog(intellisense.url,function(err,data){
    if(err) console.log('get catalog sensor data '.red);
    else console.log('success get catalogs '.green, data);
})
*/
	
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

/*	
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
*/

		function getList(){
			catalogModel.getCatalogs(function(err,data){
			    if(err) console.log('get catalog sensor data '.red, err);
			    else console.log('success get catalogs '.green, data);
			})
		}

		function findRawByName(name,callback){
			catalogModel.searchCatalog({name:name},function(err,data){
				if(err || !data) {
				    console.log('get catalog sensor data '.red, err);
					callback(err,null); 
				}	 
				else {
				    console.log('success get catalogs '.green, data);
					delete data._id;
					data.RT = 'mqtt';
					var arr = data.url.split('/');
					data.host = arr[2];
					data.pattern = arr[arr.length-1];
					console.log('   --------  ',data.host,data.pattern);
					callback(null,new Service(data));
				}	
			})
		}
		
		function findByName(name,callback){
			catalogModel.searchCatalog({name:name},function(err,data){
				if(err || !data) {
				    console.log('get catalog sensor data '.red,err);
					callback(err,null); 
				}	 
				else {
				    //console.log('success get catalogs '.green, data);
					delete data._id;
					data.RT = 'mqtt';
					var arr = data.url.split('/');
					data.host = arr[2];
					data.pattern = arr[arr.length-1];
					//console.log('   --------  ',data.host,data.pattern);
					callback(null,new Service(data));
				}	
			})
		}

		function findByURL(url,callback){
			catalogModel.searchCatalog({url:url},function(err,data){
				if(err || !data) {
				    console.log('findByURL  get catalog sensor data '.red,err);
					callback(err,null); 
				}	 
				else {
				    //console.log('success get catalogs '.green, data);
					delete data._id;
					data.RT = 'mqtt';
					var arr = data.url.split('/');
					data.host = arr[2];
					data.pattern = arr[arr.length-1];
					//console.log('   --------  ',data.host,data.pattern);
					callback(null,new Service(data));
				}	
			})
		}

		function addService(service){
			catalogModel.storeCatalog(service.url,service.key,service.name, service.description,  function(err,data){
				if(err) console.log('storing the data wrong'.red, err);
				else if(data && data ==1) {
				    console.log('add catalog Service success '.green);
				}else if(data && data ==0){
				    console.log('add catalog Service failed '.red); 
				}	
			})
		}

        function removeService(service){
		    winston.info('removeService '+service);
			catalogModel.removeCatalog(service.url ,function(err,data){
				if(err) console.log('removeService wrong'.red, data);
				else console.log(' removeService success '.green, data);
			})
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