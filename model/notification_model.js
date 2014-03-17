var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
// new NotificationModel('Notification', {read:primary});
var NotificationModel = function(collection, options){

    var readOption = options.read || 'primaryPreferred';
	
	var actorSchema = new mongoose.Schema({
        id     : {type:String}
       , url   : {type:String}
	   , type  : {type:String}
	   , name  : {type:String}
       , img   : {type:String}
    });
	
	var objectSchema = new mongoose.Schema({
        id     : {type:String}
       , url   : {type:String}
	   , type  : {type:String}
	   , msg   : {type:String}
    });	
		
    var schema = new mongoose.Schema({
	    /**/
	    user: {type:String, required:true, unique:true},
	    sequence:{type:Number, default:0},
        updated: {type:Date, default:new Date()},
		i:{type:Number, default:0},
				
        notis: [ 
		         {
				    time:Date,
					read:Boolean,
                    verb: String,
					//actor: actorSchema ,
                    //object: objectSchema
					actor:{id:String, url:String, type:String, name:String, img:String},
					object:{id:String, url :String, type:String, msg:String}                    					
				 } 
		       ]
    },{ _id: false, strict: false, read: readOption, shardKey: { user: 1, sequence: 1 } });

	
	
	
    schema.index({ "user": 1, "sequence": 1 }, { unique: true });

    var model;
	var modelName = 'NotificationModel';
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
	                     
    //{ actor:{id,url,type:'person/device/course/code',name,image}, verb,object:{id,url,type,msg} }    comment, code,
    var pushNotification = function (username,sequence, noti, callback) {
	    var option = { upsert: true };
				
		if(_.isArray(noti)){  // http://docs.mongodb.org/manual/reference/operator/update/sort/  
		    var updates = [];
		    for(var i=0;i<noti.length;i++){
			    var update={
			                time:noti[i].date|| new Date(),
						    read:false,
			                actor:{id:noti[i].actor.id, url:noti[i].actor.url, type:noti[i].actor.type, name:noti[i].actor.name, img:noti[i].actor.img},  
						    verb: noti[i].verb,
						    object:{id:noti[i].object.id, url : noti[i].object.url, type:noti[i].object.type, msg:noti[i].object.msg}
					    };
			    updates.push(update);
			}
			model.update({user:username, sequence:sequence},{'$push':{'notis':{'$each': updates, '$slice':-50}},"$set":{'updated':new Date()}},option,function(err,data){
		        if(err) callback(err);
			    else callback(null,data)		
		    });	
		
		}else if(_.isObject(noti)){
		    console.log('notification --------- '.green,noti.actor.id,noti.actor.url,noti.actor.type,noti.actor.name,noti.actor.img,noti.verb, 
            'object'.green, noti.object.id,noti.object.url,noti.object.type,noti.object.msg);
		
		    var update={
			           "$push":
					    {'notis':{   
			                      time:  noti.date  || new Date(),
								  read:false,			                        
								  verb: noti.verb,
								  actor:{'id':noti.actor.id, 'url':noti.actor.url, 'type':noti.actor.type, 'name':noti.actor.name, 'img':noti.actor.img},
								  object:{id:noti.object.id, url : noti.object.url, type:noti.object.type, msg:noti.object.msg}
								  
							    }
					    }
		                ,"$set":{'updated':new Date()}
					};
					
			model.update({user:username, sequence:sequence},update,option,function(err,data){
		        if(err) callback(err);
			    else callback(null,data)		
		    });		
		}
    }
	
	var updateUnreadNotification = function(username,sequence, notiID, callback){
	    var option = { upsert: false, new:false };
	    model.update({user:username,sequence:sequence,'notis._id':notiID},{'$set':{'notis.$.read':true}} ,option,function(err,data){
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	

	//http://docs.mongodb.org/manual/reference/operator/projection/slice/
	var getUnreadNotifications = function(username,sequence, option, callback){
	    option = option ||  {'skip':-10,'limit':10};
		// model.findOne({user:username,sequence:sequence,'notis.read':false})  don't work
		//console.log('option  ',option.skip, option.limit );
		// don't work
	    //model.findOne({user:username,sequence:sequence}).select({  'notis': { '$elemMatch':  {  'read': false }  }}).slice('notis',[ option.skip, option.limit ]).exec( function(err, data){  
 		model.findOne({user:username,sequence:sequence}).select({  'notis': { '$elemMatch':  {  'read': false }  }}).exec( function(err, data){ 
		    if(err) callback(err);
		    else callback(null,data);
		})
	}	
	
	var getNotifications = function(username,sequence, option, callback){
	    option = option ||  {'skip':-10,'limit':10};
		//  [ option.skip, option.limit ]		
	    model.findOne({user:username,sequence:sequence}).slice('notis', [ option.skip, option.limit ]).exec( function(err, data){ 
		    if(err) callback(err);
		    else {
			    
			    callback(null,data);
			}	
		})
	}	
	
	/*
	var deleteNotifications = function(username, sequence, msgID, callback){
	    var option = { upsert: true, new:true };
        model.update({user:username, sequence:sequence},{"$pull":{'msgs':{'_id':msgID}}},option,function(err,data){
		    if(err) callback(err);
			else callback(null,data)		
		});	
	}
	*/	
	return {
	    pushNotification:pushNotification,
		updateUnreadNotification:updateUnreadNotification,
		getUnreadNotifications:getUnreadNotifications,
        getNotifications:getNotifications,
		getModel:getModel,
		getSchema:getSchema
	}
}
module.exports = NotificationModel;     