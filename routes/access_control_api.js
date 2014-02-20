var crypto = require('crypto'),
    moment = require('moment'),
    color = require('colors'),
    async = require('async'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
	
var userModel = require('../model/user_model');	
    config = require('../conf/config.js');
    errors = require('../utils/errors'),
	gridfs = require("../utils/gridfs"),
	winston = require('../utils/logging.js'); 

var allowedHost = [
//'http://127.0.0.1',
//'http://213.123.189.97',  //us
//'http://195.88.101.44',   // us
//'http://146.90.110.143',// us steve

'http://217.140.96.21',   // cambridge
'http://217.140.100.22',  // san jose
'http://217.140.110.23',  // austin
'http://217.140.104.28',  // tokyo a
'http://217.140.104.30',  // tokyo b
'http://217.140.108.21',  // santa clara
'http://217.140.105.7'    // bangalore
];
//  allowed cross domain
var filterIP = function(req, callback) {
    //console.log('headers '  , req.ip);
    var allow = false;
    for(var i=0;i<allowedHost.length;i++){
        if(allowedHost[i].indexOf(req.ip)!=-1)
	    {  
		    allow=true;
	        break;
	    }
    }
    if(allow) {
	    callback(true);
    } else {
        callback(false);
    }
};

var filterSession = function(req,callback){
    var allow = false;
	if (req.session.uid) {
		if( req.session.uid.length < 12) callback(false);
		else callback(true);
	} else {
        callback(false);
	}   
}

	
function authUser(req,res,next){
    filterIP(req,function(allow){
	    if(allow) {
		    console.log('in the list'.green);
		    next();			
		}
	    else {
		    console.log('not in the ip list'.red);
		    filterSession(req,function(allow){
			    if(allow) {
				   console.log('authroized with session'.green);
				   next();
				}  
			    else {
				    console.log('not authrozied with session'.red);
				    res.redirect('/login');
				}	
			})   
		}
	})
}

module.exports = {
    authUser: authUser
}