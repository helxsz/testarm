/********************************
   publish / subscribe 
*********************************/
//subscribeService('armmeeting');

function subscribeService(service,type){
    type = type || 'redis';
    var redis_ip= config.redis.host;  
    var redis_port= config.redis.port; 
    var redisClient = redis.createClient(redis_port,redis_ip); 
    /*
    redisClient.auth(config.opt.redis_auth, function(result) {
	    console.log("Redis authenticated.");  
    })
    */ 
    redisClient.on("error", function (err) {  
        winston.error("redis Error " + err.red,err);  
        return false;  
    });    

    redisClient.on('connect',function(err){
	    winston.info('App has subscribe to the channel success');
		redisClient.psubscribe(service);
    })
	  
    redisClient.on('pmessage', function(pattern, channel, message){	    
	    //winston.debug('message to the app  '+  pattern+"   "+channel+"    " );
	    try {
    		    var data = JSON.parse(message);   						
				winston.debug("data:".green+data);				
	        } catch (e) {
	            return;
	     }	    
    });	   
}