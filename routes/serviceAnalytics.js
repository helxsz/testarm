

function saveImgReferenceIntoGroup(group_id ,img_id ,callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('pushImageIdToQueue  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
	var time = new Date().getTime();
    redisClient.zadd('imgs:'+group_id,time,JSON.stringify({'img':img_id,'time':time}));
	redisClient.incrby('imgs:'+group_id+':count',1);
	redisClient.quit();
	return callback(null,1);
}

function removeImgReferenceIntoGroup(group_id ,img_id ,time, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('pushImageIdToQueue  error' + error);
		redisClient.quit();
		return callback(error,null);
    }	
    redisClient.zrem('imgs:'+group_id,JSON.stringify({'img':img_id,'time':time}));
	redisClient.incrby('imgs:'+group_id+':count',-1);
	redisClient.quit();
	return callback(null,1);
}

function getImageCountFromGroup(group_id, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('pushImageIdToQueue  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
	
	redisClient.get('imgs:'+group_id+':count',function(err,data){
	    if(err) {  console.log('getImageCountFromGroup'.red,data); callback(err,null);}
	    else { 
		   console.log('getImageCountFromGroup  count'.green,data);
		   console.log('.................................');
		   callback(null,data);
        }		   
	})
	redisClient.quit();		
}

function getImagesFromGroup(group_id, start, end, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}catch (error){
        console.log('pushImageIdToQueue  error' + error);
		redisClient.quit();
		return callback(error,null);
    }
		
    redisClient.zrange('imgs:'+group_id,start,end,function(err,data){
	    var n = 3;
	    var lists = _.groupBy(data, function(a, b){
                return Math.floor(b/n);
        });
        lists = _.toArray(lists); //Added this to convert the returned object to an array.
        //console.log(lists);

        if(err) {  console.log('getImagsFromGroup'.red,data); callback(err,null);}
	    else { 
		   console.log('getImagsFromGroup  '.green,data);
		   callback(null,data);
		   console.log('.................................');		   
        }
        redisClient.quit();		
	})	
}

function searchImagesBetweenTime( group_id, timebefore, timeafter, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('searchImagesBetweenTime  error'.red + error);
		redisClient.quit();
		return callback(error,null);
    }   
	redisClient.zrangebyscore('imgs:'+group_id,timebefore,timeafter,function(err,data){
	    console.log('searchImagesBetweenTime  '.green,data);
		callback(null,data);
	})	
	// ZRANGEBYSCORE
}

function removeImagesBetweenTime(group_id, timebefore, timeafter, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('removeImagesBetweenTime  error'.red + error);
		redisClient.quit();
		return callback(error,null);
    } 

	redisClient.zremrangebyscore('imgs:'+group_id,timebefore,timeafter,function(err,data){
	    console.log('removeImagesBetweenTime romve '.green,data);
		callback(null,data);
	})
    //ZREMRANGEBYSCORE
}


function removeImageFromGroup(group_id, start, end, callback){
    var redisClient;
    try{ 
        redisClient = redis.createClient(redis_port,redis_ip);
	}
    catch (error){
        console.log('pushImageIdToQueue  error' + error);
		redisClient.quit();
		return callback(error,null);
    } 
	
	redisClient.zremrangebyrank('imgs:'+group_id,start,end,function(err,data){
	    console.log('removeImageFromGroup romve ',data);
		redisClient.incrby('imgs:'+group_id+':count',-data);
		callback(null,data);
	})
}

/*
	redisClient.multi()
	.hmset("train_id:"+train_id,"uid",train_uid,function(){})
	.expire("train_id:"+train_id, 20*60)
	.exec(function (err, replies) {
            //console.log("parse_ActMsg   redisMULTI got ".red + replies.length + " replies");
            replies.forEach(function (reply, index) {
               // console.log("Reply " + index + ": " + reply.toString());
            });
    });

      redisClient.sadd('users', socket.user);
	  redisClient.srem('users',socket.user);

      redisClient.multi().smembers('users').exec(function (err, replies) {
           io.sockets.emit('nusers', replies[0].length, replies[0].toString());
		   console.log('Client connected.      '.green +  replies[0].length+"  ");
      });
	  
	  
    var mul = redisClient.multi();
    for(var i=0;i<msg.length;i++){
	   mul
		 .sadd("train",msg[i].body.train_id,function(){})
	     .hmset("train_id:"+msg[i].body.train_id,{"status":msg[i].body.variation_status,"stanox":msg[i].body.loc_stanox,"next_stanox":msg[i].body.next_report_stanox,"timestamp":msg[i].body.actual_timestamp},function(){})
	     .expire("train_id:"+msg[i].body.train_id, 20*60);
	}
	mul.exec(function (err, replies) {
            console.log("updateTrainInfos redis got " + replies.length + " replies");
            replies.forEach(function (reply, index) {
                //console.log("Reply " + index + ": " + reply.toString());
            });
    });	  
*/
