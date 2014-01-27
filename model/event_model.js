
var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
var RoomEventsModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
	
    var schema = new mongoose.Schema({
	    room: {type:String, unique:true},
		day: {type: Date, index: true, required: true},	
		url:{type:String, unique:true, required:true},	    		
        events: [ 
		         {
				    sd:Date,
					ed:Date				 
				 } 
		       ]
    },{ _id: false, strict: false, read: readOption, shardKey: { user: 1, sequence: 1 } });
	
    schema.index({ "room": 1, "sequence": 1 }, { unique: true });

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
			model.update({room:room, day:day, url:url},{'$push':{'events':{'$each': events}}},option,function(err,data){
		        if(err) callback(err);
			    else callback(null,data)		
		    });	
		
		}else if(_.isObject(events)){
		
		}
    }
	
	//http://docs.mongodb.org/manual/reference/operator/projection/slice/
	var getRoomEvents = function(room,day, callback){
 		model.findOne({room:room,day:day}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

	var getSelectRoomEvents = function(rooms,day, callback){
 		model.find({room:{ '$in':rooms},day:day}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})	    
	}
	
	return {
		getModel:getModel,
		getSchema:getSchema,
		pushRoomEvents:pushRoomEvents,
		getRoomEvents:getRoomEvents,
		getSelectRoomEvents:getSelectRoomEvents
	}
}
module.exports = RoomEventsModel;        