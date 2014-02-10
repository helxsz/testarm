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
*/