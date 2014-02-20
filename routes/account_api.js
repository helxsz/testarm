var crypto = require('crypto'),
    fs = require('fs'),
    moment = require('moment'),
    colors = require('colors'),
    async = require('async'),
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    util = require("util"),
    im = require('imagemagick');

var app = require('../app').app,
    GridFS = require('../app').GridFS,
    mail_api = require('./mail_api'),
    permissionAPI = require('./permission_api'),
    userModel = require('../model/user_model'),
    config = require('../conf/config.js'),
	gridfs = require("../utils/gridfs"),
    winston = require('../utils/logging.js'); 	


/** 
 *   sign up
 */
app.get('/signup',signupPage);
app.post('/signup',signupUser);
/**   
 *     get the login and logout
 */
app.get('/login',loginPage);
app.post('/sessions',loginUser);
app.del('/sessions', logoutUser);



/**
       login and register with email invitation
**/



app.get('/signup/invitation',signupWithInvitation);

function signupWithInvitation(req,res,next){
    var token = req.query.token, cid = req.query.cid,  email = req.query.email;
    var locals = {};
	locals.email = req.query.email;
    locals.title = "Invitation Sign up";
   // how to verify the token
    console.log('signupWithInvitation request',token,email,cid);

}

function signupPage(req,res){
    var locals = {};
	if (req.session.uid) {
		 console.log('signupPage,found session '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
                locals.title = 'Sign Up';			   			   				
			    res.render('signup',locals);
		    }
			else{
			   console.log('find user uid'.green,user._id);
                locals.user = {
                    username : user.username,
					email : user.email,
					img: user.img
                };
				
			    res.redirect('/');
            }			
		 })
	} else {
		console.log('signupPage,not found session'.red);
		locals.title = 'Sign Up';
	    res.render('signup',locals);
	}
}

function loginPage(req,res){
    var locals = {};
	 if (req.session.uid) {
		 console.log('loginPage, found session'.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
                locals.title = 'Sign In';				
			    res.render('signin',locals);
		    }
			else{
			   console.log('find user uid'.green,user._id);
                locals.user = {
                    username : user.username, 
					email : user.email
                };
			    //res.render('setting_account',locals);
				res.redirect('/');
            }			
		 })
	 } else {
		 console.log('loginPage,not found session'.red);
         locals.title = 'Sign In';			   			   						 
	     res.render('signin',locals);
	 }
}


function signupUser(req,res,next){

    console.log('post  /signup  ',req.body.username,req.body.email,req.body.password);	
	var errors = [];
    if (!req.body.username) errors.push("username specified")
    if (!req.body.email) errors.push("Missing email")
    if (!req.body.password) errors.push("Missing password")
    if (errors.length){
        res.statusCode = 400;
        res.end(JSON.stringify({status:"error", errors:errors}));      
        return;    
	}	

	if (req.body.password.length < 6) {
       res.statusCode = 400;
       res.end(JSON.stringify({status:"error", errors:[{"message":"password must be at least 6 characters long"}]}));          
       return;
    }
	
	var email, username, password;        
    email = sanitize(req.body.email).trim(), email = sanitize(email).xss();  
	try {
        check(email).isEmail();
        } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({status:"error", errors:[{"message":"email is invalid"}]}));      
        return;
     }	 

	if (!/^[a-zA-Z0-9\-\_]+$/.test(username)) {
		return res.send(400, {status:"error", errors:[{"message":'Username only use letters, numbers, \'-\', \'_\''}]});
	}
	 
    username = sanitize(req.body.username).trim(), username = sanitize(username).xss();  	   
    password = sanitize(req.body.password).trim(), password = sanitize(password).xss();
		
    userModel.createNewUser({'username':username,'email':email,'password':password},function(err,data){
	    if(err) {
		    //console.log('err',err);
			if(err.code==11000) return res.send(409, { detail: err.err, reason:"database key duplicate" });
			return next(err);
	    }
	    else
		{
            // send a registration email to the user, could put in a queue			
			mail_api.sendRegistraionMail(username,email,function(error,response){
                if(error){
                    console.log("RegistraionMail sent error ".red,error); // get error message
                }else{
                    console.log("RegistraionMail sent: ".green ,response.message);
                }			
			});
			
		    console.log("signup success".green, data);
		    req.session.uid = data._id;
            req.session.username = data.username;
			if(req.xhr && req.accepts('application/json')){	
			
			    res.json(201,{ 'user':{'id':data._id,'username':data.username,'profile_picture':"http://www.androidhive.info/wp-content/themes/androidhive/images/ravi_tamada.png"}
					         ,'access_token':data._id});
			}			
			else if(req.accepts('text/html')){
				    res.redirect('/');
			}
		
		}
	});	
}

/*
{
    "access_token": "fb2e77d.47a0479900504cb3ab4a1f626d174d2d",
    "user": {
        "id": "1574083",
        "username": "snoopdogg",
        "full_name": "Snoop Dogg",
        "profile_picture": "http://distillery.s3.amazonaws.com/profiles/profile_1574083_75sq_1295469061.jpg"
    }
}						
*/	

function loginUser(req, res, next) {
    if (!req.body.username) {
        res.json("username must be specified ", 400);
        return;
    } 

    if (!req.body.password) {
        res.json("password must be specified ", 400);
        return;
    } 		

	console.log('loginUser '.green,req.body.username,req.body.email,req.body.password,req.body.remember_me);	
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {	
	    userModel.authenticateFromPass(username,password,function(err,data){
		  if(err){
		     console.error(err);
			 console.log(req.accepted);
			 
			 if(req.accepts('text/html')){
			    console.log('not logined  1111'.red);
				res.redirect('/login');
				return;
			 }
			 else if(req.accepts('application/json')){	
                console.log('not logined  2222'.red);			 
			    res.json(401,{'msg':'user or password not valid'});
				return;
			 }
			 else{
			    console.log('not logined  3333'.red);
			    res.redirect('/login');
				return;
			 }
			 
		  }else{
		     console.log(data.username,req.body.remember_me,data._id);
			 //if(req.session) console.log('req session  ');
			 //else console.log('session == null',req);
             req.session.uid = data._id;
             req.session.username = data.username;
			 
             if (req.body.remember_me) {
			   /*
               //http://dailyjs.com/2011/01/10/node-tutorial-9/
			   //http://cnodejs.org/topic/515535485dff253b374288da
			   //http://www.80sec.com/session-hijackin.html
			   //http://stackoverflow.com/questions/5879132/sharing-data-between-php-and-node-js-via-cookie-securely
			   //http://stackoverflow.com/questions/11897965/what-are-signed-cookies-in-connect-expressjs
			   //https://hacks.mozilla.org/2012/12/using-secure-client-side-sessions-to-build-simple-and-scalable-node-js-applications-a-node-js-holiday-season-part-3/
			   */
			   
			   userModel.generateCookieToken(data.email,function(err,token){
			       if(err) return next(err);
			       else{
				        console.log('generateCookieToken ',token.email,token.token,token.series);
				        // res.cookie('logintoken', {email:data.email,token:data.token,series:data.series}, { expires: new Date(Date.now() + 2 * 60480000), path: '/' });
				   }
			   });
			   
			   var signed_uid = permissionAPI.cipherSessionParameter(data._id,config.sessionSecret);
			   var signed_auth = permissionAPI.cipherSessionParameter(username+','+password,config.sessionSecret);
			   
               res.cookie('usernanme', data.username, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('ip',req.ip, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('last_login',new Date().getTime(), { expires: new Date(Date.now() + 9000001), httpOnly: true });			   
               res.cookie('auth',signed_auth, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('uid', signed_uid, { expires: new Date(Date.now() + 9000001), httpOnly: true });
			   res.cookie('rememberme', 'yes', { expires: new Date(Date.now() + 9000001), httpOnly: true });
		   
             } 	 
			 
            // Regenerate session when signing in  to prevent fixation 

            req.session.regenerate(function(){
                 // Store the user's primary key in the session store to be retrieved, or in this case the entire user object

		        console.log('');
                req.session.uid = data._id;
                req.session.username = data.username;
				
				//console.log(req.accepted);
				if(req.accepts('text/html')){
				    res.redirect('/');
				}
				else if(req.accepts('application/json')){	
			        console.log("json");
			        res.json(200,{ 'user':{'id':data._id,'username':data.username,'profile_picture':"http://www.androidhive.info/wp-content/themes/androidhive/images/ravi_tamada.png"}
					         ,'access_token':data._id});
			    }						        
            });
             
		  }
		
		})   

	}
}
/**/
function logoutUser(req, res){
  // Logout by clearing the session
    console.log('logoutUser    '.green);
	if (req.session) {
        req.session.uid = null;
        req.session.username = null;
        res.clearCookie('uid');
		res.clearCookie('auth');
		res.clearCookie('logintoken');
		res.clearCookie('usernanme');
		res.clearCookie('ip');
		res.clearCookie('last_login');
		
        res.clearCookie('gadm');
        req.session.destroy(function () {
		    console.log('session destoried'.green);
        });
    }
    /*	
    req.session.regenerate(function(err){
    // Generate a new csrf token so the user can login again
    // This is pretty hacky, connect.csrf isn't built for rest
    // I will probably release a restful csrf module
        csrf.generate(req, res, function () {
           res.send({auth: false, _csrf: req.session._csrf});    
        });	
   });
   */ 
   if(req.xhr)
   res.send(200);
   else   
   res.redirect(req.headers.referer || '/login');
}


/****************************************************
                       password
*******************************************************/

/****
       username and email validation

*****/
app.get('/validate/username/:username', validateName);
app.get('/validate/email/:email', validateEmail);

function validateName(req, res,next){
    var username = req.params.username;
    if (!username) {
	    return res.send(400,{'error':'username should not be empty'});
	}
    userModel.findUserByQuery({username: username}, function (error, user) {
        if (error) {
            console.error(error);
		    res.send(500,{'error':error});
        }
        else if (user) {
		    res.send(409,{'error':'username already existed'});
        }
        else {
		   res.send(200,{'data':null});
        }
     });

}

function validateEmail(req, res){
    var email = req.params.email;
    if (!email) {
	    return res.send(400,{'error':'email should not be empty'});
	}	
    try {
       check(email).isEmail();
    } catch (e) {
	    console.log("email not valid  ".red,email);
       return res.send(400,{'error':'email format wrong'});
    }	
	
    userModel.findUserByQuery({email: email}, function (error, user) {
        if (error) {
            console.error(error);
		    res.send(500,{'error':error});
        }	  
        if (user) {
		    res.send(409,{'error':'email already existed'});
        }
        else {
		    res.send(200,{'data':null});
        }
    });

}

app.get('/forgot-password', function(req, res, next){
    res.render('auth/forget-password', {title: 'Forgot Password' });
});

app.post('/forgot-password', function(req, res, next){
    var email = req.body.email;
    if (!email) {
	    return res.send(400,{'error':'email invalid'});
	}
	
    try {
       check(email).isEmail();
    } catch (e) {
	    console.log("check   email not valid  ".red,email);
       return res.send(400,{'error':'email invalid'});
    }

    userModel.findUserByQuery({email: email}, function (error, user) {
        if(error){
		    res.send(500,{'error':error});
		}
		else if(!user){
		    res.send(404,{'error':'user account not found'});
		}
		else if (user && user.password) {
          var name = user.username;
          var oldPasswordHash =  encodeURIComponent(user.password);
          var userId = user._id;
          var email = user.email;

          mail_api.sendForgetPasswordMail(name, email , 'token', function(error, response){
                        if(error){
                            console.log("sendForgetPasswordMail error ".red,error); // get error message
                            res.json(503,{'error':error});
                            return;							
                        }else{
                            console.log("sendForgetPasswordMail sent: ".green ,response.message);
                            res.json(200,{'data':null});
                            return;							
                        }				        
          });
        }
    });

});



app.get('/reset-password/:username/:token',  function(req, res, next){
    var username = req.params.username, token = req.params.token;
	
	var errors = [];
    if (!username) errors.push("username specified")
    if (!token) errors.push("Missing email")
    if (errors.length){
        res.statusCode = 400;
        res.end(JSON.stringify({errors:errors}));      
        return;    
	}	

    userModel.findUserByQuery({username: username,'token':token}, function (error, data) {
	    if (error || !data) {
            next(error);
        }
        else if (data ) {
         			  			   
               res.cookie('usernanme', data.username, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('ip',req.ip, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('last_login',new Date().getTime(), { expires: new Date(Date.now() + 9000001), httpOnly: true });			   
               res.cookie('auth',signed_auth, { expires: new Date(Date.now() + 9000001), httpOnly: true });
               res.cookie('uid', signed_uid, { expires: new Date(Date.now() + 9000001), httpOnly: true });
			   			   	       
                req.session.regenerate(function(){
                    req.session.uid = data._id;
                    req.session.username = data.username;
				
				    if(req.accepts('text/html')){
				       res.redirect('/');
				    }
				    else if(req.accepts('application/json')){	
			             console.log("json");
			             res.json(200,{ 'user':{'id':data._id,'username':data.username,'profile_picture':"http://www.androidhive.info/wp-content/themes/androidhive/images/ravi_tamada.png"}
					         ,'access_token':data._id});
			         }						        
                });
			   
        }

    });
 
});

/**
 *    sessions
 */
/**
function getAuth(req,res,next){
	  // This checks the current users auth
	console.log('get session  ....................................');
	  // It runs before Backbones router is started
	  // we should return a csrf token for Backbone to use
	if(typeof req.session.username !== 'undefined' && req.session.uid){
		
		  more hash authentication	 
		  userModel.findOneUser({'_id':req.session.uid}, function(err, user) {
			      if (user) {			      
			        next();
			      } else {
			        res.redirect('/sessions/new');
			      }
	     });
		 
	    res.send({auth: true, id: req.session.id, username: req.session.username, _csrf: req.session._csrf});
	  } 
	  else if (req.cookies.logintoken) {
		  userModel.authenticateFromToken(req);	  
	  } 
	  else {
	    res.send({auth: false, _csrf: req.session._csrf});
	    //	    res.redirect('/sessions/new');
	  }	
}


function isUserAdmin(user) {
  // Set admin
  var isAdmin = false;

  return isAdmin;
}

function createUserSession(req, res, user, next) {
  var isAdmin = false;
  // Create session
  req.session.user = {username:user.username, isAdmin:isAdmin, id:user._id, language:user.language, roles:user.roles};
  req.session.save(function (err) {
    next(err);
  });
}




app.post('/lost-password',forgetPassport);




app.get('/forgot', function (req, res, next) {
    if (req.session.uid) {
        res.redirect('/dashboard');
    } else {
        res.render('forgot', { "csrf":req.session._csrf, "message":req.flash('info') });
    }
});

//password reset //


function forgetPassport(req, res){

	        var email = req.body.email, name = req.body.name;
	        console.log(email+"    "+name);
// look up the user's account via their email //
			EM.dispatchResetPasswordLink({email:email,name:name}, function(e, m){
			// this callback takes a moment to return //
			// should add an ajax loader to give user feedback //
				if (!e) {
					res.send('ok', 200);
					console.log('send mail success');
				}	else{
					res.send('email-server-error', 400);
					for (k in e) console.log('error : ', k, e[k]);
				}
			});	
}

function isGlobalAdmin(req) {
    return (req.session.gadm);
}


*/

app.post('/sessions/pictures/',permissionAPI.authUser1, updateUserImageToFolder);
function updateUserImageToFolder(req,res,next){
//http://stackoverflow.com/questions/9844564/render-image-stored-in-mongo-gridfs-with-node-jade-express?rq=1
//https://github.com/cianclarke/node-gallery/tree/master/views
//http://stackoverflow.com/questions/3709391/node-js-base64-encode-a-downloaded-image-for-use-in-data-uri 
//http://pastebin.com/Gt1EWVWr  request iamge icon based64
//http://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working

	//console.log('updateUserImageToFolder'.green,req.files.image.path,req.files.qqfile.name);
	console.log("next okok".green,req.user);
	var user = req.user;
	var file;
	var img_path,img_name,img_type, img_size;
	if(req.files.image!=null) file = req.files.image; 
	else file = req.files.qqfile;
	img_path = file.path; img_name = file.name; img_type = file.type; img_size = file.size;

	console.log('updateUserImageToFolder'.green,img_path);
	/*
	var target_path = './public/useruploads/'+img_name;
	console.log(target_path);	
	fs.rename(img_path,target_path,function(err){
		if(err) {  next(err);}	
		else{	
			fs.readFile(target_path, "binary", function(error, file) {
			    if(error) {
				  res.send(JSON.stringify({success: false, error: err}), {'Content-Type': 'application/json'}, 200);
			    } else {
                  console.log('updateUserImageToFolder success111');
				  res.send({"success": true}, {'Content-Type': 'application/json'}, 200);
			    }
			})
		}				
	})*/

			    console.log('find user uid'.green,user._id,user.salt,user.username);				
				var	fileHash = crypto.createHash('md5').update(user.username).digest('hex');
	            var newFileName = (fileHash + img_type);
				
				if(user.img){
				    console.log('old image is ',user.img);
				    gridfs.deleteByID(user.img,function(err,result){					
					    if(err) next(err)
						else console.log('delete the old image'.green,user.img);
					})
				}
				
				gridfs.putFileWithID(img_path, newFileName, newFileName, {'content_type':img_type,'chunk_size':img_size,metadata: { "id": user._id}}, function(err1, result) {
                    
				    fs.unlink(img_path,function (err) {
                        if (err) throw err;
                        console.log('successfully deleted'.green,img_path);
                    });
					
					if(err1) return next(err1);					
					console.log('save image into gridid'.green,result._id,result.fileId,newFileName);
					// result is a large json document contains the image info as well as database information
					user.img =result.fileId;     // fileId is used since 2013.9.1
					//user.img = result._id;     // no longer used in the past
					
					user.save(function (err2) {
                            if (err2) //return next(err2); 
							{ 
							   console.log('user save the image path error '.red, err2);
							   res.send(JSON.stringify({success: false, error: err}), {'Content-Type': 'application/json'}, 200);
							} 
							else {
							    console.log('save user image',user.password,user.salt,user.img);
			                    //res.redirect("/settings/profile");
							    res.send({"success": true,img:user.img}, {'Content-Type': 'application/json'}, 200);
							}
                    });
				})	
}

				  /*
				  var base64data = new Buffer(file).toString('base64');
				  var imagesrc = util.format("data:%s;base64,%s", 'image/jpg', base64data);				  				  
			      res.writeHead(200, {"Content-Type": "image/png"});
			      res.write(file, "binary");
				  */


