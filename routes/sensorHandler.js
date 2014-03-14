var util = require('util'),
	path = require('path'),
    fs = require('fs'),
    async = require('async'),
    color = require('colors'),
    crypto = require('crypto'),
	 _ = require('underscore');
 	 
var winston = require('../utils/logging.js'),
	TimeSeriesModel = require('../model/time_series_model.js');		

var timeSeriesModel = new TimeSeriesModel('SensorTimeSeries', {read:'primary', type:'second',actor:{type: String, ref: 'Sensor',required:true}});	
	
var getSensorData = function(id, from, to, callback){
    var now = new Date();
    var MS_PER_MINUTE = 60000;
    timeSeriesModel.findData(id,from,to,function(err,doc){
        if(err)  {
		     console.error(err);
			 callback(err);
		}	 
        else if(doc){
	        //console.log( 'find sensor data  '.green + "  "+data.length +"  "+JSON.stringify( data )); //
            if(doc.length==1){
		        doc = doc[0];
			    console.log('length == 1');
			    //console.log(doc.data);
			    var data = doc.data;
			
			    var hourkey = Object.keys(data), minutekey , secondkey;
			/*
		    for(var i=0;i<10;i++){
			    //console.log('--------  ',i,data[i]);
				minutekey = Object.keys(data[i]);				
				//console.log('minutekey  key   ',i,minutekey.length);
		        for(var j=0;j<minutekey.length-1;j++){
				    //if( !_.isNumber(minutekey[j]) )  continue;
				    secondkey  = Object.keys(data[i][j]);
					console.log('second  key   ',i,j,secondkey.length+"-------------------------------");
				    for(var k=0;k<secondkey.length-1;k++){
					    //if( !_.isNumber(data[i][j][k]) )  continue;
						if( typeof data[i][j][k] != "undefined"   ){
						    console.log('key data', i,j,k, data[i][j][k]);						
						}					
					}
				}
			}			
         	*/   
			    var timeseries = [];
			    var year = doc.day.getFullYear(), month = doc.day.getMonth(), day = doc.day.getDate();
		        for(var i=0;i<23;i++){
		            for(var j=0;j<60;j++){
					    //console.log('second  key   ',i,j,data[i][j].toObject(),"-------------------------------");
					    var keys = Object.keys(data[i][j].toObject());
					    //console.log(   keys.length ,'-----------------------------');
					    if(keys.length ==0 ) continue;
				        for(var k=0;k<keys.length;k++){						
						    //console.log('key data', i,j,k, data[i][j][keys[k]]);						
						    timeseries.push({'v':data[i][j][keys[k]],'t': new Date(year,month,day,i,j,k)  });					
					    }
				    }
			    }
                console.log(timeseries.length);	
                callback(null,timeseries);				
		    } else if(doc.length>1){
		        console.log('length >1'.red,doc.length, doc);
                doc = doc[0];
			    var timeseries = [];				
				if(data){
					var data = doc.data;			
			        var hourkey = Object.keys(data), minutekey , secondkey;				
					var year = doc.day.getFullYear(), month = doc.day.getMonth(), day = doc.day.getDate();
					for(var i=0;i<23;i++){
						for(var j=0;j<60;j++){
							//console.log('second  key   ',i,j,data[i][j].toObject(),"-------------------------------");
							var keys = Object.keys(data[i][j].toObject());
							//console.log(   keys.length ,'-----------------------------');
							if(keys.length ==0 ) continue;
							for(var k=0;k<keys.length;k++){						
								//console.log('key data', i,j,k, data[i][j][keys[k]]);						
								timeseries.push({'v':data[i][j][keys[k]],'t': new Date(year,month,day,i,j,k)  });					
							}
						}
					}
					console.log(timeseries.length);	
				}
                callback(null,timeseries);				
		    }else if(doc.length==0){
			    callback(null,[]);
			}
	    }else if(!doc){
	        console.log( 'no sensor data  found'.green );
			
			callback(null,[]);
	    }	
    })
}

var sensorPush = function(message){

        timeSeriesModel.push(message.id,message.value,message.time,function(err,data){
            if(err) winston.error('errror updaing '+err);
            else {
		        if(data==1){
		            //winston.debug('time series model updating success'.green);
				}
			    else if(data ==0){
			        winston.debug('time series model updating wrong  '.red+ err);
				}
		    }
        });
}

module.exports = {
   sensorPush: sensorPush,
   getSensorData:getSensorData
}