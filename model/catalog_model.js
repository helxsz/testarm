var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');

var CatalogModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
    var schema = new mongoose.Schema({
	    name: {type:String},
		description: {type:String},
		url:{type:String, required:true, unique: true},	    		
        key: {type:String},
		created:Date,
		updated:Date,
		res:[]
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

	schema.pre('save', function(next) {
		if (this.isNew){
			this.created = Date.now();
		}
		else
			this.updated = Date.now();  		
		next();
	});
	
    var storeCatalog = function (url, key, name, description, callback) {
	    var option = { upsert: true };
		model.update({url:url},{'$set':{key:key, name:name, description:description}},option,function(err,data){
			if(err) callback(err);
			else callback(null,data)		
		});	
    }
		
	var searchCatalog = function(queryObj,callback){
 		model.findOne(queryObj).sort({'updated': 1}).select('url key name description updated').exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

	var getCatalogs = function(callback){
 		model.find({}).sort({'updated': 1}).select('url key name description updated').exec( function(err, data){ 
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

	var updateCatalogResource = function(url, resources, callback){
	    var option = {upsert:true};
        model.update({url:url},{'$set':{'res':[]}},option,function(err,data){
			if(err) callback(err);
			else {
				model.update({url:url},{'$set':{updated:new Date()},'$addToSet':{'res':{'$each': resources}}},option,function(err,data){
					 if(err) callback(err);
					  else callback(null,data);
				});
			} 
		});				
	}
	
	var searchCatalogResource = function(url, resource_url , callback){
 		model.findOne({url:url}).select({  'res': { '$elemMatch':  {  'url': resource_url }  }}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}
	
	var getCatalogResoures = function(url, callback){
 		model.findOne({url:url}).select('res url').exec( function(err, data){ 
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
		getCatalogs:getCatalogs,
		
		updateCatalogResource:updateCatalogResource,
		searchCatalogResource:searchCatalogResource,
		getCatalogResoures:getCatalogResoures
	}
}
module.exports = new CatalogModel('Catalog', {read:'primary'});