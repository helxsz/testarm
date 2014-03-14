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
	im = require('imagemagick'),
	redis= require('redis'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	catalog = require('./serviceCatalog.js'),
	appBuilder = require('./AppBuilder.js');
	


app.get('/:user/apps',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	appBuilder.getAppList(function(err,data){
	     res.json(200);	
	})
})

app.post('/:user/apps',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.createApp(function(err,data){
	     res.json(200);	
	})
   

})

app.get('/:user/apps/:app',function(req,res,next){   
    var user = req.params.user, app = req.params.app;
	
	appBuilder.getApp(function(err,data){
	     res.json(200);	
	})
})

app.put('/:user/apps/:app',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.updateApp(function(err,data){
	     res.json(200);	
	})

})

app.delete('/:user/apps/:app',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.deleteApp(function(err,data){
	     res.json(200);	
	})

})
