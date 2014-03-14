var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
 /*
	    'name': 'enlight',
		'description': 'Streetlight data',
		'url': 'https://geras.1248.io/cat/enlight',
		'key':'1bfc8d081f5b1eed8359a7517fdb054a',
        'pattern':'enlight',
		'host':'geras.1248.io',
        'cat':'enlight',
        'RT':'mqtt'	
*/ 
var CatalogModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
    var schema = new mongoose.Schema({
	    name: {type:String},
		description: {type:String},
		url:{type:String, required:true, unique: true},	    		
        key: {type:String}
    },{ _id: false, strict: false, read: readOption, shardKey: { name: 1, day: 1 } });   //how to choose a sharding key for day 
	
    schema.index({ "url": 1}, { unique: true });

    var model;
	var modelName = 'CatalogModel';
    if( mongoose.modelNames().indexOf(modelName)>=0){
      model = mongoose.model(modelName);
    }
    else {
      model = mongoose.model(collection, schema);
    }

	var getModel = function(){
        return model;
    }
  
    var getSchema = function(){
        return schema;
    }	
	                     
    var storeCatalog = function (url, key, name, description, callback) {
	    var option = { upsert: true };
		model.update({url:url},{'$set':{key:key, name:name, description:description}},option,function(err,data){
			if(err) callback(err);
			else callback(null,data)		
		});	
    }
	
	var searchCatalog = function(queryObj,callback){
 		model.findOne(queryObj).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

	var getCatalogs = function(callback){
 		model.find({}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	    
	}
	
	var removeCatalog = function(queryObj,callback){
 		model.remove(queryObj).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	
	}
	
	return {
		getModel:getModel,
		getSchema:getSchema,
		storeCatalog:storeCatalog,
		searchCatalog:searchCatalog,
		removeCatalog:removeCatalog,
		getCatalogs:getCatalogs
	}
}
module.exports = new CatalogModel('Catalog', {read:'primary'});