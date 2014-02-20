//http://cnodejs.org/topic/516774906d38277306ff5647
//https://github.com/ammmir/node-oauth2-provider  https://github.com/jaredhanson/oauth2orize

// https://github.com/xiaojue/tuer.me/blob/master/api.js#L75  https://github.com/xiaojue/tuer.me/blob/master/routes/apis/feed.js

// http://danielstudds.com/setting-up-passport-js-secure-spa-part-1/  http://danielstudds.com/adding-verify-urls-to-an-express-js-app-to-confirm-user-emails-secure-spa-part-6/
// https://github.com/madhums/node-express-mongoose-demo
// http://elegantcode.com/2012/05/15/taking-toddler-steps-with-node-js-passport/

//http://stackoverflow.com/questions/18413836/how-do-i-create-a-cookie-passportjs-facebook
//http://stackoverflow.com/questions/11210817/link-facebook-data-to-currently-logged-in-user-with-passport-js
//http://stackoverflow.com/questions/17675887/github-oauth-for-node-js-express-application-private-email


var mongoose = require("mongoose"),
    GridStore = mongoose.mongo.GridStore,
    ObjectID = mongoose.mongo.BSONPure.ObjectID,
    crypto = require('crypto'),
    _=require('underscore'),
    moment = require('moment'),
    redis = require('redis'),
    fs = require('fs'),
	io = require('socket.io'),
    request = require('request');
 
 var passport = require('passport') , 
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GithubStrategy = require('passport-github').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var app = require('../app.js').app,
    permissionAPI = require('./permission_api'),
	userModel = require('../model/user_model'),
    config = require('../conf/config.js'),
	winston = require('../utils/logging.js');
	
// serialize sessions    
//http://danialk.github.io/blog/2013/02/23/authentication-using-passportjs/
//https://github.com/pablodenadai/Corsnection/blob/master/server/app/app.js

 passport.serializeUser(function(user, done) {
    done(null, user._id);
 })

passport.deserializeUser(function(id, done) {
    //done(null,id);
	/*//http://stackoverflow.com/questions/11186174/passportjs-how-to-get-req-user-in-my-views */
    userModel.findUserByQuery({ _id: id }, function (err, user) {
      done(err, user);
    })
	
})

/*http://stackoverflow.com/questions/17397052/nodejs-passport-authentication-token
  https://github.com/hokaccha/node-jwt-simple
	social:{
		facebook:{ id:String,avatar:String,name:String,token:String},
		twitter:{id:String,avatar:String,name:String,token:String},
		github:{id:String,avatar:String,name:String,token:String},
		google:{id:String,avatar:String,name:String,token:String}
	}
*/

console.log(config.github.clientID,config.github.clientSecret,config.github.callbackURL);

// use github strategy
passport.use(new GithubStrategy({
      clientID: config.github.clientID,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL,
	  scope: ['user:email', 'public_repo', 'repo', 'gist']
    },
    function(accessToken, refreshToken, profile, done) {
	    console.log('GithubStrategy   /auth/github.............',accessToken, profile.id, profile.displayName, profile.username, profile.emails[0].value, profile._json.avatar_url);	  	
		
		/*
		if(profile.emails.length==0){  //http://stackoverflow.com/questions/17675887/github-oauth-for-node-js-express-application-private-email		
		}
		*/
		request('https://api.github.com/user/emails?access_token={'+accessToken+'}', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('get email from token '.green, response.statusCode,  body) // Print the google web page.
            }else{
			    console.log('get email from token error'.red,error,response.statusCode);
			}
        })	
        
		
        //https://api.github.com/user/emails?access_token={your access token}
      userModel.findUserByQuery({ 'social.github.id': profile.id }, function (err, user) {
        if (!user) {
		    console.log('github user not found'.red);
		    userModel.createNewUser( {  username:profile.username,  
			                            email:profile.emails[0].value, 
										img:profile._json.avatar_url, 
										fullname:profile.displayName,
										password:profile._json.avatar_url,
                            			social:{github:{id:profile.id,avatar:profile._json.avatar_url, name:profile.username,token:accessToken} }}, 
		    function(err,data){
                if(err)	return done(err);
                else if(!data)	return done(null, false, { message: 'can not create your profile in database' });  			
				else {
				   console.log('save the new github user into database'.green, data._id);
				   data.isNew= true;
				   return done(err, data);
                }				
		    })			
        } else {
		  console.log('github user  found'.green);
		  user.isNew=false;
          return done(err, user);
        }
      })
	   /*
        process.nextTick(function () {
         return done(null, profile);
       });
       */	   
    }
))

  // use facebook strategy    https://developers.facebook.com/apps/663584603654022/summary?save=1
passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
	  passReqToCallback: true
    },
    function(accessToken, refreshToken, profile, done) {
	    console.log('FacebookStrategy   /auth/facebook.............',profile.id, profile.displayName, profile.username, profile.emails[0].value, profile._json.avatar_url);	 
		
        userModel.findUserByQuery({ 'social.facebook.id': profile.id }, function (err, user) {
          if (!user) {
		    console.log('facebook user not found'.red);
		    userModel.createNewUser( {  username:profile.username,  
			                            email:profile.emails[0].value, 
										img:profile._json.avatar_url, 
										fullname:profile.displayName,
										password:profile._json.avatar_url,
                            			social:{facebook:{id:profile.id,avatar:profile._json.avatar_url, name:profile.username,token:accessToken} }}, 
		    function(err,data){
                if(err)	return done(err);
                else if(!data)	return done(null, false, { message: 'can not create your profile in database' });  			
				else {
				   console.log('save the new facebook user into database'.green, data._id);
				   return done(err, user);
                }				
		    })			
        } else {
		  console.log('facebook user  found'.green);
          return done(err, user);
        }
      })               
	    /*
		process.nextTick(function () {
         return done(null, profile);
        });  
        */	   
    }
  ))
  

//http://stackoverflow.com/questions/11210817/link-facebook-data-to-currently-logged-in-user-with-passport-js
  // use twitter strategy  
passport.use(new TwitterStrategy({
      consumerKey: config.twitter.clientID,
      consumerSecret: config.twitter.clientSecret,
      callbackURL: config.twitter.callbackURL,
	  //passReqToCallback: true
    },
    function(token, tokenSecret, profile, done) {
	    console.log('TwitterStrategy   /auth/twitter.............',profile.id, profile.displayName, profile.username, profile.emails[0], profile._json.avatar_url);	  
        userModel.findUserByQuery({ 'social.twitter.id': profile.id }, function (err, user) {
          if (!user) {
		    console.log('twitter user not found'.red);
		    userModel.createNewUser( {  username:profile.username,  
			                            email:profile.emails[0].value, 
										img:profile._json.avatar_url, 
										fullname:profile.displayName,
										password:profile._json.avatar_url,
                            			social:{twitter:{id:profile.id,avatar:profile._json.avatar_url, name:profile.username,token:accessToken} }}, 
		    function(err,data){
                if(err)	return done(err);
                else if(!data)	return done(null, false, { message: 'can not create your profile in database' });  			
				else {
				   console.log('save the new twitter user into database'.green, data._id);
				   return done(err, user);
                }				
		    })			
        } else {
		  console.log('twitter user  found'.green);
          return done(err, user);
        }
      })        
		/*
		process.nextTick(function () {
         return done(null, profile);
        });
        */		
    }
))


//  github   function will not be called.
app.get('/auth/github',passport.authenticate('github') , function(req, res){    
	console.log('github not called '.red);
});

// ,successRedirect: '/' http://stackoverflow.com/questions/10111445/passport-different-redirect-for-login-and-account-registration
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
    console.log('github then redirect'.green);
	if (req.user.isNew) { res.redirect('/discover/course?isNew=true');	 }
    else res.redirect('/discover/course?isNew=false');
    
});

//  facebook
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['user_status', 'user_photos'] }), function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login',successRedirect: '/' }), function(req, res) {
    res.redirect('/');
});

// function will not be called.  twitter
app.get('/auth/twitter', passport.authenticate('twitter'), function(req, res){
});

app.get('/auth/twitter/callback',    passport.authenticate('twitter', { failureRedirect: '/login',successRedirect: '/' }), function(req, res) {
    res.redirect('/');
});

// https://github.com/jaredhanson/passport-facebook/blob/master/examples/login/app.js   https://github.com/jaredhanson/passport-twitter/blob/master/examples/signin/app.js

/*  
// use local strategy
passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) { return done(err) }
        if (!user) {
          return done(null, false, { message: 'Unknown user' })
        }
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'Invalid password' })
        }
        return done(null, user)
      })
    }
))  
  
 
  // use google strategy
passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ 'google.id': profile.id }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.username,
            provider: 'google',
            google: profile._json
          })
          user.save(function (err) {
            if (err) console.log(err)
            return done(err, user)
          })
        } else {
          return done(err, user)
        }
      })
    }
));


//http://passportjs.org/guide/authorize/
app.get('/connect/twitter',
  passport.authorize('twitter-authz', { failureRedirect: '/account' })
);

app.get('/connect/twitter/callback',
  passport.authorize('twitter-authz', { failureRedirect: '/account' }),
  function(req, res) {
    var user = req.user;
    var account = req.account;

    // Associate the Twitter account with the logged-in user.
    account.userId = user.id;
    account.save(function(err) {
      if (err) { return self.error(err); }
      self.redirect('/');
    });
  }
);

var request = require('request');

app.get('/pro/:name',function(req,res){

	console.log(req.session);
	
    var repos,
        opts = {
			host: "api.github.com",
			path: '/users/'+req.params.name+'/repos',
			method: "GET"
		},
    	 request = https.request(opts, function(resp) {
    		var data = "";
    		resp.setEncoding('utf8');
		resp.on('data', function (chunk) {
			data += chunk;
		});
		resp.on('end', function () {
			repos = JSON.parse(data); 
			console.log('repos',repos);
			//res.render('board',{ repos: repos});
		    res.send(repos);
		});
    	});
    request.end();
  // https://api.github.com/users/username/repos
    
  request('https://api.github.com/users/'+req.params.name+'/repos', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          //console.log(body) // Print the google web page.
		  
		  var json = JSON.parse(body);
          json.forEach(function(repo){
               console.log(repo.name,repo.description) ;
          });		  
		  res.send(body);
      }  
  })
})

 */