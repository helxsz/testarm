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
	appBuilder = require('./AppBuilder.js');
	SensMLHandler = require('./senMLHandler.js'),
	simulation = require('./simulation.js');

// http://sailsjs.org/#!documentation/policies	
// http://schema.org/Event
// https://github.com/indexzero/node-schema-org
/************************************************************************
	request to 1248
http://wiki.1248.io/doku.php?id=hypercat
http://geras.1248.io/user/apidoc	
	
List of metadata properties in use   http://wiki.1248.io/doku.php?id=hypercatmetadatalist
https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnx0c2JvcGVuaW90fGd4OjJiMDhjYzRlZWI1OTk2NGI
http://wiki.1248.io/lib/exe/fetch.php?media=hypercat-overview.pdf	
http://imove-project.org/cat i-Move Project
http://strauss.ccr.bris.ac.uk/catalogue/services/api/root IoT-Bay Project	
*************************************************************************/

/**************************************************************
https://github.com/tobyjaffey/coap-cat-proxy/blob/master/coap-cat-proxy.js
http://wiki.1248.io/doku.php?id=senml
http://wiki.1248.io/doku.php?id=hypercat
http://wiki.1248.io/doku.php?id=pathfinderpermissionsapi
https://alertmeadaptor.appspot.com

**************************************************************/
// http://5.79.20.223:4001/cat/ARM6    http://data.openiot.org/cat
/****   experiment 1 ********/
    var enlight = {
	    'name': 'enlight',
		'description': 'Streetlight data',
		'url': 'https://geras.1248.io/cat/enlight',
		'key':'1bfc8d081f5b1eed8359a7517fdb054a',
        'pattern':'enlight',
		'host':'geras.1248.io',
        'cat':'enlight',
        'RT':'mqtt'		
	},
	armhome = {
	    'name': 'armhome',
		'description': 'ARM homes data',
		'url': 'https://geras.1248.io/cat/armhome',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armhome',
		'host':'geras.1248.io',
        'cat':'armhome',
        'RT':'mqtt'			
	},
	armmeeting = {
	    'name': 'armmeeting',
		'description': 'ARM meeting room data',
		'url': 'https://geras.1248.io/cat/armmeeting',
		'key':'924a7d4dbfab38c964f5545fd6186559',
        'pattern':'armmeeting',
		'host':'geras.1248.io',
        'cat':'armmeeting',
        'RT':'mqtt'			
	},
	armbuilding = {
	    'name': 'armbuilding',
		'description': '',
		'url': 'https://protected-sands-2667.herokuapp.com/cat',
		'key':'0L8kgshd4Lso3P1UQX7q',
		'pattern':'',
		'host':'protected-sands-2667.herokuapp.com',
		'cat':''
    },
	intellisense = {
	    'name': 'intellisense',
		'description': '',
		'url': 'https://5.79.20.223:3000/cat/ARM6',
		'key':'d01fe91e8e249618d6c26d255f2a9d42',
		'pattern':'',
		'host':'protected-sands-2667.herokuapp.com',
		'cat':''
    };

var serviceBuilder = new ServiceBuilder(serviceCatalog);
// put the service into the service catalog, the catalog will be used by the app layer
serviceBuilder.build([enlight,armhome,armmeeting,armbuilding]);
serviceBus.startService();
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

function bootApp(app, file) {
	var name = file.replace('.js', '');
	require( name);				
}

function bootRealTimeServices(){
    serviceBuilder.buildRTService('armmeeting', SensMLHandler);
    serviceBuilder.buildRTService('enlight', SensMLHandler);
   //serviceBuilder.buildRTService('armhome', SensMLHandler);
}
	
setTimeout(function(){
    console.log('timeout  ');
	bootApps(app,__dirname + '/apps');
	bootRealTimeServices();
}, 3000);	

// http://localhost/all/meeting
app.get('/all/meeting',function(req,res,next){
    getResourceList2('cat:armmeeting',function(err,data){
	    res.send(200,data);
	});
})

app.get('/catalog',function(req,res,next){   
    var type = req.query.type;
    var enlightService = serviceCatalog.findByName(type);
    try{
        enlightService.fetchResourceList(function(err,data){
	            if(err) {  winston.error(err.name + ": " + err.message);  res.send(404,err);}
	            else res.json(200,data);			
		});		
    }catch(e){  
		winston.error('service not found'); 
		res.send(404);
	}
})

// http://localhost/catalog/tag?type=enlight&url=enlight/Ballast00002897
// http://localhost/catalog/tag?type=armmeeting&url=armmeeting/1/MotionSensor/00-0D-6F-00-00-C1-2E-EF	   
app.get('/catalog/tag',function(req,res,next){   
    var type = req.query.type, url = req.query.url;
    var enlightService = serviceCatalog.findByName(type);
	
    try{
        enlightService.getResourceTag(url,function(err,data){
	            if(err) {  winston.error(err.name + ": " + err.message);  res.send(404,err);}
	            else res.json(200,data);			
		});		
    }catch(e){  
		winston.error('service not found'); 
		res.send(404);
	}
})


	/*
	client.hgetall("device:"+url, function (err, data) {
        console.log('hgetall  reply 2'+data);	
    });

function findResource(context,url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('find Resource eInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	

	redisClient.hmget(context+url, item,function(err, data){
	    redisClient.quit();
		data.url = url;
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});

	redisClient.quit();
	return callback(null,1);
}

function saveResourceInBulk(context, url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port;	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
		
	var mul = redisClient.multi();
    for(var index in item) {
		mul.hmset(context+url,index,item[index],function(){})
    }		
	mul.exec(function (err, replies) {
        console.log("save Resource ".green + replies.length + " replies");
    });
	redisClient.quit();
	return callback(null,1);
}
 */
 
 
/*
function clearResourceList(service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceIntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers('cat:'+service).exec(function (err, replies) {
		console.log('services     '.green +  replies+"  ");
    });
	redisClient.quit();  
	return callback(null,1);
}

function getResourceList(context,service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('get ResourceList Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers(context+service).exec(function (err, replies) {
		console.log('services     '.green +  replies.length+"  ");
		replies.forEach(function (reply, index) {
             console.log("Reply " + index + ": " + reply.toString() +"\n" );
        });
		return callback(null,replies);
    });
	redisClient.quit();  	
}

function saveResourceList(context,service ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
    //redisClient.zadd('imgs:'+service,time,JSON.stringify({'img':img_id,'time':time}));
	redisClient.sadd(context+service,JSON.stringify({'item':item}));
	redisClient.incrby(context+service+':count',1);
	redisClient.quit();
	return callback(null,1);
}
*/


var URI = require('URIjs');

var unexplored = [];    // list of catalogues URLs to expand
var explored = [];      // list of expanded catalogue URLs
var facts = [];         // array of facts [{subject, predicate, object},...]

function storeFact(o) {
    // only store unique facts
    for (var i=0;i<facts.length;i++) {
        if (facts[i].subject == o.subject &&
            facts[i].predicate == o.predicate &&
            facts[i].object == o.object)
                return;
    }
    facts.push(o);
}

function fetch(root, option, cb) {
    //console.log("FETCH "+root);
    //request(root, function (err, rsp, body) {

    var h = {};
    if (option.key !== undefined)
        h.Authorization = 'Basic ' + new Buffer(option.key + ':').toString('base64')

    request.get({
        url: root,
        headers: h
    }, function(err, rsp, body) {
        if (!err && rsp.statusCode == 200) {
            if (cb !== undefined) {
                try {
                    cb(null, JSON.parse(body));
                } catch(e) {
                    console.error("Error parsing "+root+" "+body);
                    cb("err parsing", null);
                }
            }
        } else {
            if (rsp)
                cb("Status code " + rsp.statusCode, null);
            else
                cb("Fetch error "+err, null);
        }
    });
}

function expandCatalogue(url, doc) {
    var i;
    try {
        // store metadata for catalogue
        for (i=0;i<doc['item-metadata'].length;i++) {
            //console.log("CATL-FACT "+url+" "+doc['item-metadata'][i].rel+" "+doc['item-metadata'][i].val);
            storeFact({
                subject: url,
                predicate: doc['item-metadata'][i].rel,
                object: doc['item-metadata'][i].val,
                context: url
            });
        }
    } catch(e) {
        console.error(e);
    }

    try {
        // store metadata for items and expand any catalogues
        for (i=0;i<doc.items.length;i++) {
            var item = doc.items[i];
            item.href = URI(item.href).absoluteTo(url).toString();    // fixup relative URL
            // store that catalogue has an item
            storeFact({
                subject: url,
                predicate: "urn:X-tsbiot:rels:hasResource",
                object: item.href,
                context: url
            });
            for (var j=0;j<item['i-object-metadata'].length;j++) {
                var mdata = item['i-object-metadata'][j];
                //console.log("ITEM-FACT "+item.href+" "+mdata.rel+" "+mdata.val);
                storeFact({
                    subject: item.href,
                    predicate: mdata.rel,
                    object: mdata.val,
                    context: url
                });

                // if we find a link to a catalogue, follow it
                if (mdata.rel == "urn:X-tsbiot:rels:isContentType" &&
                    mdata.val == "application/vnd.tsbiot.catalogue+json") {
                        //unexplored.push(item.href);
                        unexplored.push(item.href);
                }
            }
        }
    } catch(e) {
        console.error(e);
    }
}

function crawl(option,cb) {
    if (unexplored.length > 0) {    // something to explore
        var url = unexplored.pop();

        if (explored.indexOf(url) == -1) {   // not seen before
            fetch(url, option, function(err, doc) {
                if (err) {
                    console.error("Error in "+url+" ("+err+")");
                    explored.push(url); // was bad, but explored
                    crawl(option,cb);
                } else {
                    explored.push(url);
                    expandCatalogue(url, doc);    // parse doc
                    crawl(option,cb);    // do some more work
                }
            });
        } else {
            crawl(option,cb);  // get next
        }
    } else {
        cb();   // done
    }
}

// dump a graph in dot/GraphViz format
function dumpGraph() {
    if (facts.length) {
        console.log("digraph {");
        for (var i=0;i<facts.length;i++) {
            console.log('    "'+facts[i].subject+'" -> "'+facts[i].object+'" [label="'+facts[i].predicate+'"];');
        }
        console.log("}");
    }
}

// dump a graph in N-Quads format
function dumpNQuads() {
    function f(s) { // FIXME, not a great way to detect URI
        if (s.match(/^http/) || s.match(/^mqtt/) || s.match(/^urn:/) || s.match(/^\//))
            return '<'+s+'>';
        else
            return '"'+s+'"';
    }
    for (var i=0;i<facts.length;i++) {
        console.log(f(facts[i].subject)+' '+f(facts[i].predicate)+' '+f(facts[i].object)+' '+f(facts[i].context)+' .');
    }
}

startCrawl(armbuilding);

function startCrawl(option){
	// add root catalogue URL to crawl list
	unexplored.push(option.url);
	crawl(option,function() {
		if (true)
			dumpNQuads();
		else
			dumpGraph();
	});
}