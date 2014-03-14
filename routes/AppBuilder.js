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
	winston = require('../utils/logging.js'),
	App = require('./app.js');
		
var AppBuilder = function() {

		if (AppBuilder.prototype._singletonInstance) {
				 return AppBuilder.prototype._singletonInstance;
		}
		AppBuilder.prototype._singletonInstance = this;
		
		this.getUser = getUser;
		
		this.getAppList = getAppList;		
        this.createApp = createApp;       
        this.getApp = getApp;
		this.updateApp = updateApp;
		this.deleteApp = deleteApp;
		
        this.apps = {};

		function getUser(){
		
		}

		function getAppList(callback){
		    return callback(null);
		} 

		function createApp(description,messageCallback, callback){
		    var appID = (Math.random() * 1e18).toString(36);
            var app = new App(appID,description,messageCallback);
			this.apps[appID] = app;		    
		    return callback(null,app);
		}

		function getApp(appID,callback){
		    var app = this.apps[appID];
			if(app) return callback(null,app);
			else return callback('not found',null);
		}

		function updateApp(appID,callback){
		    var app = this.apps[appID];
			if(app) {
			    app.update();
			    return callback(null,'success');
			}	
			else return callback('not found',null);
		} 

		function deleteApp(appID,callback){
		    var app = this.apps[appID];
			if(app) {
			    app.remove();
			    delete app;
				this.apps[appID] = null;
			    return callback(null,'success');
			}	
			else return callback('not found',null);
		}		
};

module.exports = new AppBuilder();