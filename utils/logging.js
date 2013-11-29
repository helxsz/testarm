var winston = require('winston'),
    config = require('../conf/config.js');
  
function traceCaller(n) {
    if( isNaN(n) || n<0) n=1;
    n+=1;
    var s = (new Error()).stack
      , a=s.indexOf('\n',5);
    while(n--) {
      a=s.indexOf('\n',a+1);
      if( a<0 ) { a=s.lastIndexOf('\n',s.length); break;}
    }
    b=s.indexOf('\n',a+1); if( b<0 ) b=s.length;
    a=Math.max(s.lastIndexOf(' ',b), s.lastIndexOf('/',b));
    b=s.lastIndexOf(':',b);
    s=s.substring(a+1,b);
    return s;
}

function init(){
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {'timestamp':true});
    var logger_info_old = winston.info;
        winston.info = function(msg) {
        var fileAndLine = traceCaller(1);
        return logger_info_old.call(this, fileAndLine + ":" + msg);
    }
	return winston;
}


var config = {
  levels: {
    silly: 0,
    verbose: 1,
    info: 2,
    data: 3,
    warn: 4,
    debug: 5,
    error: 6
  },
  colors: {
    silly: 'magenta',
    verbose: 'cyan',
    info: 'green',
    data: 'grey',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  }
};

var logger = new (winston.Logger)({
  transports : [new (winston.transports.Console)({
    json : false,
    timestamp : true,
	colorize: true
  }), new winston.transports.File({
    filename : __dirname + '/debug.log',
    json : true
  })]
  ,exitOnError : false
  /**/
  ,exceptionHandlers : [new (winston.transports.Console)({
    json : false,
    timestamp : true,
	colorize: true
  }), new winston.transports.File({
    filename : __dirname + '/exceptions.log',
    json : false
  })]  
  ,levels: config.levels
  ,colors: config.colors
  
});

logger.remove(winston.transports.Console);
logger.add(winston.transports.Console, {'timestamp':true});
var logger_info_old = winston.info;
var logger_error_old = winston.error;

var logger_warm_old = winston.warm;
logger.info = function(msg) {
    var fileAndLine = traceCaller(1);
	//console.log("fineAndLine",fileAndLine, "    "+msg);  new Date()+":"+
    return logger_info_old.call(this, fileAndLine + ":" + msg);
}
logger.error = function(msg) {
    var fileAndLine = traceCaller(1);
	//console.log("fineAndLine",fileAndLine, "    "+msg);
    return logger_error_old.call(this, new Date()+":"+fileAndLine + ":" + msg);
}

/*
var logger_data_old = winston.data;
var logger_warm_old = winston.warm;
logger.data = function(msg) {
    var fileAndLine = traceCaller(1);
    return logger_data_old.call(this, new Date()+":"+fileAndLine + ":" + msg);
}
logger.warm = function(msg) {
    var fileAndLine = traceCaller(1);
    return logger_warm_old.call(this, new Date()+":"+fileAndLine + ":" + msg);
}
*;

/*	
logger.info("abc");	
//logger.data("abc");
logger.warn("abc");
logger.debug("abc");
logger.error("abc");
*/
module.exports = logger;
//exports.init = init; 	