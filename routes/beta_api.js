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
	SensMLHandler = require('./senMLHandler.js');

// http://sailsjs.org/#!documentation/policies	
// http://schema.org/Event
// https://github.com/indexzero/node-schema-org
/************************************************************************
	request to 1248
https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnx0c2JvcGVuaW90fGd4OjJiMDhjYzRlZWI1OTk2NGI
http://imove-project.org/cat i-Move Project
http://strauss.ccr.bris.ac.uk/catalogue/services/api/root IoT-Bay Project	
https://alertmeadaptor.appspot.com
*************************************************************************/

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
		'key': 'vFFwWk1pClGtHOaK0ZyK',//'0L8kgshd4Lso3P1UQX7q',
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
serviceBuilder.build([enlight,armhome,armmeeting,armbuilding,intellisense]);
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
	
	



function catalog_crawler(option){

	var URI = require('URIjs');

	var unexplored = [];    // list of catalogues URLs to expand
	var explored = [];      // list of expanded catalogue URLs
	var facts = [];         // array of facts [{subject, predicate, object},...]
	
	this.option = option;
	
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

	function fetch(root,  cb) {
		//console.log("FETCH "+root);
		//request(root, function (err, rsp, body) {

		var h = {};
		if (option.key !== undefined)
			h.Authorization = 'Basic ' + new Buffer(option.key + ':').toString('base64')

		request.get({
			url: root,
			headers: h,
			rejectUnauthorized: false,
			requestCert: true,
			agent: false			
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

	function crawl(cb) {
		if (unexplored.length > 0) {    // something to explore
			var url = unexplored.pop();

			if (explored.indexOf(url) == -1) {   // not seen before
				fetch(url,  function(err, doc) {
					if (err) {
						console.error("Error in "+url+" ("+err+")");
						explored.push(url); // was bad, but explored
						crawl(cb);
					} else {
						explored.push(url);
						expandCatalogue(url, doc);    // parse doc
						crawl(cb);    // do some more work
					}
				});
			} else {
				crawl(cb);  // get next
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

	function startCrawl(option,callback){
		// add root catalogue URL to crawl list
		this.option = option;
		unexplored.push(option.url);
		crawl(function() {
		    /*
			if (true)
				dumpNQuads();
			else
				dumpGraph();
			*/	
			callback(facts);
		});
	}

    return {
	    startCrawl:startCrawl
	}	
}

var catalog_filter = function(){

    /////////////////////////  TSB ///////////////////////////////
	var CONTENT_TYPE = "urn:X-tsbiot:rels:isContentType";
	var IS_CATALOG = 'application/vnd.tsbiot.catalogue+json';
	var IS_SENML = 'application/senml+json';
	var IS_APPLICATIONTYPE_ROOM = 'application/json; profile=http://schema.org/Place/Room';

	var SUPPORTS_QUERY = 'urn:X-tsbiot:rels:supports:query';
	var SUPPORTS_MQTT = 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1';

	//////////////////////////  ONTOLOGY ////////////////////////////
	var HAS_LOCATION= 'http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation';
	var SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs';
	var GEO_LAT = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
	var GEO_LNG = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';

	var SCHEMA_EVENT = 'http://schema.org/event';
	var SCHEMA_ADDRESS = 'http://schema.org/addressLocality';
                          
	///////////////////////// ONTOLOGY WITHOUT CONTEXT ////////////////////////////
    var HAS_LOCATION_SHORT = 'hasLocation';
	var SAME_AS_SHORT = 'sameAs';
	var GEO_LAT_SHORT = 'lat';
	var GEO_LNG_SHORT = 'long';

	var SCHEMA_EVENT_SHORT = 'event';
	var SCHEMA_ADDRESS_SHORT = 'addressLocality';	
	
	function filterRoom(facts, _callback) {
		if (facts.length) {
		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });
			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );	

			var buildingService = serviceCatalog.findByName('armbuilding');
            var results = {};			
			async.forEach(array, function(key,callback){ 
					 				 
				var value = groups[key]; 				 
				//console.log(key , value );
                var hash = {};
                _.map(value,function(item){
				    if(item.predicate != 'urn:X-tsbiot:rels:hasDescription:en') 
				    hash[item.predicate]  = item.object;			    
				})				
				if(hash[CONTENT_TYPE] == IS_APPLICATIONTYPE_ROOM){
				    //console.log( hash[SCHEMA_EVENT], hash[SCHEMA_ADDRESS] );
					// add key , hash 
		            for(var index in hash) {
			            //console.log('-------------------------- '.green, index, hash[index]);
						if( index == SCHEMA_EVENT){
							hash[SCHEMA_EVENT_SHORT] = hash[SCHEMA_EVENT];
						}else if( index == SCHEMA_ADDRESS ){
							hash[SCHEMA_ADDRESS_SHORT] = hash[SCHEMA_ADDRESS];
						}else if( index == SAME_AS ){
							hash[SAME_AS_SHORT] = hash[SAME_AS];
						}					
                        delete  hash[index] ;						
		            }
					
					
					////////////////////////////////////////////////////
					buildingService.fetchResourceDetail(key,function(err,obj){
						if(err){
							winston.debug('error ',err);
						}else{               
							var address = JSON.stringify(obj.address),building = obj.building, floor = obj.floor;  
							if(address) hash['address'] = address;
							if(building) hash['building'] = building; 
							if(floor) hash['floor'] = floor;
						}
						results[key] = hash;
						callback();
					})					
					
				}else{
				    //console.log('not wanted '.red, key);
				   callback();
				}             
				
			 }, function(err) {      
				if(err){
					 console.log(err);
				}
				else{
				    var array = Object.keys(results);
					//console.log('complete   filterRoom'.green, array.length);
					if(_callback){
					    _callback(results);
					}					
				}
				delete facts;
			});
		}
	}	
	
	function filterSensors(facts, _callback){
		if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};			
			async.forEach(array, function(key,callback){ 				 				 
				var value = groups[key]; 				 
				//console.log(key , value );
                var hash = {};
                _.map(value,function(item){
				    if(item.predicate != 'urn:X-tsbiot:rels:hasDescription:en') 
				    hash[item.predicate]  = item.object;			    
				})
				
				if(hash[CONTENT_TYPE] == IS_SENML){
				    //console.log( hash[SUPPORTS_QUERY], hash[SUPPORTS_MQTT] , hash[GEO_LAT], hash[GEO_LNG], hash[SAME_AS]);
					// add key , hash
					var arr = key.split('/'), attribute = arr[arr.length-1], parent_key = key.substring(0, key.indexOf(attribute)-1);                  
					if(results[parent_key] ==null)  results[parent_key] = {};					
					results[parent_key][attribute] = key;				
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == GEO_LAT){
							results[parent_key][GEO_LAT_SHORT] = hash[GEO_LAT];
						}else if( index ==  GEO_LNG ){
							results[parent_key][GEO_LNG_SHORT] = hash[GEO_LNG];
						}else if( index == SAME_AS ){
							results[parent_key][SAME_AS_SHORT] = hash[SAME_AS];
						}
						delete hash[index];
					}	
				}else if(hash[CONTENT_TYPE] == IS_CATALOG){
				    //console.log('not wanted, because it is catalog'.red, key);			
				}

                callback();				
			 }, function(err) {      
				if(err){
					console.log(err);
				}
				else{
				    var array = Object.keys(results);
					//console.log('complete   filterSensors'.green, array.length);
					if(_callback){
					    _callback(results);
					}
				}
				delete facts;								
			});
		}	
	}

	function filterHome(facts, _callback){
		if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};			
			async.forEach(array, function(key,callback){ 				 				 

				var value = groups[key]; 				 
				//console.log(key , value );
                var hash = {};
                _.map(value,function(item){
				    if(item.predicate != 'urn:X-tsbiot:rels:hasDescription:en') 
				    hash[item.predicate]  = item.object;			    
				})				
				if(hash[CONTENT_TYPE] == IS_SENML){
				    //console.log( hash[SUPPORTS_QUERY], hash[SUPPORTS_MQTT] , hash[GEO_LAT], hash[GEO_LNG], hash[SAME_AS]);
					var arr = key.split('/'), attribute = arr[arr.length-1], parent_key = key.substring(0, key.indexOf(attribute)-1);
					//console.log( attribute , parent_key    );
					if(results[parent_key] ==null)  results[parent_key] = {};				
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == "urn:X-senml:u"){
							//results[parent_key][attribute+":unit"] = hash["urn:X-senml:u"];;
						}else if(index == SUPPORTS_QUERY){
							results[parent_key][attribute] = key;
						}else if(index == SUPPORTS_MQTT){
							//results[parent_key][attribute+":mqtt"] = hash[SUPPORTS_MQTT];
						}else if( index == GEO_LAT){
							results[parent_key][GEO_LAT_SHORT] = hash[GEO_LAT];
						}else if( index ==  GEO_LNG ){
							results[parent_key][GEO_LNG_SHORT] = hash[GEO_LNG];
						}
						delete hash[index];
					}
				}
                else if(hash[CONTENT_TYPE] == IS_CATALOG){
	                for(var index in hash) {
			            console.log(' .. '.red, index, hash[index]);					

						delete hash[index];				
					}	               
                }							
                callback(); 				
			 }, function(err) {      
				if(err){
					console.log(err);
				}
				else{
				    var array = Object.keys(results);
					//console.log('complete   filterSensors'.green, array.length);
					if(_callback){
					    _callback(results);
					}
				}
				delete facts;								
			});
		}	
	}	
	
	function filterIntellisense(facts, _callback){
		if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};			
			async.forEach(array, function(key,callback){ 				 				 
				var value = groups[key]; 				 
				//console.log(key , value );
                var hash = {};
                _.map(value,function(item){
				    if(item.predicate != 'urn:X-tsbiot:rels:hasDescription:en') 
				    hash[item.predicate]  = item.object;			    
				})				
				if(hash[CONTENT_TYPE] == IS_SENML){
				    //console.log( hash[SUPPORTS_QUERY], hash[SUPPORTS_MQTT] , hash[GEO_LAT], hash[GEO_LNG], hash[SAME_AS]);
					var arr = key.split('/'), attribute = arr[arr.length-1], parent_key = key.substring(0, key.indexOf(attribute)-1);
					//console.log( attribute , parent_key    );
					if(results[parent_key] ==null)  results[parent_key] = {};
									
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == "urn:X-senml:u"){
							//results[parent_key][attribute+":unit"] = hash["urn:X-senml:u"];;
						}else if(index == SUPPORTS_QUERY){
							results[parent_key][attribute+":query"] = key;
						}else if(index == SUPPORTS_MQTT){
							//results[parent_key][attribute+":mqtt"] = hash[SUPPORTS_MQTT];
						}
						delete hash[index];
					}
				}else if(hash[CONTENT_TYPE] == IS_CATALOG){
				    //console.log('not wanted, because it is catalog'.red, key);			
				}

                callback();				
			 }, function(err) {      
				if(err){
					console.log(err);
				}
				else{
				    var array = Object.keys(results);
					//console.log('complete   filterSensors'.green, array.length);
					if(_callback){
					    _callback(results);
					}
				}
				delete facts;								
			});
		}	
	}	
	
	function filterEnlight(facts, _callback){
	    var hasEnlightID = 'urn:X-tsbiot:rels:hasEnlightID';
	    var hasHistory = 'urn:X-tsbiot:rels:hasHistory';
		var hasLampType = 'urn:X-tsbiot:rels:hasLampType';
		var hasVoltage = 'urn:X-tsbiot:rels:hasLampWattage';
		var hasLocation = "urn:X-tsbiot:rels:hasLocation";

	    var hasIDInShort = 'id';
	    var hasHistoryInShort = '"history"';
		var hasLampTypeInShort = 'lampTyp';
		var hasVoltageInShort = 'lampWattag';
		var hasLocationInshort = "location";
		
		if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};			
			async.forEach(array, function(key,callback){ 				 				 
				var value = groups[key]; 				 
				//console.log(key , value );
                var hash = {};
                _.map(value,function(item){
				    if(item.predicate != 'urn:X-tsbiot:rels:hasDescription:en') 
				    hash[item.predicate]  = item.object;			    
				})
				
				if(hash[CONTENT_TYPE] == IS_SENML){
				    //console.log( hash[SUPPORTS_QUERY], hash[SUPPORTS_MQTT] , hash[GEO_LAT], hash[GEO_LNG], hash[SAME_AS]);
					var arr = key.split('/'), attribute = arr[arr.length-1], parent_key = key.substring(0, key.indexOf(attribute)-1);
					//console.log( attribute , parent_key    );
					if(results[parent_key] ==null)  results[parent_key] = {};				
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == "urn:X-senml:u"){
							//results[parent_key][attribute+":unit"] = hash["urn:X-senml:u"];;
						}else if(index == SUPPORTS_QUERY){
							results[parent_key][attribute+":query"] = key;
						}else if(index == SUPPORTS_MQTT){
							//results[parent_key][attribute+":mqtt"] = hash[SUPPORTS_MQTT];
						}
						delete hash[index];
					}
				}else if(hash[CONTENT_TYPE] == IS_CATALOG){
				    //console.log('not wanted, because it is catalog'.red, key);	
		            for(var index in hash) {
			            console.log(' .. '.red, index, hash[index]);					
						if( index == hasEnlightID){
						    if(results[key]==null) results[key] = {};
							results[key][hasIDInShort] = hash[hasEnlightID];
							//console.log('catlaog id'.red, results[key][hasIDInShort]);
						}else if(index == hasHistory){
						    if(results[key]==null) results[key] = {};
							results[key][hasHistoryInShort] = hash[hasHistory];
							//console.log('catlaog history'.red, results[key][hasHistoryInShort]);
						}else if(index == hasLampType){
						    if(results[key]==null) results[key] = {};
							results[key][hasLampTypeInShort] = hash[hasLampType];
							//console.log('catlaog history'.red, results[key][hasLampTypeInShort]);
						}else if(index == hasVoltage){
						    if(results[key]==null) results[key] = {};
							results[key][hasVoltageInShort] = hash[hasVoltageInShort];
						}else if(index == hasLocation){
						    if(results[key]==null) results[key] = {};
							results[key][hasLocationInshort] = hash[hasLocation];
							//console.log('catlaog history'.red, results[key][hasLocationInshort]);
						}else if( index == GEO_LAT){
						     if(results[key]==null) results[key] = {};
							results[key][GEO_LAT_SHORT] = hash[GEO_LAT];
							//console.log('catlaog history'.red, results[key][GEO_LAT_SHORT]);
						}else if( index ==  GEO_LNG ){
						     if(results[key]==null) results[key] = {};
							results[key][GEO_LNG_SHORT] = hash[GEO_LNG];
							//console.log('catlaog history'.red, results[key][GEO_LNG_SHORT]);
						}
						delete hash[index];
					}					
				}

                callback();				
			 }, function(err) {      
				if(err){
					console.log(err);
				}
				else{
				    var array = Object.keys(results);
					//console.log('complete   filterEnlight'.green, array.length);
					if(_callback){
					    _callback(results);
					}
				}
				delete facts;								
			});
		}	
	}
	
	return {
	    filterRoom:filterRoom,
        filterSensors:filterSensors,
        filterIntellisense:filterIntellisense,
        filterEnlight:filterEnlight,
        filterHome:filterHome		
	}
}

function updateResourceRepository(){

	var SUPPORTS_QUERY = 'urn:X-tsbiot:rels:supports:query';
	var SUPPORTS_MQTT = 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1';

	var HAS_LOCATION= 'http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation';
	var SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs';
	var GEO_LAT = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
	var GEO_LNG = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';
	
	var SCHEMA_EVENT = 'http://schema.org/event';
	var SCHEMA_ADDRESS = 'http://schema.org/addressLocality';


	function saveResource(name ,hash ,callback){
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
			
		var mul = redisClient.multi();
		console.log('--------------------------------------------');
		for(var index in hash) {
			mul.hmset(name,index,hash[index],function(){})
			console.log('save resource '.green, index, hash[index]);
		}		
		mul.exec(function (err, replies) {
		    if(err) console.log('save error '+err);
			else{
			    //console.log("save Resource ".green + replies.length + " replies");
			}
		});
		redisClient.quit();
		return callback(null,1);
	}   

	function checkDB(callback){
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
		redisClient.keys("res:*", function(err, keys) {
		   console.log('res key',keys.length);		   
		   redisClient.quit();
		   if(keys.length >0){
		      return callback(null, 1);
		   }else{
		      return callback(null, 0);   
		   }  
		});       
	}

	// "res:sensor:*"
	// "res:home:*"
	// "res:room:*"
	// "res:*"
	function flushDB(key,callback){
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
		// delete all keys 		
		redisClient.keys(key, function(err, keys) {
		    if(err) redisClient.quit();
			else{
				console.log('res key',keys.length);		   
				var mul = redisClient.multi();
				keys.forEach(function(key){
				   console.log('try to delete the key : '.red,key);
				   //redisClient.del(key, function(err) {console.log(err);});	
					mul.del(key);			   
				})
				mul.exec(function (err, replies) {
					console.log("delete ".green + replies.length + " replies");
					redisClient.quit();				
				});			   
		   }	   
		});        
        return callback(null, 0); 		
	}

    function flushALL(callback){
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
    
		// flush the database
	    redisClient.flushdb(function(err, key) {
		    redisClient.quit();
		});	
        	
        return callback(null, 0); 	
	}	
	
	var filter = new catalog_filter();
	var crawler = new catalog_crawler(armbuilding);
		
	function updateRes(){
		async.series([
			// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Farmhome&traverseKey=924a7d4dbfab38c964f5545fd6186559&Submit=Browse						
			function(callback){
				crawler.startCrawl(armbuilding, function(facts){
					filter.filterRoom(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterRoom'.green, key_array.length);				
						async.forEach(key_array, 
						  function(key,callback){
							console.log(key , results[key]);						
							saveResource('res:room:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});					
					});
					callback(null, 'one'); 
				});    
			},

			function(callback){
				crawler = new catalog_crawler(armmeeting);
				crawler.startCrawl(armmeeting, function(facts){
					filter.filterSensors(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterSensor'.green, key_array.length);				
						async.forEach(key_array, function(key,callback){
							console.log('key:',key , 'value:',results[key]);
							saveResource('res:sensor:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});				
					});
					callback(null, 'one'); 
				});		
			},
			
			/*
			// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//5.79.20.223%3A3000/cat/ARM6&traverseKey=d01fe91e8e249618d6c26d255f2a9d42
			function(callback){
				crawler = new catalog_crawler(intellisense);
				crawler.startCrawl(intellisense, function(facts){
					filter.filterIntellisense(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterIntellisense'.green, key_array.length);				
						async.forEach(key_array, function(key,callback){
							console.log('hvac:'.green, key , results[key]);
							//saveResource('res:hvac:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});				
					});
					callback(null, 'one'); 
				});		
			},
			// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Fenlight&traverseKey=1bfc8d081f5b1eed8359a7517fdb054a&Submit=Browse
			function(callback){
				crawler = new catalog_crawler(enlight);
				crawler.startCrawl(enlight, function(facts){
					filter.filterEnlight(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterEnlight'.green, key_array.length);				
						async.forEach(key_array, function(key,callback){
							console.log(key ); // , results[key]
							//saveResource('res:light:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});				
					});
					callback(null, 'one'); 
				});						
			}
			/*
            	
			,function(callback){
				crawler = new catalog_crawler(armhome);
				crawler.startCrawl(armhome, function(facts){
					filter.filterEnlight(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterHome'.green, key_array.length);				
						async.forEach(key_array, function(key,callback){
							console.log(key , results[key]);
							//saveResource('res:home:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});				
					});
					callback(null, 'one'); 
				});		
			}
            */
		],function(err, results){
			console.log('crawler  finished  .....  '.green, results);
			//integrate();

            setTimeout(function(){
				console.log('now boot the applications  layer'.green);
				bootApps(app,__dirname + '/apps');
				bootRealTimeServices();
			}, 2000);
			
		});	
	}


	function testHome(){
			console.log('test   .....'.red);
			var filter = new catalog_filter();
			var crawler = new catalog_crawler(armhome);
			async.series([		
				function(callback){
					console.log('start crawl before   .....'.red);
					crawler.startCrawl(armhome, function(facts){
						filter.filterHome(facts,function(results){
							var key_array = Object.keys(results);
							console.log('complete   filterHome'.green, key_array.length);				
							async.forEach(key_array, function(key,callback){
								console.log(key , results[key]);
								saveResource('res:home:'+key, results[key],function(){});
							},function(err){
								console.log('');
							});				
						});
						callback(null, 'one'); 
					});	
				}		
			],function(err, results){
				console.log('crawler  finished  .....  '.green, results);						
			});	
	}	
	
	
	flushALL(function(){});
	checkDB(function(err,data){
		if(err){		
		}else if(data == 1){
			console.log('semantic data right'.green);
			//testHome();
            setTimeout(function(){
				console.log('now boot the applications  layer'.green);
				bootApps(app,__dirname + '/apps');
				bootRealTimeServices();
			}, 2000);			
	
	}else if(data ==0){
			console.log('semantic data empty '.red);
			updateRes();
						
		}
	})	
}


updateResourceRepository();


// localhost/admin/repository//delete
app.get('/admin/repository/:id/delete',function(req,res,next){
    // res:room:*   res:home:*   res:sensor:*    res:*
	var id = req.params.id;
	if(id == 'room' ){
	    id = 'res:room:*'
	}else if(id == 'home'){
	    id = 'res:home:*';
	}else if(id == 'sensor'){
	    id = 'res:sensor:*';
	}
    flushDB(id,function(){
        res.send(200);	
	});
})

app.get('/admin/repository/update',function(req,res,next){
    updateResourceRepository();
	res.send(200);
})