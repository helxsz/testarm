var _ = require("underscore"), 
   mongoose = require('mongoose'),
   ObjectId = mongoose.Schema.ObjectId,
   Schema = mongoose.Schema,
   Mixed = mongoose.Schema.Types.Mixed,
   winston = require('../utils/logging.js');
   
var YearAnalyticsSchema = function(args){

    var schema = new mongoose.Schema({
        year: {type: Number, index: true, required: true},
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
	},{ _id: true,read: 'primaryPreferred', strict:false });
		
	var init2 = function(args){
	    var data = {};		
		for(var i=0;i<12;i++){
			data[i] = {};
			for(var j=0;j<31;j++){
				data[i][j] = {};
			}
		} 		
		
		schema.add({data: data });
		
		args.actor = args.actor || {type: String,required:true};
		//schema.add({actor: {type: String, ref: 'Sensor'} });
        schema.add({actor: args.actor });
        schema.index( {'actor':1,'year':1}, { unique: true });	//
	}

	var roundYear = function(d){
        return d.getFullYear();
    }

	
	schema.pre('save', function (next) {
        //winston.debug(this);
        if( this.isNew ) {
            //winston.debug('saving new..');
            this.stat.i = 1; 
            if( this.latest ){
                //this.stat.min.value = this.latest.value; 
                this.stat.min.timestamp = this.latest.timestamp; 
                //this.stat.max.value = this.latest.value;
                this.stat.max.timestamp = this.latest.timestamp;
                //this.stat.avg = this.latest.value;
            }
        }else {
        //winston.debug('updating old..');
        }
        next();
    });	
		
    // value == {energy: 3434, rank:3}
    schema.static('push', function (id,value,timestamp, metadata, extraCondition, callback){
	    var year;
		if( _.isDate(timestamp) ) { }
		else { timestamp = new Date();  }
				
		year = roundYear(timestamp);
				
		extraCondition = extraCondition || {};
	    var condition = {'year': year, 'actor':id};  //  
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
		
		set['data.'+timestamp.getMonth()+'.'+timestamp.getDate()] = value;
		
		updates['$set'] = set;	
		console.log('push analytics updates '.green+ JSON.stringify( updates ) , year );		
	    this.update( condition, updates, function(error, doc){  
            if( error) {
			    winston.debug('db: save  error   '.red + error); 
                if(callback)  callback(error);
            } else if( doc ) {
                //winston.debug('db: save   '.green+ doc);
                if(callback)callback(null, doc);        
            } else {
                console.log('db: Create new  : year : '.green+year+ "  id: "+id, "update:",updates);
                var doc = new self( { year: year, 'actor':id } );
                //doc.set( updates );
                doc.save( callback );       
            }
	    })
    })
	
	
	schema.static('findData', function (id,date, isMonth, callback) {
        //if( Object.keys(request.condition).length>0)  condition['$and'].push(request.condition);
        //console.log('find data condition'.green + id + date);
        if( !date ) date = new Date();
		var condition = {};
		var select = '';
		if(!isMonth)
		select='data.'+date.getMonth()+"."+date.getDate()+"";
		else
		select = 'data.'+date.getMonth()+"";
		select +=' actor';
        condition = {'year':date.getFullYear(),'actor':{'$in':id}};			
		
        console.log('find the select condition  ----'.green+select+"   " ); // +JSON.stringify(condition)
        this.find(condition).sort({'year': 1}).select(select).exec( function(error, docs){
            if( error ) { callback(error);}
            else {
				callback(null, docs);
            };                         
        });		
    });
	
	init2(args);
	return schema;
}


var YearAnalyticsModel = function(collection, options){

    var model,schema;
    schema = new YearAnalyticsSchema(options);
	var modelName = 'YearAnalyticsModel';	
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
module.exports = YearAnalyticsModel;