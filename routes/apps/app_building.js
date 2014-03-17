var app = require('../../app').app;  

var async = require('async'),
    fs = require('fs'),
	util = require('util'),
    colors = require('colors'),
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment');	
	
var errors = require('../../utils/errors'),
	config = require('../../conf/config'),
	winston = require('../../utils/logging.js'),
	appBuilder = require('../AppBuilder.js'),
	simulation = require('../simulation.js'),
	access_control = require('../access_control_api.js'),
	roomModel = require('../../model/room_model.js'),
	sensorRoomModel = require('./SensorRoomModel.js');

function escapeRegExp(str) {
   return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function replaceAll(find, replace, str) {
   return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

app.get('/meeting/sites/json',access_control.authUser,function(req,res,next){
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.send(200,getSiteRooms(data));
			
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';
						   url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   //url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}        
     		return res.send(200,locals.data);          			
		}
	})
})

app.get('/meeting/sites',access_control.authUser,function(req,res,next){
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.send(200,getSiteRooms(data));
			
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';

						   url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   //url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}
            if(req.xhr) {
			    console.log(' ajax');
     			return res.send(200,locals.data);
            }				
			else {
			    console.log('not ajax');
			    res.render('landingpage.html', locals);
            }				
		}
	})
})

function getSiteRooms(data){
	var sites = [];

	for(var i=0,l=data.length;i<l;i++) {
		var row = data[i];
		var site = false;
		var building = false;
		var floor = false;

	//  search for existing site
		for(var j=0,k=sites.length;j<k;j++) {
			if(sites[j].name == row.site) {
				site = j;
				break;
			}
		}

		if(site === false) {
			site = sites.length;
			sites[site] = {
				name: row.site,
				buildings: []
			};
		}

	//  search for existing building
		for(var j=0,k=sites[site].buildings.length;j<k;j++) {
			if(sites[site].buildings[j].name == row.building) {
				building = j;
				break;
			}
		}

		if(building === false) {
			building = sites[site].buildings.length;
			sites[site].buildings[building] = {
				name: row.building,
				floors: []
			};
		}

	//  search for existing floor
		for(var j=0,k=sites[site].buildings[building].floors.length;j<k;j++) {
			if(sites[site].buildings[building].floors[j] == row.floor) {
				floor = j;
				break;
			}
		}

		if(floor === false) {
			floor = sites[site].buildings[building].floors.length;
			sites[site].buildings[building].floors[floor] = row.floor;
		}
	}
	return sites;
}


function getMenus(site, res){
	roomModel.searchRooms({site:site},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.render('meeting2.html');
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			
							    < for(var i=0; i<locals.menus.length; i++) {>
								    <li>
										<a class='room_nav' ng-click="getRoomInfo($event.target.href);$event.preventDefault()" href="<%= locals.menus[i].url %>"><%= locals.menus[i].name %></a>
                                    </li>
								<} >			
			
			*/
            var groups = _.groupBy(data,function(room){
				return (room.site+","+room.building+","+room.floor);		
			})
			var sites = [];
			var key_array = Object.keys(groups);
			var locals = {};
			var menus = [];
			key_array.forEach(function(key){
			    var subkeys = key.split(',');
			    var site_key = subkeys[0], building_key = subkeys[1], floor_key = subkeys[2];
				console.log(site_key, building_key, floor_key);
				var name = '';
				if(floor_key == 0) name = building_key+"  Ground";
				else if(floor_key > 0) name = building_key+"  Floor"+floor_key;
                menus.push({name: name, url: "/buildings/"+building_key+"/"+floor_key});				
			})
			locals.menus = menus;
			res.render('meeting3.html', locals);
		}
	})
}

function getFlatMenus(site, res){
    //site:site
	roomModel.searchRooms({},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			*/
			var names = ['Ground floor','First floor','Second floor','Third floor','Fourth floor','Fifth floor','Sixth floor','Seventh floor','Eighth floor','Nighth floor'];
			var locals = {};
			locals.data = getSiteRooms(data);
			var  url ; 
			for(var i=0; i<locals.data.length; i++) {
			   for(var j=0; j<locals.data[i].buildings.length; j++) {
					   for(var k=0; k<locals.data[i].buildings[j].floors.length; k++) {
						   //console.log(locals.data[i].buildings[j].floors[k] );
						   var name = '';
                           // meeting/site/Peterhouse_Technology_Park/building/CPC1/floor/1
						    url =  "/buildings/"+locals.data[i].buildings[j].name+"/"+k;
						   //url =  "/meeting/site/"+locals.data[i].name+"/building/"+locals.data[i].buildings[j].name+"/floor/"+k;
						   locals.data[i].buildings[j].floors[k] = {url:url, name:names[locals.data[i].buildings[j].floors[k]]};
					   }									   
			   }
			}						
            //res.send(200,getSiteRooms(data));
			res.render('meeting3.html', locals);
		}
	})
}

function getMenus(site, res){
	roomModel.searchRooms({site:site},function(err,data){
	    if(err) res.send(500);
		else if(!data) res.send(400);
		else if(data){
		    //res.render('meeting2.html');
			/*
			data = _.map(data,function(room){
			   delete room.__v;
			   delete room._id;
			})
			*/
            var groups = _.groupBy(data,function(room){
				return (room.site+","+room.building+","+room.floor);		
			})
			var sites = [];
			var key_array = Object.keys(groups);
			var locals = {};
			var menus = [];
			key_array.forEach(function(key){
			    var subkeys = key.split(',');
			    var site_key = subkeys[0], building_key = subkeys[1], floor_key = subkeys[2];
				console.log(site_key, building_key, floor_key);
				var name = '';
				if(floor_key == 0) name = building_key+"  Ground";
				else if(floor_key > 0) name = building_key+"  Floor"+floor_key;
                menus.push({name: name, url: "/buildings/"+building_key+"/"+floor_key});				
			})
			locals.menus = menus;
			res.render('meeting3.html', locals);
		}
	})
}
// http://localhost/meeting/site/Peterhouse_Technology_Park/building/ARM3/floor/0
app.get('/meeting/site/:site/building/:building/floor/:floor',access_control.authUser,function(req,res,next){
    var site = req.params.site, building = req.params.building, floor = req.params.floor;
	var  site = replaceAll("_"," ",site);
	console.log("site:"+site+":"+building+":*   floor");
    getFlatMenus(site, res);
	//res.send(200,getSiteRooms(data));
})

app.get('/meeting/site/:site/building/:building',access_control.authUser,function(req,res,next){
    var site = req.params.site, building = req.params.building;	
	var site = replaceAll("_"," ",site);
	console.log("fuck fuck  fuck  site:"+site+":"+building+":*");
    getFlatMenus(site, res);
})

// http://localhost/meeting/site/Capital_Park
// http://localhost/meeting/site/Peterhouse_Technology_Park
app.get('/meeting/site/:site',access_control.authUser,function(req,res,next){
    var site = req.params.site;	
	var site = replaceAll("_"," ",site);
	console.log("site:"+site+":");
    getFlatMenus(site, res);
})

app.get('/buildings/map',access_control.authUser,function(req,res){
    var building = req.query.building, floor = req.query.floor;
	console.log('building  map'.green,building,floor);
	var mappath = 'maps/ARM-MAP_Base.svg';
	if(building == 'ARM1' && floor == 0){
        mappath = 'maps/ARM1-FIRST-FLOOR.svg';
	}else if(building == 'ARM1' && floor == 1){
        mappath = 'maps/ARM1-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM2' && floor == 0){
        mappath = 'maps/ARM2-GROUND-FLOOR.svg';	
	}else if(building == 'ARM2' && floor == 1){
        mappath = 'maps/ARM2-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM3' && floor == 0){
        mappath = 'maps/ARM3-GROUND-FLOOR.svg';	
	}else if(building == 'ARM3' && floor == 1){
        mappath = 'maps/ARM3-FIRST-FLOOR.svg';	
	}
	else if(building == 'ARM6' && floor == 0){
        mappath = 'maps/ARM6-GROUND-FLOOR.svg';	
	}else if(building == 'ARM6' && floor == 0){
        mappath = 'maps/ARM6-FIRST-FLOOR.svg';	
	}
    res.sendfile(mappath);	
})