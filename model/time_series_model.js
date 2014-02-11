// http://blog.mongodb.org/post/65517193370/schema-design-for-time-series-data-in-mongodb
// https://github.com/jupe/mongoose-timeseries/blob/master/lib/schema.js
// http://blog.objectrocket.com/2013/11/12/appboy-scales-horizontally-with-objectrocket-mongodb/
var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');


var TimeSeriesSchema = function(args){

    var schema = new mongoose.Schema({
        day: {type: Date, index: true, required: true},
		//actor: {type: String, ref: 'Sensor',required:true},
				
		latest: {
            timestamp: {type: Date},
            value: {type: Number, default: 0},
            metadata: {type: Mixed},
        },
		
		created: {type: Date, default: Date},
        updated: {type: Date, default: Date},    
		
		stat: {
            i: {type: Number, default: 0},
            avg: {type: Number},
            max: {
                value: {type: Number},
                timestamp: {type: Date}
            },
            min: {
                value: {type: Number},
                timestamp: {type: Date}
            }
        }		
	},{ _id: true,read: 'primaryPreferred' });

		
    args.type = args.type || 'minute';	
	
	
	var init = function(args){
     	var data = {};
        for(var i=0;i<24;i++){
	        if(args.type == 'hour'){
                data[i] = 0;
			    continue;
		    }
		    ///////////////////////		
		    data[i] = {};
            for(var j=0;j<60;j++){		
		        if(args.type == 'minute'){
			        data[i][j] = 0;
			        continue;
			    }
            ////////////////////////////    
			     data[i][j] = {};			
	            for(var k=0;k<60;k++){
	                data[i][j][k] = 0;   
	            }
            }		
        }
        schema.add({data: data });

		args.actor = args.actor || {type: String, ref: 'Sensor',required:true};		
		//schema.add({actor: {type: String, ref: 'Sensor'} });
        schema.add({actor: args.actor });
        schema.index( {'actor':1,'day':1}, { unique: true });			
	}
	
	var init2 = function(args){
	    var data = {};		
	    if(args.type == 'hour'){
            for(var i=0;i<24;i++){
                data[i] = 0;
            } 		
		}else if(args.type == 'minute'){
            for(var i=0;i<24;i++){
                data[i] = {};
                for(var j=0;j<60;j++){
                    data[i][j] = 0;
                }
            } 		
		}else if(args.type == 'second'){
            for(var i=0;i<24;i++){
                data[i] = {};
                for(var j=0;j<60;j++){
                    data[i][j] = {};
	                for(var k=0;k<60;k++){
	                    data[i][j][k] = 0;   
	                }
                }
            } 		
		}
		schema.add({data: data });
		
		args.actor = args.actor || {type: String, ref: 'Sensor',required:true};
		//schema.add({actor: {type: String, ref: 'Sensor'} });
        schema.add({actor: args.actor });
        schema.index( {'actor':1,'day':1}, { unique: true });	
	}

	var roundDay = function(d){
        var t = new Date(d.getFullYear(),
                     d.getMonth(),
                     d.getDate());
        return t;
    }

	
	schema.pre('save', function (next) {
        //winston.debug(this);
        if( this.isNew ) {
            //winston.debug('saving new..');
            this.stat.i = 1; 
            if( this.latest ){
                this.stat.min.value = this.latest.value; 
                this.stat.min.timestamp = this.latest.timestamp; 
                this.stat.max.value = this.latest.value;
                this.stat.max.timestamp = this.latest.timestamp;
                this.stat.avg = this.latest.value;
            }
        }else {
        //winston.debug('updating old..');
        }
        next();
    });	
		
    
    schema.static('push', function (id,value,timestamp, metadata, extraCondition, callback){
	    var day;
		if( _.isDate(timestamp) ) { day = timestamp; }
		else { day = new Date(); timestamp = day; }
				
		day = roundDay(day);
				
		extraCondition = extraCondition || {};
	    var condition = {'day': day, 'actor':id};  //  
        _.extend(condition, extraCondition);
		
		var self = this;
		
		var updates = {};
		//inc
        updates['$inc'] = {'stat.i': 1}
		// set
		var set = {};		
		set['latest.timestamp'] = timestamp;
		set['updated'] = timestamp;
        set['latest.value'] = value;
		if(args.type == 'hour')
		    set['data.'+timestamp.getHours()] = value;
		else if(args.type == 'minute')
		    set['data.'+timestamp.getHours()+'.'+timestamp.getMinutes()] = value;
		else if(args.type == 'second')
		    set['data.'+timestamp.getHours()+'.'+timestamp.getMinutes()+'.'+ timestamp.getSeconds()] = value;		
		updates['$set'] = set;
		
		//winston.debug('push updates '+ JSON.stringify( updates )  );
		
	    this.update( condition, updates, function(error, doc){  
            if( error) {
			    winston.debug('db: save  error   '.red + error); 
                if(callback)  callback(error);
            } else if( doc ) {
                //winston.debug('db: save   '.green+ doc);
                if(callback)callback(null, doc);        
            } else {
                winston.debug('db: Create new   '+day+ "   "+id);
                var doc = new self( { day: day, 'actor':id } );
                doc.set( updates );
                doc.save( callback );       
            }
	    })
    })
	
	
	schema.static('findData', function (id,from,to, callback) {
        //if( Object.keys(request.condition).length>0)  condition['$and'].push(request.condition);
        winston.debug('find data condition'.green+ condition + id + from + to);
        if( !to ) to = new Date();
		var condition = {};
		var select = '';
		
		//console.log('-----------------------',from.getFullYear(), from.getMonth(), from.getDay(),to.getFullYear(), to.getMonth(), to.getDay());
		//console.log('-----------------------',new Date(from.getFullYear(), from.getMonth(), from.getDay()));
		
		if( (from.getFullYear() == to.getFullYear()) && (from.getMonth() == to.getMonth()) && (from.getDate() == to.getDate() ) ){
		    winston.debug('find data condition'.green+ condition + id + from + to); 
            condition = {'day':{'$gte': new Date(from.getFullYear(), from.getMonth(), from.getDate() ),'$lte': to},'actor':id};
			
			if(from.getHours() == to.getHours()){
			    if(from.getMinutes() == to.getMinutes()){
				    select+='data.'+from.getHours()+"."+from.getMinutes()+" "; 
				}else{
				    for(var i =from.getMinutes();i<to.getMinutes();i++){
				        select+='data.'+from.getHours()+"."+i+" ";
				    }				
				}
			}else{
			    for(var i =from.getHours();i<to.getHours();i++){
				    select+='data.'+i+" ";
				}			
			}            			                           
		}else {
			select = 'data stat.i';
            condition = {'day':{'$gte': from,'$lte': to},'actor':id};			
		}
        winston.debug('find the select condition  ----'+select+"   "+JSON.stringify(condition) );
        this.find(condition).sort({'day': 1}).select('data day').exec( function(error, docs){
            if( error ) { callback(error);}
            else {
                /*
                var data = [], i;
                docs.forEach( function(doc){
                doc.getData(request.interval, request.format).forEach( function(row){
                    data.push( row );
                 });
				*/
				callback(null, docs);
            };                         
        });		
    });
	
	init2(args);
	return schema;
}


var TimeSeriesModel = function(collection, options){

    var model,schema;
    schema = new TimeSeriesSchema(options);
	var modelName = 'TimeSeriesModel';
	
    if( mongoose.modelNames().indexOf(modelName)>=0){
      model = mongoose.model(modelName);
    }
    else {
      model = mongoose.model(collection, schema);
    }

    /**
     * Push new value to collection
    */
    var push = function push(id, value, timestamp,cb){
        model.push(id, value,timestamp, {}, {} , cb);
    }
    /**
     *  Find data of given period
    */
    var findData = function (id,from,to, cb) {
        model.findData(id,from,to, cb);
    }
    /** 
    * Find Max value of given period
    */
    var findMax = function( options , cb){
        model.findMax(options, cb);
    }
    /** 
    * Find Min value of given period
    */
    var findMin = function( options , cb){
        model.findMin(options, cb);
    }
	
	var getModel = function(){
        return model;
    }
  
    var getSchema = function(){
        return schema;
    }

     /* Return model api */
    return {
        getModel: getModel,
        getSchema: getSchema,
        push: push,
        findData: findData,
        findMax: findMax,
        findMin: findMin
    }
	
}
module.exports = TimeSeriesModel;   