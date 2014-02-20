
var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
var RoomEventsModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
	
    var schema = new mongoose.Schema({
	    name: {type:String},
		day: {type: Date, index: true, required: true},	
		url:{type:String, required:true},	    		
        events:  [    { startDate:Date,endDate:Date,organizer:String	} ]
    },{ _id: false, strict: false, read: readOption, shardKey: { name: 1, day: 1 } });   //how to choose a sharding key for day 
	
    schema.index({ "name": 1, "day": 1 }, { unique: true });

    var model;
	var modelName = 'RoomEventsModel';
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
	                     
    var pushRoomEvents = function (room, url, day,  events, callback) {
	    var option = { upsert: true };
				
		if(_.isArray(events)){  // http://docs.mongodb.org/manual/reference/operator/update/sort/  
			model.update({name:room, day:day, url:url},{'$addToSet':{'events':{'$each': events}}},option,function(err,data){
		        if(err) callback(err);
			    else callback(null,data)		
		    });	
		
		}else if(_.isObject(events)){
		
		}
    }
	
	//http://docs.mongodb.org/manual/reference/operator/projection/slice/
	var getRoomEvents = function(room,day, callback){
 		model.findOne({name:room,day:day}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

	var getMultiRoomEvents = function(rooms,day, callback){
 		model.find({name:{ '$in':rooms},day:day}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	    
	}
	
	return {
		getModel:getModel,
		getSchema:getSchema,
		pushRoomEvents:pushRoomEvents,
		getRoomEvents:getRoomEvents,
		getMultiRoomEvents:getMultiRoomEvents
	}
}
module.exports = new RoomEventsModel('RoomEvents', {read:'primary'});        