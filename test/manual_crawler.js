var app = require('../../app').app;  

var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	request = require('request'),
	Agenda  = require('agenda');	
	
var errors = require('../../utils/errors'),
    serviceCatalog = require('../serviceCatalog.js'),
	config = require('../../conf/config'),
	winston = require('../../utils/logging.js'),
	eventModel = require('../../model/event_model.js')
	io = require('../websocket_api.js'),
	appBuilder = require('../AppBuilder.js'),
	db = require('../persistence_api.js'),
	simulation = require('../simulation.js');
/******    catalog  crawler   ********/

/****   experiment 2 ********/
var meetingService = serviceCatalog.findByName('armmeeting');  // enlight
var buildingService = serviceCatalog.findByName('armbuilding');  // enlight	


app.get('/service/armbuilding/build',function(req,res){
    try{
	    buildingService.fetchResourceList(function(err,obj){
            if(err){
	            winston.error('error ');
	        }else{
                getLocationResource(obj);			
	        }	 	 
	    });
    }catch(e){  winston.error('service not found') }
    res.send(200);
})

app.get('/service/armmeeting/build',function(req,res){
    try{
	    meetingService.fetchResourceList(function(err,obj){
            if(err){
	            winston.error('error ');
	        }else{
                getArmMeetingResource(obj);	
	        }	 	 
	   });
    }catch(e){  winston.error('service not found') }
	res.send(200);
})

function getLocationResource(obj){
  	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		winston.debug('item-metadata'.green+ rel+ val);              				
    }
	winston.debug('parseHyperCat1  item-metadata  length'.green+obj.items.length );
    /**/
	db.saveResourceListInBulk2('cat:'+obj.service,obj.items,function(err,data){
		                        if(err){  winston.error('save resource list error'+err);}
		                        else winston.info(data);
	});
	
	
	for(var i=0;i<obj.items.length;i++){
		var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		winston.debug("parseHyperCat1  href".yellow+ href +"  "+ metadata.length+"   "+isAbsoluteURL(href)+"   "+isAbsoluteURL("https://"+obj.host+href) ); //
		
		//////////////////////////////////////////////////////////////////////////////////
		var relativeURL, absoluteURL ;
		if(!isAbsoluteURL(href)){
		    relativeURL = href;
			absoluteURL = "https://"+obj.host+href;
		    href = "https://"+obj.host+href;

		}
		winston.debug("parseHyperCat2  href".yellow+ href ); //
		// get the location
		buildingService.fetchResourceDetail(href,function(err,obj){
            if(err){
	            winston.error('error ',err);
	        }else{               
	            var url = obj.url, name = obj.name, address = JSON.stringify(obj.address),capacity = obj.capacity, email = obj.email, event = obj.event;  
                var relativeURL = extractRelativeURL(url,buildingService.getHost());				
				winston.debug("LocationDetailHandler  ".green+relativeURL);
                db.saveResourceInBulk2("location:"+relativeURL, obj, function(err,data){} );
				// add into attribute groups
                if(obj.building){
				    db.savePropertyGroup("location:"+"building:"+obj.building, "location:"+relativeURL, function(err,data){} );	
                    db.saveResourceList2("location:"+"building",obj.building,function(err,data){});					
				}				
		    }
        })
       					
		//////////////////////////////////////////////////////////////////////////////////
		var hash = {};
		for(var j=0;j<metadata.length;j++){
		    var item  = metadata[j], rel = item.rel, val= item.val;
			//console.log(rel+"  "+val);
			
            if(rel == 'urn:X-tsbiot:rels:isContentType'){
				winston.debug('this is a room');						                       
			}else if(rel == 'http://www.w3.org/2002/07/owl#sameAs'){				                            
				
				winston.debug('email link :'+"   "+val);
                hash.sameAs = val;													
			}else if(rel == 'http://schema.org/event'){
			    winston.debug('event :'+"   "+val);
				hash.event = val;
				if(!isAbsoluteURL(val)){
		            val = "https://"+obj.host+val;
		        }
		        winston.debug("parseHyperCat3  event href".yellow+ val ); //
		        // get the event of a location
		        /*
				buildingService.fetchResourceDetail(val,function(err,events){
				    
                        if(err){
	                     winston.error('error ',err);
	                    }else{
						    var relativeURL = extractRelativeURL(events.url, buildingService.getHost());
							console.log( "relative:".green,  relativeURL );
                            for(var i=0;i<events.length;i++){
	                            var event = events[i];								
				                winston.debug("event handler  ".green+event.location+event.startDate+ event.endDate+ event.url);                               								
		                    }
							
							pushToListInBulk( 'events:',relativeURL ,events,function(err,data){});
						}
                })
				*/		
			}else if(rel=='http://schema.org/addressLocality'){
			    winston.debug('addressLocality :'+"   "+val);
				hash.addressLocality = val;
				db.savePropertyGroup("location:"+"addressLocality:"+hash.addressLocality, "location:"+relativeURL, function(err,data){} );
			}				
        }
		db.saveResourceInBulk2("location:"+href, hash, function(err,data){} );	
	}	
}


function getArmMeetingResource(obj){
    	
 	for(var i=0;i<obj['item-metadata'].length;i++){
		var item  = obj['item-metadata'][i], rel = item.rel, val= item.val;
		console.log('item-metadata'.green, rel, val);              				
    }
	console.log('parseHyperCat1  item-metadata  length'.green,obj.items.length );
	
	for(var i=0;i<obj.items.length;i++){
		var item  = obj.items[i], href = item.href, metadata= item['i-object-metadata'];
		console.log("parseHyperCat1  href".yellow, href, metadata.length); //
	    meetingService.fetchResourceDetail(href,function(err,data){
            if(err){
	            winston.error('error ');
	       }else{
                for(var i=0;i<data.items.length;i++){
		            var item  = data.items[i], href = item.href, metadata= item['i-object-metadata'];
                    console.log("fetchResourceDetail  href".yellow, href, metadata.length);
					meetingService.fetchResourceDetail(href,function(err,data1){
					    if(err){
                                winston.error('error ');
						}else{
						    for(var i=0;i<data1.items.length;i++){
		                        var item  = data1.items[i], href = item.href, metadata= item['i-object-metadata'];
                                console.log("fetchResourceDetail 2  href".yellow, href, metadata.length);
								 
								meetingService.fetchResourceDetail(href,function(err,data2){ 
                                    if(err){
								        winston.error('error ');
								    }else{
									  try{
									    for(var i=0;i<data2['item-metadata'].length;i++){
		                                    var item  = data2['item-metadata'][i], rel = item.rel, val= item.val;
		                                    //console.log('item-metadata'.green, rel, val); 
                                            if(rel == 'urn:X-tsbiot:rels:isContentType'){
						                            winston.debug('this is a sensor');						                       
					                        }else if(rel == 'http://www.w3.org/2002/07/owl#sameAs'){
					                            
												var res = href.replace("https://geras.1248.io/cat","");
												winston.debug('location :'+res+"   "+val+"  "+meetingService.getName());
                                                db.saveResourceInBulk2("device:"+res, {loc:val}, function(err,data){} );													
					                        }else if(rel == 'urn:X-tsbiot:rels:supports:observe:mqtt:senml:v1'){
													
											}else if(rel == 'urn:X-tsbiot:rels:supports:query'){
													
											}					
                                        }

                                      }catch(e){winston.error(e.name+"    "+data2.toString());} 										
									}
								})
						    }							
                            db.saveResourceListInBulk2('cat:'+obj.service,data1.items,function(err,data){
		                        if(err){  winston.error('save resource list error'+err);}
		                        else winston.info(data);
	                        });													
						}	
					})
				}
	       }	 	 
	    });							
	}	
	db.getResourceList2('cat:'+obj.service,function(err,data){});
}

/******    catalog  crawler   ********/
function isAbsoluteURL(s) {
    return s.charAt(0) != "#"
      && s.charAt(0) != "/"
      && ( s.indexOf("//") == -1 
        || s.indexOf("//") > s.indexOf("#")
        || s.indexOf("//") > s.indexOf("?")
    );
}

function extractRelativeURL(href,host){

   return href.replace("https://"+host,"");
}



// socket.io 

/*   not used
app.get('/room/event',function(req,res){
    var url = req.query.url;
	
	url = rooms[url];
	buildingService.fetchResourceDetail(url+"/events",function(err,obj){
        if(err){
	        winston.error('error    '+url+"/events");
			res.send(404);
	    }else{
		    var currentDate = new Date();
			var found = false, next = -1;
	        for(var i=0;i<obj.length;i++){
	            var event = obj[i];
	            //console.log(url,event.startDate, event.endDate);
				var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
				if(i==0&&currentDate.getTime() < startDate.getTime() ) break;
				if(currentDate.getTime() >= startDate.getTime()  ) {  next ++; }
				if(startDate.getTime()<=currentDate.getTime() &&  currentDate.getTime() <= endDate.getTime()){
				    found = true;
					next = i;
					break
				}
	        }
			
			var start, end,event ;
			if(found) {  
			    event = obj[next];
			}else{
			    event = obj[next+1];
			}
			try{
                var startDate = new Date(event.startDate), endDate = new Date(event.endDate);
				var hour = startDate.getHours(), min = startDate.getMinutes();
				if(hour < 10) hour = '0'+startDate.getHours();
				if(min < 10) min = '0'+startDate.getMinutes();
                start = hour+":"+min;
				
                hour = endDate.getHours(), min = endDate.getMinutes();
				if(hour < 10) hour = '0'+endDate.getHours();
				if(min < 10) min = '0'+endDate.getMinutes();				
                end = hour+":"+min;	
            }catch(e){
			    console.log(url,'not found , not nexts'.red);
			    return res.send(200,{'found':0});
			}
				
            if(found) found = 1;
			else found = 0;
			//console.log(' found   ',found, next,start ,end);
            res.send(200,{'found':found,'start':start,'end':end, 'temperature': 22+  (Math.floor(Math.random() * 8) + 1)/4 });			
	    }	 	 
	});
})


var agenda = new Agenda({db: { address: 'localhost:27017/agenda-example'}});

agenda.define('request events for arm room', function(job, done) {
    getArmMeetingSchedules(done)
});

agenda.every('1 minutes', 'request events for arm room');
//agenda.start();
agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});
agenda.once('success:request events for arm room', function(job) {
  console.log("success:request events for arm room: %s", job);
});
agenda.on('fail:request events for arm room', function(err, job) {
  console.log("Job failed with error: %s", err.message);
});

//getArmMeetingSchedules(function(){})

function getArmMeetingSchedules(done){

    db.getResourceList2("location:addressLocality:Cambridge",function(err,data){ 
        //winston.debug('getArmMeetingSchedules  '+data.length);  
		async.forEach(data, function(item,callback){ 
		     db.findResource2(item,['event'],function(err,data){ 
			    //winston.debug("data222".green,item,data[0]); 				
                buildingService.fetchResourceDetail(data[0],function(err,events){			    
                        if(err){
	                     winston.error('error ',err);
	                    }else{
						    var relativeURL = extractRelativeURL(events.url, buildingService.getHost());
							//winston.debug( "relative:".green,  relativeURL );
                            for(var i=0;i<events.length;i++){
	                            var event = events[i];								
				                //winston.debug("event handler  ".green+event.location+event.startDate+ event.endDate+ event.url); 
                                event.start = new Date(event.startDate).getTime();								
		                    }
							db.addEventsForRoom( 'events:'+relativeURL ,events,function(err,data){});
							callback();
						}
                })				
				
			 })
		 }, function(err) {      
            if(err){
                 //winston.error(err);
            }
			else{
                
			}
			done();
        });            			
    })
}



	/*
	client.hgetall("device:"+url, function (err, data) {
        console.log('hgetall  reply 2'+data);	
    });

function findResource(context,url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('find Resource eInto Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	

	redisClient.hmget(context+url, item,function(err, data){
	    redisClient.quit();
		data.url = url;
	    if(err) {return callback(err,null);}
		else if(data) { return callback(null,data);}
        else { return callback(null,null);}	
	});

	redisClient.quit();
	return callback(null,1);
}

function saveResourceInBulk(context, url ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port;	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
		
	var mul = redisClient.multi();
    for(var index in item) {
		mul.hmset(context+url,index,item[index],function(){})
    }		
	mul.exec(function (err, replies) {
        console.log("save Resource ".green + replies.length + " replies");
    });
	redisClient.quit();
	return callback(null,1);
}
 */
 
 
/*
function clearResourceList(service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save ResourceIntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers('cat:'+service).exec(function (err, replies) {
		console.log('services     '.green +  replies+"  ");
    });
	redisClient.quit();  
	return callback(null,1);
}

function getResourceList(context,service,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('get ResourceList Catalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
    redisClient.multi().smembers(context+service).exec(function (err, replies) {
		console.log('services     '.green +  replies.length+"  ");
		replies.forEach(function (reply, index) {
             console.log("Reply " + index + ": " + reply.toString() +"\n" );
        });
		return callback(null,replies);
    });
	redisClient.quit();  	
}

function saveResourceList(context,service ,item ,callback){
    var redisClient;
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 	
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('save Resource IntoCatalog  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
    //redisClient.zadd('imgs:'+service,time,JSON.stringify({'img':img_id,'time':time}));
	redisClient.sadd(context+service,JSON.stringify({'item':item}));
	redisClient.incrby(context+service+':count',1);
	redisClient.quit();
	return callback(null,1);
}
*/
*/