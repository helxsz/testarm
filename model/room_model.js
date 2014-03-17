var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
var RoomModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
	
    var schema = new mongoose.Schema({
	    site: {type:String},
        building:  {type:String},
		floor:{type:String},
		room:{type:String,index: true, required: true},
		address:{type:String}
    },{ _id: true, strict: false, read: readOption });   //how to choose a sharding key for day 
	
    schema.index({ "site": 1, "building": 1,'floor':1, 'room':1 }, { unique: true });

    var model;
	var modelName = 'RoomModel';
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
	
	//http://docs.mongodb.org/manual/reference/operator/projection/slice/
	var searchRooms = function(keywords,callback){
 		model.find(keywords).exec( function(err, data){
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

    var pushRoom = function (room, callback) {
		model.create(room,function(err,data){
			if(err) callback(err);
			else {
			    callback(null,data);
			}					 
		});	
    }
	
	var clearRooms = function(keywords,callback){
	    model.remove(keywords, function(err,data){
		    if(err) callback(err);
			else callback(null,data);
		})
	}
	
	return {
		getModel:getModel,
		getSchema:getSchema,
		searchRooms:searchRooms,
		pushRoom:pushRoom,
		clearRooms:clearRooms
	}
}
module.exports = new RoomModel('Room', {read:'primary'});   