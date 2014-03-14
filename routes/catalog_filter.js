var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
	 path = require('path'),
	request = require('request'),
	redis = require('redis');
 

var catalog_filter = function(){

    /////////////////////////  TSB ///////////////////////////////
	var CONTENT_TYPE = "urn:X-tsbiot:rels:isContentType";
	var IS_CATALOG = 'application/vnd.tsbiot.catalogue+json';
	var IS_SENML = 'application/senml+json';
	var IS_APPLICATIONTYPE_ROOM = 'application/json; profile=http://schema.org/Place/Room';

	var SUPPORTS_QUERY = 'urn:X-tsbiot:rels:supports:query';
	var SUPPORTS_MQTT = 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1';
	var IS_SENSOR_TYPE = 'urn:X-tsbiot:rels:isSensorType'; 
	var IS_SENSOR_TYPE_SHORT = 'isSensorType';

	//////////////////////////  ONTOLOGY ////////////////////////////
	var HAS_LOCATION= 'http://www.loa-cnr.it/ontologies/DUL.owl#hasLocation';
	var SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs';
	var GEO_LAT = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
	var GEO_LNG = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';

	var SCHEMA_EVENT = 'http://schema.org/event';
	var SCHEMA_ADDRESS = 'http://schema.org/addressLocality';
	var SCHEMA_SITE = "http://schema.org/streetAddress/site";
    var SCHEMA_BUILDING = "http://schema.org/streetAddress/building";
    var SCHEMA_FLOOR = "urn:X-tsbiot:rels:building:floor";	
	///////////////////////// ONTOLOGY WITHOUT CONTEXT ////////////////////////////
    var HAS_LOCATION_SHORT = 'hasLocation';
	var SAME_AS_SHORT = 'sameAs';
	var GEO_LAT_SHORT = 'lat';
	var GEO_LNG_SHORT = 'long';

	var SCHEMA_EVENT_SHORT = 'event';
	var SCHEMA_ADDRESS_SHORT = 'addressLocality';	
	var SCHEMA_SITE_SHORT = "site";
    var SCHEMA_BUILDING_SHORT = "building";
    var SCHEMA_FLOOR_SHORT = "floor";		
	function filterRoom(facts, _callback) {
		if (facts.length) {
		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });
			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );	

			// need to change ....................................................................................................................................
			/*
			var buildingService;
			serviceCatalog.findByName('armbuilding',function(err,data){
				if(err || !data){
					console.log('armmeeting catalog can not be found ',err);
					callback();
				}else {
					//console.log('find the service catalog '.green,data);
					buildingService = data;	
					}    
			});
            */			
                /////////////////////////////////////////
				var results = {};	
				var category = {
					sensor:{},
					people:[],
					location:[],
					profile:{}
				};				
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
							}else if( index == SCHEMA_SITE ){
								hash[SCHEMA_SITE_SHORT] = hash[SCHEMA_SITE];
							}else if( index == SCHEMA_BUILDING ){
								hash[SCHEMA_BUILDING_SHORT] = hash[SCHEMA_BUILDING];
							}else if( index == SCHEMA_FLOOR ){
								hash[SCHEMA_FLOOR_SHORT] = hash[SCHEMA_FLOOR];
							}else if( index == SAME_AS ){
								hash[SAME_AS_SHORT] = hash[SAME_AS];
							}					
							delete  hash[index] ;						
						}
						results[key] = hash;
						callback();						
						////////////////////////////////////////////////////
						/*
						buildingService.fetchResourceDetail(key,function(err,obj){
							if(err){
								console.log('error ',err);
							}else{               
								var address = JSON.stringify(obj.address),building = obj.building, floor = obj.floor;  
								if(address) hash['address'] = address;
								if(building) hash['building'] = building; 
								if(floor) hash['floor'] = floor;
							}							
						})
                         */						
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
						category.profile['room'] = 1;
						if(_callback){
							_callback(results);
						}					
					}
					delete facts;
				});
				//////////////////////////////////////////	


		}
	}	
	
	function filterSensors(facts, _callback){
		if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};		
            var category = {
			    sensor:{},
				people:[],
				location:[]
			};			
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
					var arr = key.split('/'), attribute = arr[arr.length-1].split('?')[0], parent_key = key.substring(0, key.indexOf(attribute)-1);                  
					if(results[parent_key] ==null)  results[parent_key] = {};					
					//results[parent_key][attribute] = key;				
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == GEO_LAT){
							results[parent_key][GEO_LAT_SHORT] = hash[GEO_LAT];
						}else if( index ==  GEO_LNG ){
							results[parent_key][GEO_LNG_SHORT] = hash[GEO_LNG];
						}else if( index == SAME_AS ){
							results[parent_key][SAME_AS_SHORT] = hash[SAME_AS];
						}else if( index == IS_SENSOR_TYPE){
						    results[parent_key][IS_SENSOR_TYPE_SHORT] = hash[IS_SENSOR_TYPE];
							category.sensor[hash[IS_SENSOR_TYPE]] = 1;
							
							results[parent_key][hash[IS_SENSOR_TYPE]] = key.split('?')[0];	
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
					if(_callback){
					    _callback(results,category);
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
					var arr = key.split('/'), attribute = arr[arr.length-1].split('?')[0], parent_key = key.substring(0, key.indexOf(attribute)-1);
					//console.log( attribute , parent_key    );
					if(results[parent_key] ==null)  results[parent_key] = {};				
		            for(var index in hash) {
			            //console.log(' '.green, index, hash[index]);					
						if( index == "urn:X-senml:u"){
							//results[parent_key][attribute+":unit"] = hash["urn:X-senml:u"];;
						}else if(index == SUPPORTS_QUERY){
							results[parent_key][attribute] = key.split('?')[0];
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
	
	
	function filterStandard(facts, _callback){
        if (facts.length) {		
		    console.log('facts length  '.green,facts.length);			
			var groups = _.groupBy(facts, function(fact){ return fact.subject; });			
			var array = Object.keys(groups);
			console.log('group length '.green, array.length );
            var results = {};		
            var category = {
			    types:{}
			};			
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
					var arr = key.split('/'), attribute = arr[arr.length-1].split('?')[0], parent_key = key.substring(0, key.indexOf(attribute)-1);                  
					if(results[parent_key] ==null)  results[parent_key] = {};					
					//results[parent_key][attribute] = key;							
					if(attribute == 'online')
					results[parent_key][attribute] = key.split('?')[0];					
		            for(var index in hash) {
						//console.log(' .......................................  '.green, index, hash[index]);					
						if( index == GEO_LAT){
							results[parent_key][GEO_LAT_SHORT] = hash[GEO_LAT];
						}else if( index ==  GEO_LNG ){
							results[parent_key][GEO_LNG_SHORT] = hash[GEO_LNG];
						}else if( index == SAME_AS ){
							results[parent_key][SAME_AS_SHORT] = hash[SAME_AS];
						}else if( index == IS_SENSOR_TYPE){
						    //results[parent_key][IS_SENSOR_TYPE_SHORT] = hash[IS_SENSOR_TYPE];
							category.types[hash[IS_SENSOR_TYPE]] = 1;
							//console.log('---------------------------------------------- '.red,hash[IS_SENSOR_TYPE],key);
							results[parent_key][hash[IS_SENSOR_TYPE]] = key.split('?')[0];
						}
						delete hash[index];
					}
                    category.profile= 'sensor' ;					
				}else if(hash[CONTENT_TYPE] == IS_CATALOG){
				    //console.log('not wanted, because it is catalog'.red, key);			
				}else if(hash[CONTENT_TYPE] == IS_APPLICATIONTYPE_ROOM){
					//console.log( hash[SCHEMA_EVENT], hash[SCHEMA_ADDRESS] );
					results[key] = {};
					for(var index in hash) {
						//console.log('-------------------------- '.green, index, hash[index]);
						if( index == SCHEMA_EVENT){
							results[key][SCHEMA_EVENT_SHORT] = hash[SCHEMA_EVENT];
						}else if( index == SCHEMA_ADDRESS ){
							results[key][SCHEMA_ADDRESS_SHORT] = hash[SCHEMA_ADDRESS];
						}else if( index == SCHEMA_SITE ){
							results[key][SCHEMA_SITE_SHORT] = hash[SCHEMA_SITE];
						}else if( index == SCHEMA_BUILDING ){
							results[key][SCHEMA_BUILDING_SHORT] = hash[SCHEMA_BUILDING];
						}else if( index == SCHEMA_FLOOR ){
							results[key][SCHEMA_FLOOR_SHORT] = hash[SCHEMA_FLOOR];
						}else if( index == SAME_AS ){
							results[key][SAME_AS_SHORT] = hash[SAME_AS];
						}					
						delete  hash[index] ;						
					}
                    category.profile = 'room';  						
				}
                callback();				
			 }, function(err) {      
				if(err){
					console.log(err);
				}
				else{
					if(_callback){
					    _callback(results,category);
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
        filterHome:filterHome,

        filterStandard:filterStandard		
	}
}

module.exports = catalog_filter;