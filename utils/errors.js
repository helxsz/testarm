//http://dustinsenos.com/articles/customErrorsInNode
// http://c089.wordpress.com/2013/01/20/node-js-custom-error-classes-without-the-pain/
/****

Server Error

1. Password or Username Not Valid
2. User name already Existed
3. Email already registered 

4. User Not Found
5. Course Not Found

6. Upload image too big
7. Upload image in wrong format



*****/


var util = require('util'), errors;
 
// A list of error classes to generate.
errors = [ 'DatabaseError','AuthenticationError'];
 
// Abstract Error
function AbstractError(msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
}
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';
 
// Generate error classes based on AbstractError
errors.forEach(function (errorName) {
  var errorFn = exports[errorName] = function (msg) {
    errorFn.super_.call(this, msg, this.constructor);
  };
  util.inherits(errorFn, AbstractError);
  errorFn.prototype.name = errorName;
});

exports.error_code = { 
    
	AUTHENTICATION_INVALID: 100,
	USERNAME_EXISTED:101,
    EMAIL_EXISTED:102,
	PASSWORD_TOO_INVALID:103,
	USER_PROFILE_IMAGE_WRONG_FORMAT:104,
	USER_PROFILE_IMAGE_LARGE_SIZE:105,
    
	USERNAME_NOT_FOUND: 130,
	USERID_NOT_FOUND:131,
	COURSEID_NOT_FOUND:132
	

};


function generateId(){
    var S4 = function () {
         return (((1 + Math.random()) * 0x10000) | 
                                     0).toString(16).substring(1);
     };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" +
                S4() + "-" + S4() + S4() + S4());
}