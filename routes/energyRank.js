var util = require('util'),
	path = require('path'),
    fs = require('fs'),
    async = require('async'),
    color = require('colors'),
    crypto = require('crypto'),
	 _ = require('underscore');
	 
var winston = require('../utils/logging.js'),
	YearAnalyticsModel = require('../model/yearly_analytics_model.js');		

var yearAnalyticsModel = new YearAnalyticsModel('EnergyRankSeries', {read:'primary', actor:{type: String, required:true}});	
	
var getDayAnalytics = function(id,date, callback){
    var now = new Date();
    yearAnalyticsModel.findData(id,date,false,function(err,doc){
        if(err)  {
		     console.error(err);
			 callback(err);
		}	 
        else if(doc){
	        //console.log( 'find sensor data  '.green + "  "+data.length +"  "+JSON.stringify( data )); //
             if(doc.length>=1){
		        //console.log('length >1'.green,doc.length,doc);
				var s = [];
				doc.forEach(function(obj){
				    console.log( obj.data[date.getMonth()][date.getDate()], obj.actor );
					s.push({energy:obj.data[date.getMonth()][date.getDate()], id:obj.actor});
				})				
                callback(null,s);				
		    }else if(doc.length==0){
			    callback(null,[]);
			}
	    }else if(!doc){
	        console.log( 'no sensor data  found'.green );
			callback(null,[]);
	    }	
    })
}

var getMonthAnalytics = function(ids, date, callback){
    var now = new Date();
    yearAnalyticsModel.findData(ids,date,true,function(err,doc){
        if(err)  {
		     console.error(err);
			 callback(err);
		}	 
        else if(doc){
	        //console.log( 'find sensor data  '.green + "  "+data.length +"  "+JSON.stringify( data )); //
             if(doc.length>=1){
		        //console.log('length >1'.green,doc.length,doc);
				var s = [];
				doc.forEach(function(obj){
				    //console.log( obj.data[date.getMonth()], obj.actor );
					var daylist = [];
                    var keys = Object.keys(obj.data[date.getMonth()]);
				        for(var k=0;k<keys.length;k++){
                            var day_obj = obj.data[date.getMonth()][ keys[k] ];
                            if(day_obj){
							    day_obj['day'] = keys[k];
								daylist.push( day_obj );
							}						    					
					    }										
					s.push({energy:daylist, id:obj.actor});				
					//s.push({energy:obj.data[date.getMonth()], id:obj.actor});
				})
                callback(null,s);				
		    }else if(doc.length==0){
			    callback(null,[]);
			}
	    }else if(!doc){
	        console.log( 'no sensor data  found'.green );
			callback(null,[]);
	    }	
    })
}

var storeDayAnalytics = function(id,value,time){
    //console.log('  store day analytics '.green, id, value, time);
	yearAnalyticsModel.push(id,value,time,function(err,data){
		if(err) winston.error('errror updaing '+err);
		else {
			if(data==1){
				//winston.debug('time series model updating success'.green);
			}
			else if(data ==0){
				winston.debug('analytics model updating wrong  '.red+ err);
			}
		}
	});
}

module.exports = {
   storeDayAnalytics: storeDayAnalytics,
   getDayAnalytics:getDayAnalytics,
   getMonthAnalytics:getMonthAnalytics
}