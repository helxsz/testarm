var app = require('../app').app;
   
var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
	 path = require('path'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda'),
	redis = require('redis');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	serviceCatalog = require('./serviceCatalog.js'),ServiceBuilder = require('./serviceBuilder.js'),serviceBus = require('./serviceBusService.js'),
	appBuilder = require('./AppBuilder.js'),
	SensMLHandler = require('./senMLHandler.js'),
    catalogModel = require('../model/catalog_model.js'),
	catalog_crawler = require('./catalog_crawler.js'),
	catalogDB = require('./catalog_db.js'),
	catalogFactsModel = require('../model/catalog_fact_model.js'),
	catalogFilter = require('./catalog_filter.js'),
	catalogUpdater = require('./catalogUpdater.js');
// http://sailsjs.org/#!documentation/policies	
// http://schema.org/Event
// https://github.com/indexzero/node-schema-org

//serviceCatalog.removeRTService('armmeeting');
// Bootstrap controllers
function bootApps(app,route) {
	fs.readdir(route, function(err, files){
		if (err) throw err;
		files.map(function (file) {
            return path.join(route, file);
        }).filter(function (file) {
            return fs.statSync(file).isFile();
        }).forEach(function (file) {         
			var i = file.lastIndexOf('.');
            var ext= (i < 0) ? '' : file.substr(i);
			if(ext==".js")
			bootApp(app, file);	
        });
	});
}


//root http://data.openiot.org/cat   http://stackoverflow.com/questions/13615381/d3-add-text-to-circle
/*
 1. crawler the root catalog 
 2. and save into the mongodb database 
 3. and update the catalog 
 4. and push new catalog results to the new apps
*/ 
 
var serviceBuilder = new ServiceBuilder(serviceCatalog);
//serviceBuilder.build([enlight,armhome,armmeeting,armbuilding,intellisense]);
serviceBus.startService();

// old API 

catalogDB.checkDB(function(err,data){
	if(err){		
	}else if(data == 1){
		console.log('semantic data right'.green);
		//catalogUpdater.updateMeetingRoomAndLocation();
		catalogUpdater.updateHomeCatalog();			
}else if(data ==0){
		console.log('semantic data empty '.red);
		/*
		catalogUpdater.updateMeetingRoomAndLocation(function(){
		
			console.log('now boot the applications  layer'.green);
			bootApps(app,__dirname + '/apps');			
		});
        */		
	}
})


// 1. crawl Root catalogs
/**/

function crawlRoot(_callback){
	catalogUpdater.crawlRoot(function(err,data){
		console.log('crawel root '.green,data.items);
		var subcatalogs = data.items;
		var catalogs = [];
		
		bootApps(app,__dirname + '/apps');
		
		async.forEach(subcatalogs, 
			function (e, callback){ 
				console.log(e.href); // print the key
				var metadatas = e['i-object-metadata'];
				var description='', key='', url;
				url = e.href;
				metadatas.forEach(function(meta){
					//console.log(meta.rel, meta.val);
					if(meta.rel == 'urn:X-tsbiot:rels:isContentType'){			
					}else if(meta.rel == 'urn:X-tsbiot:rels:hasDescription:en'){
						description = meta.val;
					}else if(meta.rel == 'urn:X-tsbiot:rels:hasKey'){
						key = meta.val;
					}
				})			
				var arr = url.split('/');			
				console.log('subcatalog in the root  '.green,url, key ); //description ,
				catalogs.push({url:url,key:key, name:arr[arr.length-1], description:description});
				
				serviceCatalog.addService({url:url,key:key, name:arr[arr.length-1], description:description});
				callback(); 
		},  function(err) {
				console.log('finish crawl the root catalog '.green); 
			  // 2. crawl the sub catalogs 
			  catalogUpdater.crawlSubCatalogs(catalogs,function(err,data){
				  console.log('finish crawl all the catalogs .....................'.green,data);
				  serviceBus.sendTopicMessage('catalog',JSON.stringify(data));
				  if(_callback) _callback();
			  })			
		});		
	});
}

function startUP(){
	catalogModel.getCatalogs(function(err,catalogs){
		if(err) console.log('getCatalogs   ---  get catalog sensor data '.red);
		else if(!catalogs){  console.log(' no catalogs found');  }
		else{
			//  2. build the services
			serviceBuilder.build(catalogs);
				
			//console.log('now boot the applications  layer'.green);
			// 4. build the applications
			bootApps(app,__dirname + '/apps');
			// boot real time services 
			// 5. build the real time services
			bootRealTimeServices(catalogs); 		
		
		}
	})
}

startUP();

function bootApp(app, file) {
	var name = file.replace('.js', '');
	require( name);				
}

function bootRealTimeServices(catalogs){
    catalogs.forEach(function(catalog){
        if( catalog.url=='https://geras.1248.io/cat/armmeeting')
        serviceBuilder.buildRTService(catalog.url, SensMLHandler);	
	})
}


// localhost/admin/repository//delete
app.get('/admin/catalogs/:id/delete',function(req,res,next){
    // res:room:*   res:home:*   res:sensor:*    res:*
	var id = req.params.id;
	if(id == 'room' ){
	    id = 'res:room:*'
	}else if(id == 'home'){
	    id = 'res:home:*';
	}else if(id == 'sensor'){
	    id = 'res:sensor:*';
	}
    catalogDB.flushDB(id,function(){
        res.send(200);	
	});
})
// http://localhost/admin/catalogs/update
app.get('/admin/catalogs/update',function(req,res,next){
    crawlRoot(function(){
	    res.send(200);
	})
})
// http://localhost/admin/catalogs/empty
app.get('/admin/catalogs/empty',function(req,res,next){
    catalogDB.flushALL(function(){
        res.send(200);
    });
})

var schedule = require('node-schedule');
var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = [0, new schedule.Range(0, 6)];
rule2.hour = 1;
rule2.minute = 34;

var j = schedule.scheduleJob(rule2, function(){
    console.log('running the event analytics rule!'.red);
	catalogUpdater.updateMeetingRoomAndLocation();
	catalogUpdater.updateHomeCatalog();
});


/***************************************
****************************************/
//saveResourceList();
function saveResourceList(){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();		
    }	
	var time = new Date().getTime();
	redisClient.sadd('site1:building1:0','room1');
	redisClient.sadd('site1:building1:0','room2');
	redisClient.sadd('site1:building2:1','room3');
	redisClient.sadd('site1:building2:1','room4');
	redisClient.sadd('site2:building2:1','room4');
    redisClient.keys("site1:*",function(err, members){
        if( !members ){
            members = [];
			
        }
		console.log('site1  ', members);
    });

    redisClient.keys("site1:building1:*",function(err, members){
        if( !members ){
            members = [];
			
        }
		console.log('site1 building 1  ', members);
    });
	
    redisClient.smembers('site1:building1:0',function(err, members){
        if( !members ){
            members = [];
			
        }
		console.log('site2  ', members);
    });	
	
	catalogDB.flushDB("site1:*",function(){});
	catalogDB.flushDB("site2:*",function(){});
	//redisClient.quit();	
}