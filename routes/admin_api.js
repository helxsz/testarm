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
	

/****   experiment 4 ********/
// http://localhost/clear
app.get('/clear',function(req,res,next){

    db.clearResource();
	res.send(200);
})