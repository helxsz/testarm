var app = require('../../app').app;  
 
var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto'),	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda');	
	
var errors = require('../../utils/errors'),
	config = require('../../conf/config'),
	serviceCatalog = require('../serviceCatalog.js'),
	winston = require('../../utils/logging.js'),
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js'),
	energyRank = require('../energyRank.js');

//https://alertmeadaptor.appspot.com/traverse?traverseURI=https%3A%2F%2Fgeras.1248.io%2Fcat%2Farmhome&traverseKey=924a7d4dbfab38c964f5545fd6186559&Submit=Browse
var armhome;
serviceCatalog.findByURL('https://geras.1248.io/cat/armhome',function(err,data){
    if(err || !data){
	    console.log('armhome catalog can not be found ',err);
	}else {
	    //console.log('find the service catalog '.green,data);
        armhome = data; 		
	}    
});  
// http://localhost/arm/home/test
// https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23/energy
app.get('/arm/home/test',function(req, res, next){
    // var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	console.log(req.query.start,req.query.end);
	var day_begin , day_end;
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;	
	console.log('/arm/home/test   ',day_begin,day_end);
    armhome.getResourceData('https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23/energy',range,function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(404);
		else if(data) {
		    var s = [];
            console.log('data   ------------------'.green,data.e.length);
			var time = [];										
			var e = data.e;
			e.forEach(function(data){
				//console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				time.push( moment(data.t*1000 ).fromNow() );
			})
			if(e.length>0)
			console.log( 'what the fuck  '.red,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow() );
                          							
			s.push({e:data.e, 'time':time});			
		    res.send(s);
		}	
	})
	
})



var devices = [
  {'url':'https://geras.1248.io/series/armhome/1/MeterReader/00-0D-6F-00-00-F2-6E-23'},  //  	
  {'url':'https://geras.1248.io/series/armhome/10/MeterReader/00-0D-6F-00-00-C1-4B-7B'},
  {'url':'https://geras.1248.io/series/armhome/11/MeterReader/00-0D-6F-00-00-C2-CE-83'},
  {'url':'https://geras.1248.io/series/armhome/12/MeterReader/00-0D-6F-00-00-C2-8A-92'},
  {'url':'https://geras.1248.io/series/armhome/13/MeterReader/00-0D-6F-00-00-82-AD-19'},
  {'url':'https://geras.1248.io/series/armhome/14/MeterReader/00-0D-6F-00-00-F2-70-B9'},
  {'url':'https://geras.1248.io/series/armhome/15/MeterReader/00-0D-6F-00-00-F2-72-48'},
  {'url':'https://geras.1248.io/series/armhome/16/MeterReader/00-0D-6F-00-00-C1-33-B0'},
  {'url':'https://geras.1248.io/series/armhome/17/MeterReader/00-0D-6F-00-00-C1-2D-CD'},
  {'url':'https://geras.1248.io/series/armhome/18/MeterReader/00-0D-6F-00-00-F2-70-BD'},
  {'url':'https://geras.1248.io/series/armhome/19/MeterReader/00-0D-6F-00-00-82-B7-FA'},  
  {'url':'https://geras.1248.io/series/armhome/2/MeterReader/00-0D-6F-00-00-C1-2C-C0'}
]


appBuilder.createApp('armhome',new ArmhomeMQTTHandler().handleMessage, function(err,app){
    if(err) winston.error('error in create app');
	else winston.info('app is created enlight '+app.id);  // 
	app.subscribeService('enlight',function(err,success){
	    if(err) winston.error('errro in subscrption ');
		else winston.info('subscribe success  enlight  '.green);
	})
});

function ArmhomeMQTTHandler(){  
	this.handleMessage = handleMessage;
	function handleMessage(pattern, channel, message){	    
		try{
		    var raw = JSON.parse(message);
		    var msg = raw.e[0];  
		    var url = msg.n, value = msg.v, time = msg.t;
            //winston.debug("ArmhomeMQTTHandler handle message  "+url+"   "+value+"   "+time);
            var attrs = url.split('/'); var property = attrs[attrs.length-1];
			var parent_url = url.substring(0, url.indexOf(property)-1);
			
			if(property == 'online'){   
			    console.log(' check online property of device  '.red,parent_url, value, time);
			}else{
			
            }			
		}catch(e){
			//console.log('some thing wrong   ......'.red+e);   
		}
    }
}

function getEnergyMeter(callback){
	var redis_ip= config.redis.host;  
	var redis_port= config.redis.port;
	
	var redisClient;	
	try{ 
		redisClient = redis.createClient(redis_port,redis_ip);
	}
	catch (error){
		console.log('get home by building  error' + error);
		redisClient.quit();
		return callback(error,null);
	}	
	var list = [];
	redisClient.keys("res:home:*", function(err, keys) {
		//console.log('res key home',keys.length);		
		var mul = redisClient.multi();
		keys.forEach(function(key){		
		   mul.hmget( key , 'energy','online');
		})		           		
		mul.exec(function (err, replies) {
			for(var i=0;i<replies.length;i++){
				 if(replies[i][0] != null)					
				 list.push({'energy':replies[i][0], 'online':replies[i][1]});                        						 
			}					
			callback(null,list);
		});					
		redisClient.quit();
	}); 
}



//console.log('alert home test');
app.get('/alert/home/discover',function(req,res,next){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day =   new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59)
		default_type = 'hour';
		
	//default_start_day = new Date(2014,0,1,0,0,0)
	//    default_end_day =   new Date(2014,1,27,0,0,0);	
	var day_begin, day_end, type;
	if(req.query.start == undefined && req.query.end == undefined && req.query.type == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
		type = default_type;
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
		type = req.query.type;
	}
	
	var id = req.query.id;
	if(id == undefined || id==null){
	    res.send(404);
		return;
	}
    var array = [];
	array.push(id);
	console.log('query  ',id, day_begin, day_end);
	//queryDataFromGeras(array,day_begin, day_end,function(err,data){
	
			async.parallel([
				function(callback){
					queryDataFromGerasWithTime(array,day_begin, day_end,'hour',function(err,data){
						if(err){ callback(err,null);}
						else if(!data){ callback(null,[]); }
						else if(data){
							console.log(data);
							data = _.sortBy(data,function(obj){
								return obj.power;
							})
							data[0].type = 'hour';
							callback(null,data[0]);
						}
					});		 
				},
				function(callback){
					queryDataFromGerasWithTime(array,new Date(day_begin.getTime()-30*24*3600*1000), day_begin,'day',function(err,data){
						if(err){ callback(err,null);}
						else if(!data){ callback(null,[]); }
						else if(data){
							//console.log(data);
							data = _.sortBy(data,function(obj){
								return obj.power;
							})
							data[0].type = 'day';
							callback(null,data[0]);
						}
					});			
				}
			],function(err, results){
			    if(err){ res.send(500);}
			    else if(!results){res.send(404);}
				else{
				    //console.log('results'.red,results);
				    res.send(results);				
				}								
			})			
})

app.get('/alert/home/day',function(req,res,next){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,0,0,0)
	    default_end_day =   new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,23,59,59);
	
	if(req.query.start == undefined && req.query.end == undefined){
	    day_begin  = default_start_day;
	    day_end = default_end_day;   
	}else{
	    day_begin = new Date(req.query.start); 
		day_end = new Date(req.query.end);
	}
	getEnergyMeter(function(err, data){	
        if(err) res.send(500);
        else if(!data) {res.send(404);}
        else if(data){
		    //console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    var url = obj.energy;
				var arr = url.split('/');
				if(arr[6]=='MeterReader')
			    array.push(obj.energy);
			})
			queryDataForDay(array,day_begin,function(err,data){
				if(err){ res.send(500);}
				else if(!data){res.send(404);}
				else if(data){
					res.send(data);
				}
			});		    
		}		
	})
})

app.get('/alert/home/month',function(req,res,next){
    var now = new Date(), 
	    defaultFirstMonth = new Date(now.getFullYear(),now.getMonth()-1,1,0,0,0)
	    defaultSecondMonth =   new Date(now.getFullYear(),now.getMonth(),1,0,0,0);
	var firstMonth, secondMonth;
	if(req.query.start == undefined && req.query.end == undefined){
	    firstMonth  = defaultFirstMonth;
	    secondMonth = defaultSecondMonth;   
	}else{
	    firstMonth = new Date(req.query.start); 
		secondMonth = new Date(req.query.end);
	}
	
    var ismonth = req.query.month || true;	
	getEnergyMeter(function(err, data){	
        if(err) {} 
        else if(!data) {}
        else if(data){
		    //console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    var url = obj.energy;
				var arr = url.split('/');
				if(arr[6]=='MeterReader')
			    array.push(obj.energy);
			})
			
			async.parallel([
				function(callback){
					queryDataForMonth(array,firstMonth,function(err,data){
						if(err){ callback(err,null);}
						else if(!data){ callback(null,[]); }
						else if(data){
						    if(ismonth){
								var monthvalues  = caculateMonthConsumption(data,firstMonth);						
								callback(null,{date:firstMonth, values:monthvalues});
								//callback(null,monthvalues );
						    }else{
							    callback(null,data);
							}
						}						
					});		 
				},
				function(callback){
					queryDataForMonth(array,secondMonth,function(err,data){
						if(err){ callback(err,null);}
						else if(!data){ callback(null,[]); }
						else if(data){
						    if(ismonth){
                                var monthvalues  = caculateMonthConsumption(data,secondMonth);   
								callback(null,{ date:secondMonth, values:monthvalues} );
								//callback(null,monthvalues );
						    }else{
							    callback(null,data);
							}
						}
					});				
				}
			],function(err, results){
			    if(results[0]&& results[1])
				console.log('compare the resources    '.green,results[0].length, results[1].length);
								
				console.log('new array '.green, results.length);
				if(err){ res.send(500);}
				else if(!results){res.send(404);}
				else if(results){
					res.send(results);		
				}				
			})
		}		
	})
	
})

function caculateMonthConsumption(data, date){
	var monthvalues = [];	
	for(var j=0;j<data.length;j++){
		var home = data[j];
		var month11 = 0;
		var empty = 0;
		for(var i=0;i<home.energy.length-1;i++){
			var day = home.energy[i];
			console.log(day.value, month11);
			if(typeof day.value !== undefined ||  day.value != undefined)
			month11 +=day.value;
            if(day.value == 0) empty++;			
		}
		console.log("fuck  ".red,home.id, "total consumption",month11, "total days :", home.energy.length);
		monthvalues.push({id:home.id, power:  Math.floor( month11 * 100)/100, empty:empty, date:date});//, "empty days :",empty
	}
	return monthvalues;
}

function queryDataForDay(array, day_begin, callback){
    energyRank.getDayAnalytics(array, day_begin,function(err,data){
	    if(err) callback(err,null);
	    else callback(null,data);
	});
}

function queryDataForMonth(array, date, callback){
    energyRank.getMonthAnalytics(array, date,function(err,data){
	    if(err) callback(err,null);
	    else callback(null,data);
	})
}

//http://localhost/alertme/home/visithistory
app.get('/alertme/home/visithistory',function(req,res,next){
    var date = new Date(2013,9,1);
	//var date = new Date(2014,1,17);
    visitHistory(date);
	req.send(200);
});

function visitHistory(beginDate,endDate){
	getEnergyMeter(function(err, data){	
        if(err) {}
        else if(!data) {}
        else if(data){
		    console.log('get meter data ',data);
		    var array = [];
			_.map(data,function(obj){
			    var url = obj.energy;
				var arr = url.split('/');
				if(arr[6]=='MeterReader')
			    array.push(obj.energy);
			})
			var day = beginDate;
			if(endDate == null) endDate = new Date();
			
			async.whilst(function () {
			  return day.getTime() < endDate.getTime();
			},
			function (next) {
                queryDataFromGeras(array,day, new Date(day.getTime() + (24 * 60 * 60 * 1000)),function(err,home_list){
					if(err){ }
					else if(!home_list){}
					else if(home_list){
					    // value == energy consumption of one day, rank of the day
						console.log('one day list'.green, home_list.length);
						home_list = _.sortBy(home_list,function(home){  return home.power});
					    home_list.forEach(function(home){
						   energyRank.storeDayAnalytics(home.url,{value:home.power, rank:1}, day); 						
						})						
					}					
					day.setTime(day.getTime() + (24 * 60 * 60 * 1000));
					next();
				});			
			},
			function (err) {
			    // All things are done!
			    console.log('all things are done');
			});			 
		}		
	})
}

// caculate the energy killwatts in one days
function queryDataFromGeras(array, day_begin,day_end, callback){
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1h&rollup=avg';
	var s = [];	
	async.forEach(array, function(device, callback){
		//console.log('start .....'.red,device);
		armhome.getResourceData(device,range,function(err,data){
			if(err){   }
			else if(!data) {}  
			else if(data) {														
				var e = data.e;
                if(e.length>0){
				    console.log( 'queryDataFromGeras  '.green,device,e.length, new Date(e[0].t *1000 ),  new Date( e[e.length-1].t *1000 ), "last hour: ",e[e.length-1].v, "first hour:", e[0].v, "difference:",(e[e.length-1].v - e[0].v), "adfaf:",(e[e.length-1].v - e[0].v)/(60*60)/1000 );				
                    var datapoints = [];
					e.forEach(function(data){
						delete data.n;
						datapoints.push({t:new Date(data.t*1000),v:data.v/(60*60)/1000});
						//console.log(  moment(data.t*1000 ).fromNow(), new Date(data.t*1000) );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
					})				    
					
					s.push({url:device,  power: (e[e.length-1].v - e[0].v)/(60*60)/1000 , timeline:datapoints}); //,    transform into killwatts
				}
                else{
                    s.push({url:device, power:0}  );
                }				
			}
            callback();			
		})					
	},function(err, results){
		//console.log('crawler  finished  .....  '.green, results);
        if(err){
		    callback(err,null);
		}else{
		    callback(null,s);
		}		
	});
}

var schedule = require('node-schedule');
var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = [0, new schedule.Range(0, 6)];
rule2.hour = 9;
rule2.minute = 30;

var j = schedule.scheduleJob(rule2, function(){
    console.log('running the event analytics rule!');
	
});




function queryDataFromGerasWithTime(array, day_begin,day_end, type, callback){    
	var range;
	if(type == 'month')
    range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1mo&rollup=avg';
	else if(type == 'day')
    range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1d&rollup=avg';	
	else if(type == 'hour')
    range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000+'&interval=1h&rollup=avg';
	
	var s = [];	
	async.forEach(array, function(device, callback){
		//console.log('queryDataFromGerasWithTime .....'.red,device,range,type);
		armhome.getResourceData(device,range,function(err,data){
			if(err){   }
			else if(!data) {}  
			else if(data) {														
				var e = data.e;
                if(e.length>0){
				    console.log( 'queryDataFromGerasWithTime  '.green,device,e.length, moment(e[0].t *1000 ).fromNow(),  moment( e[e.length-1].t *1000 ).fromNow(), "last hour: ",e[e.length-1].v, "first hour:", e[0].v, "difference:",(e[e.length-1].v - e[0].v)/(60*60)/1000, e.length );				
                    var datapoints = [];
					e.forEach(function(data){
						delete data.n;
						datapoints.push({t:new Date(data.t*1000),v:data.v/(60*60)/1000});
						console.log(  moment(data.t*1000 ).fromNow(), new Date(data.t*1000) );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
					})				    					
					s.push({url:device,  power: (e[e.length-1].v - e[0].v)/(60*60)/1000, timeline:datapoints }); //,   timeline:datapoints
				}
                else{
                    s.push({url:device, power:0}  );
                }				
			}
            callback();			
		})					
	},function(err, results){
		//console.log('crawler  finished  .....  '.green, results);
        if(err){
		    callback(err,null);
		}else{
		    callback(null,s);
		}		
	});
}
