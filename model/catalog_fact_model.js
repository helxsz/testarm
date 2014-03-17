var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
//http://docs.mongodb.org/manual/tutorial/expire-data/
//http://stackoverflow.com/questions/14597241/setting-expiry-time-for-a-collection-in-mongodb-using-mongoose
var CatalogFactModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
    var schema = new mongoose.Schema({
		url:{type:String, required:true, unique: true},
        createdAt:{ type: Date, expires: 3600*10 },		
        facts: [],
		filter:[]
    },{ _id: false, strict: false, read: readOption, shardKey: { url: 1 } });   //how to choose a sharding key for day 
	
    schema.index({ "url": 1}, { unique: true });

    var model;
	var modelName = 'CatalogFactModel';
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
	                     
    var storeCatalogFacts = function (url, facts, callback) {
	    var option = { upsert: true };		
		model.update({url:url},{'$set':{'facts':[],'filter':[]}},option,function(err,data){
			if(err) callback(err);
			else {
				model.update({url:url},{'$set':{'createdAt':new Date()},'$addToSet':{'facts':{'$each': facts}}},option,function(err,data){
					 if(err) callback(err);
					  else callback(null,data)		
				});
			}					 
		});		
    }

	var getCatalogFacts = function(url,callback){
 		model.findOne({url:url}).select('facts').exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	    
	}
	
	var removeCatalogFacts = function(url,callback){
 		model.remove({url:url}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	
	}
	
	return {
		getModel:getModel,
		getSchema:getSchema,
		storeCatalogFacts:storeCatalogFacts,
		getCatalogFacts:getCatalogFacts,
		removeCatalogFacts:removeCatalogFacts,
	}
}
module.exports = new CatalogFactModel('CatalogFacts', {read:'primary'});   