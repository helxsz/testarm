var nodemailer = require('nodemailer'),
   	path = require('path'),
    fs = require('fs'),
    async = require('async'),
    color = require('colors'),
	ejs = require('ejs'),
	_ = require('underscore');
	
var config = require('../conf/config.js'),
    errors = require('../utils/errors'),
	winston = require('../utils/logging.js'); 

var MailSender = function(args){


    var SITE_ROOT_URL = "https://"+config.host;  //"http:localhost:8080"
	var SOURCE_EMAIL = config.email.user;
    var transport;
	
	args = args || {'transport':'gmail'};
   
    if(args.transport == 'aws'){
        // Create an Amazon SES transport object
        transport = nodemailer.createTransport("SES", {
            AWSAccessKeyID: "AWSACCESSKEY",
            AWSSecretKey: "/AWS/SECRET",
            ServiceUrl: "https://email.us-east-1.amazonaws.com" // optional
        });	
	}else if(args.transport == 'gmail'){	
       transport = nodemailer.createTransport("SMTP", {
            host: "smtp.gmail.com", // hostname
            secureConnection: true, // use SSL
            port: 465, // port for secure SMTP
            auth: {
                user: config.email.user,
                pass: config.email.pass
            }
        });	
	}
   



    var sendTemplateEmail = function(email, subject, template, object, callback){	    
        var compiled = ejs.compile(fs.readFileSync(path.join(__dirname, '../views', 'email_templates',template), 'utf8'));
        var html = compiled(object); 				
	    transport.sendMail({from: SOURCE_EMAIL, to: email, subject: subject, html: html}, callback); 
	}
	
	// email for the test
	
	var sendTestEmail = function(email, obj , callback){
	    sendTemplateEmail(email,'test email','test.html',obj, callback); 
	}
	

	//  email for the account 
	var sendAccountRegistrationEmail  = function(email, user, callback){
	    _.extend( user, {});
	    sendTemplateEmail(email,'Account Registration','account_registration.html',user, callback); 
	}
	
	var sendAccountPasswordResetEmail = function(email, user, callback){
	     _.extend( user, {});
	    sendTemplateEmail(email,'Account Password Reset','account_reset.html',user, callback); 
	}
	
	var sendAccountActiviationEmail = function(email, user, callback){
	     _.extend( user, {});
	    sendTemplateEmail(email,'Account Activiation','account_activiation.html',user, callback);		
	}
	
 	var sendAccountInvitationEmail = function(email ,user, callback){
	     _.extend( user, {});
	    sendTemplateEmail(email,'Account Invitation','account_invitation.html',user, callback);	
	}	
	
	// email for the course 
	var sendCourseJoinEmail = function(email, user, course, callback){
	     _.extend( user, course);
	    sendTemplateEmail(email,'Course Join','course_join.html',user, callback);	
	}
	
	var sendCourseNewContentEmail = function(email ,user, course, callback){
	     _.extend( user, course);
	    sendTemplateEmail(email,'Course Update','course_update.html',user, callback);		
	}
	
	var sendCourseNewCommentEmail = function(email ,user, course, callback){
	     _.extend( user, course);
	    sendTemplateEmail(email,'New Comment','course_new_comment.html',user, callback);		
	}
	
 	var sendCourseInvitationEmail = function(email ,user, course, callback){
	     _.extend( user, course);
	    sendTemplateEmail(email,'Course Invitation','course_invitation.html',user, callback);		
	} 

 	var sendCourseRecommendationEmail = function(email ,user, course, callback){
	     _.extend( user, course);
	    sendTemplateEmail(email,'Course Recommendation','course_recommendation.html',user, callback);		
	}	

    return {
	    sendTestEmail:sendTestEmail,
		
	    sendAccountRegistrationEmail :sendAccountRegistrationEmail,
		sendAccountPasswordResetEmail: sendAccountPasswordResetEmail,
		sendAccountActiviationEmail :sendAccountActiviationEmail,
		sendAccountInvitationEmail :sendAccountInvitationEmail,
		
		sendCourseJoinEmail :sendCourseJoinEmail,
		sendCourseNewContentEmail :sendCourseNewContentEmail,
		sendCourseNewCommentEmail :sendCourseNewCommentEmail,
		sendCourseInvitationEmail :sendCourseInvitationEmail,
		sendCourseRecommendationEmail : sendCourseRecommendationEmail
	}	
}

var emailAPI = new MailSender(); 
module.exports = emailAPI;

/****  testing   
emailAPI.sendTestEmail('xi@redninja.co.uk',{ title : 'waht the fuck ', text : 'who are you , hello world' },function(err,data){
    if(err){
	    winston.debug('error sending the email '+err)
	}else{
	    winston.debug('sending the test email successfully '+ JSON.stringify( data ));
	}
});
*****/