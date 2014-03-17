var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
var AppModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
	
    var schema = new mongoose.Schema({
	    name: {type:String},
		catalogs:[{url:String,key:String, profile:String, created:Date, updated:Date}],
		created:Date,
		updated:Date
    },{ _id: true, strict: false, read: readOption });   //how to choose a sharding key for day 
	
    schema.index({ "name": 1 }, { unique: true });

    var model;
	var modelName = 'AppModel';
    if( mongoose.modelNames().indexOf(modelName)>=0){
      model = mongoose.model(modelName);
    }else {
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
			this.catalogs = [];
		}
		else
			this.updated = Date.now();  		
		next();
	});
	
    var createApp = function (app, callback) {
		model.create(app,function(err,data){
			if(err) callback(err);
			else {
			    callback(null,data);
			}
		});
    }
	
	var getApps = function(keywords,callback){
	    model.find({}, function(err,data){
		    if(err) callback(err);
			else callback(null,data);
		})
	}
	
	var searchApp = function(name,callback){
	    model.findOne({name:name},function(err,data){
		    if(err) callback(err);
			else callback(null,data);
		})
	}
	
	///////////////////////////////////////////////////////////////////
		
	var updateAppCatalog = function(name, catalog, callback){
		model.update({'name':name,'catalogs.url':catalog.url},{'$set':{'catalogs.$':{'url':catalog.url,'key':catalog.key,'profile':catalog.profile,'updated':new Date()}}},function(err,data){
			if(err) {
				console.log('update application '.red,err);
				callback(err, null);
                
			}else{
			    if(data==1){
				    console.log('find the app and info , update the info'.green+data);
					callback(null,data);
				}else if(data==0){
				    console.log('not find '.red);
					model.update({'name':name},{'$addToSet':{'catalogs':{'url':catalog.url,'key':catalog.key,'profile':catalog.profile,'updated':new Date()}}},function(err1,data1){
					    if(err1){
						    callback(err, null);    
						}else{
						    if(data1==1){
							     console.log('add to set update success'.green);
							    callback(null,data1);
							}else if(data1==0){
							    console.log('second update fail '.red);
							    callback(null,data1);
							}
						}
					})
				}				
			}
		})	
	}
	 
	var removeAppCatalog = function(name, catalog,callback){
		model.update({'name':name},{'$pull':{'catalogs':{url:catalog.url}}},function(err,data){
			if(err){
				console.log('update application '.red,err);
				callback(err, null);
               
			}else {
					callback(null,data);				
			}
		})	
	}
	
		//http://docs.mongodb.org/manual/reference/operator/projection/slice/
	var findAppCatalogsByProfile = function(name,profile,callback){
 		model.findOne({name:name}).select({  'catalogs': { '$elemMatch':  {  'profile': profile }  }}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	
	
	var searchCatalogProfiles = function(name, profile, callback){
		model.aggregate(
		    { $match: {name:name} },  //, sequence:sequence
            { $unwind: "$catalogs" },
			{ $match: { "catalogs.profile" : profile } },
			{ $project: { _id: 0, 'catalogs.key':1,'catalogs.url':1,'catalogs.profile':1 }},  //"msgs" : 1      
			{ $group : { _id : "$_id", catalogs : { $addToSet : "$catalogs" } }}, 
            { $sort: {"catalogs.url " : -1} },
            //{ $skip: 1 },
            // { $limit: 2 },
            function (err, data ) { 
	        if(err) callback(err);
		    else callback(null,data[0].catalogs);
        })	
	}

	
	return {
		getModel:getModel,
		getSchema:getSchema,
		
		
		createApp:createApp,
		getApps:getApps,
		searchApp:searchApp,
		updateAppCatalog:updateAppCatalog,
		removeAppCatalog:removeAppCatalog,
		findAppCatalogsByProfile:findAppCatalogsByProfile,
		searchCatalogProfiles:searchCatalogProfiles
	}
}
module.exports = new AppModel('App', {read:'primary'});   