/***
   still to do   
   Different transport methods -  Amazon SES
   the problem of behind of proxy -- https://github.com/andris9/Nodemailer/issues/176
****/


var emailer = require('nodemailer'),
   	path = require('path'),
    fs = require('fs'),
    async = require('async'),
    color = require('colors'),
	ejs = require('ejs'),
	_ = require('underscore');
	
var config = require('../conf/config.js'),
    errors = require('../utils/errors'),
	gridfs = require("../utils/gridfs"),
	winston = require('../utils/logging.js'); 

var SITE_ROOT_URL = "https://"+config.host;  //"http:localhost:8080"
var smtpTransport = emailer.createTransport("SMTP", {
    host: "smtp.gmail.com", // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

/*

*/

//sendActiveMail('584829839@qq.com','token','name');
//sendResetPassMail('584829839@qq.com','token','name');
//sendTestMail('xi@redninja.co.uk',function(err,data){});

// http://stackoverflow.com/questions/15201724/how-can-i-pass-variable-to-ejs-compile
function renderTemplate(file,value){ 	
    var compiled = ejs.compile(fs.readFileSync(path.join(__dirname, '../views', 'email_templates',file), 'utf8'));
    var html = compiled(value);   	
    return html;	
}











function sendTestMail(email, callback){
   var from = config.email.user;
   var to = email;
   var subject = 'Feynlabs Test';
   
   var html = renderTemplate('test.html',{ title : 'EJS', text : 'Hello, World!' });
   
   console.log('..........',html);
   sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);    

}
exports.sendTestMail = sendTestMail;






exports.sendActiveMail = sendActiveMail;
exports.sendResetPassMail = sendResetPassMail; 
exports.sendMail = sendMail;
exports.sendInvitationMail = sendInvitationMail;
exports.sendRegistraionMail = sendRegistraionMail;
exports.sendForgetPasswordMail = sendForgetPasswordMail;

exports.sendProblemReportMail = sendProblemReportMail;

// email template  http://net.tutsplus.com/tutorials/html-css-techniques/the-state-of-css3-in-email-templates/
// http://htmlemailboilerplate.com
function sendInvitationMail(url, description,tutor,mail,callback){
  var from = config.email.user;
  var to = mail;
  var subject = 'Feynlabs Invitation';
  winston.debug('sendInvitationMail'.green,from, to , subject);
  //course/:id/invitation/:token/reply			
			
    html = 
	       '<table cellpadding="0" cellspacing="0" style="width:600px;color: #f5290a;">'
            +'<tbody style="font-size:16px;color:#333333">'
			    +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"><img src="https://www.feynlabs.com/wp-content/themes/globex/feynlabs/images/headerimage.jpg" alt="Blog Post"></td></tr>'
                +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"> '                  
                       +'Hi,'
                        +'<br><br> We are happy to see you are signing up <span style="font-size:20px;color:#33ccff;"> <a href="https://Feynlabs.com" style="font-size:24px;font-weight:bold;color:#33ccff;text-decoration:none" target="_blank">   Feynlabs  </a></span> . To ensure your Recipes remain active, please confirm your account:<br><br><br><br>'
                        +'<a href="' + SITE_ROOT_URL + url +'" style="text-decoration:none;padding:18px 48px 18px 48px;font-size:24px;font-weight:bold;color:#ffffff;background-color:#33ccff;border-radius:34px" target="_blank">Confirm your account</a>'
                        +'<br><br><br><br>'
				        +'The <span class="il">Feynlabs</span> Team'				    
				+'</td></tr>'
                +'<tr> <td style="border-bottom:1px solid #ebebeb"><br><br><br></td></tr> <tr> <td style="font-size:16px"> <br> </td> </tr>'                 
                +'<tr> <td>'
                        +'<table cellpadding="0" cellspacing="0" style="width:600px">  <tbody style="font-size:16px;font-family:"Helvetica Neue,Arial,Helvetica,sans-serif";color:#333333">'                      
                           +'<tr><td style="font-size:18px;font-weight:normal;color:#333333;line-height:1.6" width="270px">'
                                +'<a href="https://feynlabs.com" style="font-size:24px;font-weight:bold;color:#333333;text-decoration:none" target="_blank"> <img src="http://www.feynlabs.com/wp-content/uploads/2012/11/logo.png" alt="Blog Post"> </a>'
                                +'<br> Concepts of programming lanuage for kids.'                                          
                            +'</td>'                                             
                            +'<td align="right" style="font-size:16px;color:#333333;padding-top:5px"></td>'
                           +'</tr>'
                        +'</tbody> </table>'                       
                  +'</td> </tr> </tbody> </table>'
			
  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
	/*,
	attachments:[
        {
            filename: "notes.txt",
            contents: "Some notes about this e-mail"
        },
        {
            filename: "image.png",
            contents: new Buffer("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/"+
                                 "//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U"+
                                 "g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC", "base64"),
            cid: "abc"
        }
	]*/
  },callback);   

}


function sendRegistraionMail(username,mail,callback){
    var from = config.email.user;
    var to = mail;
    var subject = 'Feynlabs Registraion';
  
    winston.debug('sendRegistraionMail'.green, from,to,subject);
    //course/:id/invitation/:token/reply
			
    html = 
	       '<table cellpadding="0" cellspacing="0" style="width:600px;color: #f5290a;">'
            +'<tbody style="font-size:16px;color:#333333">'
			    +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"><img src="https://www.feynlabs.com/wp-content/themes/globex/feynlabs/images/headerimage.jpg" alt="Blog Post"></td></tr>'
                +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"> '                  
                       +'Hi,'+username
                        +'<br><br> We are happy to see you are signing up <span style="font-size:20px;color:#33ccff;"> <a href="https://Feynlabs.com" style="font-size:24px;font-weight:bold;color:#33ccff;text-decoration:none" target="_blank">   Feynlabs  </a></span> . To ensure your Recipes remain active, please confirm your account:<br><br><br><br>'
                        +'<a href="' + SITE_ROOT_URL +'" style="text-decoration:none;padding:18px 48px 18px 48px;font-size:24px;font-weight:bold;color:#ffffff;background-color:#33ccff;border-radius:34px" target="_blank">Confirm your account</a>'
                        +'<br><br><br><br>'
				        +'The <span class="il">Feynlabs</span> Team'				    
				+'</td></tr>'
                +'<tr> <td style="border-bottom:1px solid #ebebeb"><br><br><br></td></tr> <tr> <td style="font-size:16px"> <br> </td> </tr>'                 
                +'<tr> <td>'
                        +'<table cellpadding="0" cellspacing="0" style="width:600px">  <tbody style="font-size:16px;font-family:"Helvetica Neue,Arial,Helvetica,sans-serif";color:#333333">'                      
                           +'<tr><td style="font-size:18px;font-weight:normal;color:#333333;line-height:1.6" width="270px">'
                                +'<a href="https://feynlabs.com" style="font-size:24px;font-weight:bold;color:#333333;text-decoration:none" target="_blank"> <img src="http://www.feynlabs.com/wp-content/uploads/2012/11/logo.png" alt="Blog Post"> </a>'
                                +'<br> Concepts of programming lanuage for kids.'                                          
                            +'</td>'                                             
                            +'<td align="right" style="font-size:16px;color:#333333;padding-top:5px"></td>'
                           +'</tr>'
                        +'</tbody> </table>'                       
                  +'</td> </tr> </tbody> </table>'
			
  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);   
}

function sendForgetPasswordMail(username,mail,token,callback){
    var from = config.email.user;
    var to = mail;
    var subject = 'Password Retrival';
  
    winston.debug('sendRegistraionMail'.green, from,to,subject);
			
    html = 
	       '<table cellpadding="0" cellspacing="0" style="width:600px;color: #f5290a;">'
            +'<tbody style="font-size:16px;color:#333333">'
			    +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"><img src="https://www.feynlabs.com/wp-content/themes/globex/feynlabs/images/headerimage.jpg" alt="Blog Post"></td></tr>'
                +'<tr><td style="font-size:16px;color:#333333;line-height:1.0"> '                  
                       +'Hi,'+username
                        +'<br><br>  To get you new password:<br><br><br><br>'
                        +'<a href="' + SITE_ROOT_URL +'/reset-password/'+username+'/'+token+'" style="text-decoration:none;padding:18px 48px 18px 48px;font-size:24px;font-weight:bold;color:#ffffff;background-color:#33ccff;border-radius:34px" target="_blank">Confirm your account</a>'
                        +'<br><br><br><br>'
				        +'The <span class="il">Feynlabs</span> Team'				    
				+'</td></tr>'
                +'<tr> <td style="border-bottom:1px solid #ebebeb"><br><br><br></td></tr> <tr> <td style="font-size:16px"> <br> </td> </tr>'                 
                +'<tr> <td>'
                        +'<table cellpadding="0" cellspacing="0" style="width:600px">  <tbody style="font-size:16px;font-family:"Helvetica Neue,Arial,Helvetica,sans-serif";color:#333333">'                      
                           +'<tr><td style="font-size:18px;font-weight:normal;color:#333333;line-height:1.6" width="270px">'
                                +'<a href="https://feynlabs.com" style="font-size:24px;font-weight:bold;color:#333333;text-decoration:none" target="_blank"> <img src="http://www.feynlabs.com/wp-content/uploads/2012/11/logo.png" alt="Blog Post"> </a>'
                                +'<br> Concepts of programming lanuage for kids.'                                          
                            +'</td>'                                             
                            +'<td align="right" style="font-size:16px;color:#333333;padding-top:5px"></td>'
                           +'</tr>'
                        +'</tbody> </table>'                       
                  +'</td> </tr> </tbody> </table>'
			
  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);   
}


function sendProblemReportMail(who, problem ,callback) {
  var from = config.email.user;
  var to = who;
  var subject = 'Problem Reports';
  var html = '<h2>Problem<h2/>' +
    '<p>we receive a server error message </p>' +
    '<p><span>Problem:</span>'+  problem +' </p>' +
    '<p> Please fix the problem as soon as possible</p>';

  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);
};

function sendActiveMail(who, token, name,callback) {
  var from = config.email.user;
  var to = who;
  var subject = config.name + 'account activation';
  var html = '<p>hello£º<p/>' +
    '<p>we receive ' + config.name + ' the message for registration, please click the link£º</p>' +
    '<a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '">activation link</a>' +
    '<p>if you haven t' + config.name + 'fill in the form£¬please delete the mail, we are sorry for that¡£</p>' +
    '<p>' + config.name + 'thank you</p>';

  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);
};




function sendResetPassMail(who, token, name,callback) {
  var from = config.email.user;
  var to = who;
  var subject = config.name + 'account reset';
  var html = '<p>hello£º<p/>' +
    '<p>we receive ' + config.name + ' the message for reset please click the link£º</p>' +
    '<a href="' + SITE_ROOT_URL + '/reset_pass?key=' + token + '&name=' + name + '">reset link</a>' +
    '<p>if you haven t' + config.name + 'fill in the form£¬please delete the mail, we are sorry for that¡£</p>' +
    '<p>' + config.name + 'thank you</p>';

  sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  },callback);
};

function sendMail(mailOpts,callback){
    // send mail with defined transport object
    smtpTransport.sendMail(mailOpts, callback); 
}

