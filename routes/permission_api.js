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
	
	
function authUser(req,res,next){

     var cookie_uid = req.cookies['uid'];
	 var cookie_auth =  req.cookies['auth'];
	 var signed_uid,signed_auth;
	 if(cookie_uid)
	 signed_uid = deciphterSessionParameter(cookie_uid,config.sessionSecret);
	 if(cookie_auth)
	 signed_auth = deciphterSessionParameter(cookie_auth,config.sessionSecret);

	 if (req.session.uid) {
		 //console.log('authUser middleware'.green, req.session.username,req.session.uid);
		 if( req.session.uid.length < 12) return res.send(400,{'error':'InvalidAuthenticationInfo:user id is not valid'});	
		 next();
	 } else {
		 if(req.xhr) return res.send(403,{'error':'InsufficientAccountPermissions'});
		  res.redirect('/login');
	 }
}

function authUser1(req,res,next){

     var cookie_uid = req.cookies['uid'];
	 var cookie_auth =  req.cookies['auth'];
	 var signed_uid,signed_auth;
	 if(cookie_uid)
	 signed_uid = deciphterSessionParameter(cookie_uid,config.sessionSecret);
	 if(cookie_auth)
	 signed_auth = deciphterSessionParameter(cookie_auth,config.sessionSecret);

	 if (req.session.uid) {
		 //console.log('authUser middleware'.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
		        res.redirect('/login');
		    }
			else{			
			   console.log('authUser  find user uid'.green,user._id);	
               req.user = user;			   
			   next();
            }			
		 })		 
	 } else {
		 if(req.xhr) res.send(403);
		 else res.redirect('/login');
	 }
}


function basicAuth(req, res, next) {
  var auth, parts, plain
  if (!(auth = req.get('authorization'))) return next()
  parts = auth.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') return next()
  try {
    plain = new Buffer(parts[1], 'base64').toString().split(':')
  } catch (e) {
    console.error('Invalid base64 in auth header')
    return next()
  }
  if (plain.length < 2) {
    console.error('Invalid auth header')
    return next()
  }
/*
  User.authenticate(plain[0], plain.slice(1).join(':'), function (err, user) {
    if (err || !user) {
      console.log("basic auth: user not found");
      return res.send(401, 'Invalid username/password in basic auth')
    }
    req.user = user
    return next()
  })
  */
}


var requireUser = function require_auth(req, res, next) {
  if (req.user !== undefined) {
    next();
  } else {
    req.session.return_to = req.url
    res.redirect("/login");
  }
};

var requireUserOr401 = function (req, res, next){
  if (req.user !== undefined){
    next();
  } else {
    res.statusCode = 401;
    res.end("not authorized");
  }
};

// Require admin privileges
var requireAdminOr401 = function require_admin(req, res, next){
  if (req.user === undefined ||
        req.user['account_level'] === undefined ||
        req.user.account_level < 1){
      res.statusCode = 401;
      res.end("not authorized");
  } else {
      next();
  }
};




/*******************************************************
              client session
*******************************************************/

function cipherSessionParameter(str,secret){
   var password = secret, str = str;
   //console.log('cipherSessionId',uid,password);
   var cipher = crypto.createCipher("rc4", password);
   var ciphered = cipher.update(str.toString(), "utf8", "hex");
   ciphered += cipher.final("hex");
   //console.log('ciphered£º' + ciphered);
   return ciphered;
}

function deciphterSessionParameter(str,secret){
   var password = secret, str = str;
   var decipher = crypto.createDecipher("rc4", password);
   var deciphered = decipher.update(str.toString(), "hex", "utf8");
   deciphered += decipher.final("utf8");
   //console.log('deciphered£º' + deciphered);
   return deciphered;
}



// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
};
 
// Check for admin middleware, this is unrelated to passport.js
// You can delete this if you use different method to check for admins or don't need admins
exports.ensureAdmin = function ensureAdmin(req, res, next) {
        if(req.user && req.user.admin === true)
            next();
        else
            res.send(403);
};



module.exports = {
    authUser: authUser
   ,authUser1: authUser1
   ,cipherSessionParameter :cipherSessionParameter
   ,deciphterSessionParameter: deciphterSessionParameter
   // Auth middleware
   , requireUser: requireUser
   , requireUserOr401: requireUserOr401
   , requireAdminOr401: requireAdminOr401
}