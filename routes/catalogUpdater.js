var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
	 path = require('path'),
	request = require('request');
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js'),
	io = require('./websocket_api.js'),
	serviceCatalog = require('./serviceCatalog.js'),ServiceBuilder = require('./serviceBuilder.js'),serviceBus = require('./serviceBusService.js'),
    catalogModel = require('../model/catalog_model.js'),
	catalog_crawler = require('./catalog_crawler.js'),
	catalogDB = require('./catalog_db.js'),
	catalogFactsModel = require('../model/catalog_fact_model.js'),
	catalogFilter = require('./catalog_filter.js');	

/************************************************************************
	request to 1248
https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGVmYXVsdGRvbWFpbnx0c2JvcGVuaW90fGd4OjJiMDhjYzRlZWI1OTk2NGI
http://imove-project.org/cat i-Move Project
http://strauss.ccr.bris.ac.uk/catalogue/services/api/root IoT-Bay Project	
https://alertmeadaptor.appspot.com
************************************************************************/
	
function CatalogUpdater(){


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

	
	var master_catalog = 'http://data.openiot.org/cat';
	var master_key = 'rQw5eBKMOoNfeDg1h6vQ1fuJFlkMB9sY5WBVHojr5wb0Ndv99LpNeOvqv6UVsud6I4go7SHCYhi3FKsm5aFYxA';
	var filter = new catalogFilter();
	var crawler = new catalog_crawler(armbuilding);
	
	function crawlRoot(_callback){
        request.get({  
                url: master_catalog,	
                headers: {
		            'Authorization': 'Basic ' + new Buffer(master_key+":").toString('base64')
		            ,'content-type':'application/json'		
                },
	            rejectUnauthorized: false,
                requestCert: true,
                agent: false
            }, function(error, response, body) {
	            if(error){ 
		            winston.error("error  ".red, error);
			        callback(error,null);
		        }else{  	
                    var obj ;				
                    try{	
                        //console.log('getResourceList'+body);					
		                obj = JSON.parse(body);
                    }catch(e){
					    return callback(e,null);
					}					
			        _callback(null,obj);
		        }
        });
	}
	
	function crawlSubCatalogs(catalogs,_callback){
			    //console.log('success get catalogs '.green, catalogs);
				var catalog_profiles = [];
				async.eachSeries(catalogs,function(catalog, callback){
				    //console.log('get one catalog '.green, catalog.url,catalog.key);	
					//   https://geras.1248.io/cat/armhome  catalog.url=='https://geras.1248.io/cat/armmeeting' ||    ||  catalog.url == 'https://protected-sands-2667.herokuapp.com/cat-2'
					if(  catalog.url == 'https://protected-sands-2667.herokuapp.com/cat-1' ){
                        var crawler = new catalog_crawler(catalog);					
						crawler.startCrawl(catalog, function(facts){
							catalogFactsModel.storeCatalogFacts( catalog.url,facts,function(err,data){
								if(err) console.log('catalog  facts  store error '.red,err);
								else {
								    console.log('catalog  facts  store  data  '.green,catalog.url, data);
                                }
							});
							/////////////////////////////////////////////////////////
							filter.filterStandard(facts,function(results,category){
								var key_array = Object.keys(results);								
								console.log('complete   filterStandard'.green, key_array.length, category);
								catalog_profiles.push({url:catalog.url, profile:category.profile, types : category.types});
								callback();	
							}); 								
								
						});  
                    }else {
					    callback();
					}
					
				},function(err,data){
				    _callback(err,catalog_profiles);    
				})
	}

	function crawlSingleCatalog(catalog,_callback){
	    //console.log('success get catalogs '.green, catalogs);
		var catalog_profiles = [];					
		var crawler = new catalog_crawler(catalog);					
		crawler.startCrawl(catalog, function(facts){
			catalogFactsModel.storeCatalogFacts( catalog.url,facts,function(err,data){
				if(err) console.log('catalog  facts  store error '.red,err);
				else {
					console.log('catalog  facts  store  data  '.green,catalog.url, data);
				}
				/////////////////////////////////////////////////////////
				filter.filterStandard(facts,function(results,category){
					var key_array = Object.keys(results);								
					console.log('complete   filterStandard'.green, key_array.length, category);
                    var list = [];					
					async.forEach(key_array, function(key,callback){
						//console.log('---------------------------',key , results[key]);
						if(!_.isEmpty(results[key])){
						    results[key].url = key;
						    list.push(results[key]);
						}
						callback();
					},function(err){
					    catalogModel.updateCatalogResource(catalog.url,list,function(err,data){
						    if(err) console.log('failed to update catalog resource '.red,err);
							else if(data && data==1) console.log('update the resource success'.green);
							else if(data && data==0) console.log('failed to update catalog resource'.red);
							
						    catalog_profiles.push({url:catalog.url,key:catalog.key, profile:category.profile, types : category.types});	
					        _callback(err,catalog_profiles);
						})					
					});														
				}); 								
			});	
		});
	}

	
	function updateMeetingRoomAndLocation( _callback){
		async.series([
			// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Farmhome&traverseKey=924a7d4dbfab38c964f5545fd6186559&Submit=Browse						
			function(callback){
				crawler.startCrawl(armbuilding, function(facts){
				    catalogFactsModel.storeCatalogFacts( armbuilding.url,facts,function(err,data){
					    if(err) console.log('catalog armbuilding facts  store error '.red,err);
						else console.log('catalog armbuilding facts  store  data  '.green, data);
					});				
				    
					filter.filterRoom(facts,function(results){
						var key_array = Object.keys(results);
						console.log('complete   filterRoom'.green, key_array.length);				
						async.forEach(key_array, 
						  function(key,callback){
							console.log(key , results[key]);						
							catalogDB.saveResource('res:room:'+key, results[key],function(){});
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
				    catalogFactsModel.storeCatalogFacts( armmeeting.url,facts,function(err,data){
					    if(err) console.log('catalog armmeeting facts  store error '.red,err);
						else console.log('catalog armmeeting facts  store  data  '.green, data);
					});
					
					filter.filterSensors(facts,function(results, category){
						var key_array = Object.keys(results);
						console.log('complete   filterSensor'.green, key_array.length, category.sensors);				
						async.forEach(key_array, function(key,callback){
							console.log('key:',key , 'value:',results[key]);
							catalogDB.saveResource('res:sensor:'+key, results[key],function(){});
						},function(err){
							console.log('');
						});				
					});
					
					callback(null, 'one'); 
				});		
			}
		],function(err, results){
			console.log('crawler  finished  .....  '.green, results);
			integrateMeetingRoom();
            if(_callback) _callback();			
		});	
	}
	
	function updateHomeCatalog(){
			console.log('updateHomeCatalog   .....'.red);
			var filter = new catalogFilter();
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
								catalogDB.saveResource('res:home:'+key, results[key],function(){});
							},function(err){
								console.log('');
							});				
						});
						callback(null, 'one'); 
					});	
				}		
			],function(err, results){
				console.log('updateHomeCatalog  finished  .....  '.green, results);						
			});	
	}

	/*
	function updateEnlightCatalog(){
		console.log('updateEnlightCatalog   .....'.red);
		// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Fenlight&traverseKey=1bfc8d081f5b1eed8359a7517fdb054a&Submit=Browse
        var filter = new catalogFilter();
		var crawler = new catalog_crawler(enlight);
		crawler.startCrawl(enlight, function(facts){
			filter.filterEnlight(facts,function(results){
				var key_array = Object.keys(results);
				console.log('complete   filterEnlight'.green, key_array.length);				
				async.forEach(key_array, function(key,callback){
					console.log(key ); // , results[key]
					//catalogDB.saveResource('res:light:'+key, results[key],function(){});
				},function(err){
					console.log('');
				});				
			});
			callback(null, 'one'); 
		});						
	}	

	function updateIntellsenseCatalog(){			
		// https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A//5.79.20.223%3A3000/cat/ARM6&traverseKey=d01fe91e8e249618d6c26d255f2a9d42			
		var crawler = new catalog_crawler(intellisense);
		crawler.startCrawl(intellisense, function(facts){
			filter.filterIntellisense(facts,function(results){
				var key_array = Object.keys(results);
				console.log('complete   filterIntellisense'.green, key_array.length);				
				async.forEach(key_array, function(key,callback){
					console.log('hvac:'.green, key , results[key]);
					//catalogDB.saveResource('res:hvac:'+key, results[key],function(){});
				},function(err){
					console.log('');
				});				
			});
			callback(null, 'one'); 
		});		       
	}
	*/	
	return {
        //updateIntellsenseCatalog:updateIntellsenseCatalog,
        //updateEnlightCatalog:updateEnlightCatalog,
		
        updateHomeCatalog:updateHomeCatalog,
		updateMeetingRoomAndLocation:updateMeetingRoomAndLocation,
		
		
		crawlRoot:crawlRoot,
		crawlSubCatalogs:crawlSubCatalogs,
		crawlSingleCatalog:crawlSingleCatalog
	}	
}


module.exports = new CatalogUpdater();