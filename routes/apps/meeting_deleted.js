/*
var agenda = new Agenda({db: { address: 'localhost:27017/agenda-example'}});
agenda.schedule('today at 8:47am', 'cacheARMEvents');
agenda.start();
agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});
agenda.once('success:cacheARMEvents', function(job) {
  console.log("success:request events for arm room: %s", job);
});
agenda.on('fail:cacheARMEvents', function(err, job) {
  console.log("Job failed with error: %s", err.message);
});

agenda.define('cacheARMEvents', function(job, done) {
    getArmMeetingSchedules(done)
});
function getArmMeetingSchedules(done){

}
*/

// http://localhost/tempdata	
/*


app.get('/arm/meeting/today', getMultiRoomEvents);
function getMultiRoomEvents(req,res,next){

    var rooms = [  'Room.UKCWillowA', 'Room.UKCFM10', 'Room.UKCARM66MR11' ,'Room.UKCWillowB','Room.UKCOak','Room.UKCHolly','Room.UKCMaple','Room.UKCBeech'] ;
    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
	
	eventModel.getMultiRoomEvents(rooms,early_day,function(err,data){
		if(err){
			console.log('getting events error '.red+err);
		}
		else{
			console.log('getting events  '.green,{rooms:data});
            res.send({rooms:data});				
		}		
	});		
}

app.get('/testevents2', getRoomEvents);
function getRoomEvents(req,res,next){
    var room = { 
	  'name': 'Room.UKCWillowA ',
      'displayname':'WilA',	
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA"
	}  
    var now = new Date(), early_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);	
	eventModel.getRoomEvents(room.name,early_day,function(err,data){
		if(err){
			console.log('getting events error '.red+err);
		}
		else{
		    _.map(data.events,function(event){  delete event._id; })
			console.log('getting events  '.green);
            res.send(data);				
		}		
	});	

	//var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
    var range = "?start="+  ( -60*60*24 )+"&end="+ (-100);
	
    meetingService.getResourceData('armmeeting/22/MotionSensor/00-0D-6F-00-00-C1-45-B6/motion',range,function(err,data){
        if(err)  console.log(err);
        else {
		    console.log('data   ------------------'.green,data.e.length);			
			var senmlParse = function(data){			
			    var e = data.e;
				e.forEach(function(data){
				    console.log(  moment(data.t*1000 ).fromNow() );	//   ,new Date(data.t*1000) ,  moment(data.t*1000 ).fromNow()
				})			
			}						
			senmlParse(data);		   
		}	
    })	
	
}




function getRoomEvents(tomorrow, res){
    var rooms = [
    { 
	  'name': 'Room.UKCWillowA',
      'displayname':'WilA',	
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowA",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCWillowB',
	  'displayname':'WilB',
      "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCWillowB",
	  'temperature': 22,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCElm',
	  'displayname':'Elm',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCElm",
      'temperature': 23,
	  'time':new Date()
	},
    {
	  'name': 'Room.UKCOak',
	  'displayname':'Oak',
	  "url":"https://protected-sands-2667.herokuapp.com/rooms/Room.UKCOak",
      'temperature': 21,
	  'time':new Date()
	}
    ];
	
	async.forEach(rooms, 
	  function(room, callback){        
		url = simulation.rooms[room.name];
		console.log('........................'+room.name+"       " +url);
		
		buildingService.fetchResourceDetail(url+"/events",function(err,eventlist){
            if(err){
	            winston.error('error    '+url+"/events");
				room.events = [];	
	        }else{
                var now = new Date(), late_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
				// all events in this day
				if(tomorrow)
				eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() > late_day.getTime(); });
                else
				eventlist = _.filter(eventlist, function(event){ var eventDate = new Date(event.endDate);   return eventDate.getTime() <= late_day.getTime(); });				
                room.events = eventlist;
                //winston.debug('filtered  ... '+room.events.length);				
	        }		
            callback();			
	    });		
      },
	  function(err){
        //winston.debug('get all the messages ',util.inspect(events, false, null));
		res.send(200,{rooms:rooms});
	  } 
	);
}

app.get('/meetings/arm/tomorrow',function(req,res){
 	getRoomEvents(true,res);
})

app.get('/meetings/arm/now',function(req,res){
    var now = new Date(), 
	    default_start_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0)
	    default_end_day = new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
	
	var day_begin  = new Date(req.query.start) || default_start_day;
	var day_end = new Date(req.query.end) || default_end_day;
	var range = "?start="+day_begin.getTime()/1000+"&end="+day_end.getTime()/1000;
	
 	getRoomEvents(false,res);
})


*/