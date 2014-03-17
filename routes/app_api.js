var app = require('../app').app;
    
var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
	 path = require('path'),
    moment = require('moment'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	appBuilder = require('./AppBuilder.js'),
	appModel = require('../model/app_model.js');
	
/*******************************************************
app API
*******************************************************/
app.get('/admin/apps',function(req,res,next){
	appModel.getApps({},function(err,data){
		if(err) { 
		    console.log('wrong get apps '.red);
			res.send(500,err);
		}	
		else if(!data || data.length==0){
            res.send(404);		
		}
		else if(data){
		    res.json(200,data);
		    //console.log('find apps '.green,data);
		}
	})
})

app.get('/admin/app/:name',function(req,res,next){
    var name = req.params.name;
	if(name !=null){
		appModel.searchApp(name,function(err,data){
			if(err) { 
				console.log('wrong get apps '.red);
				res.send(500,err);
			}	
			else if(!data){
				res.send(404);		
			}
			else if(data){
				res.json(200);
			}
		})   
	} 
	else 
	res.send(200,{error:'name is wrong'});
})

app.del('/admin/app/:name',function(req,res,next){
    var name = req.params.name, catalog_url = req.query.url;
	if(name !=null && catalog_url !=null){
		appModel.removeAppCatalog(name,{'url':catalog_url},function(err,data){
			if(err) { 
				console.log('wrong get apps '.red);
				res.send(500,err);
			}	
			else if(!data || data==0){
				res.send(404);		
			}
			else if(data){
				res.json(200);
			}
		})   
	} 
	else 
	res.send(200,{error:'url is wrong'});
})





// app API for user

app.get('users/:user/apps',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	appBuilder.getAppList(function(err,data){
	     res.json(200);	
	})
})

app.post('users/:user/apps',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.createApp(function(err,data){
	     res.json(200);	
	})
})

app.get('users/:user/apps/:app',function(req,res,next){   
    var user = req.params.user, app = req.params.app;
	
	appBuilder.getApp(function(err,data){
	     res.json(200);	
	})
})

app.put('users/:user/apps/:app',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.updateApp(function(err,data){
	     res.json(200);	
	})
})

app.delete('users/:user/apps/:app',function(req,res,next){
    var user = req.params.user, app = req.params.app;
	
	appBuilder.deleteApp(function(err,data){
	     res.json(200);	
	})
})
