var winston = require('winston');
// http://www.snyders.co.uk/2013/04/11/async-logging-in-node-js-just-chill-winston/
// http://codeplease.wordpress.com/2013/03/19/node-js-logger-winston/
// http://senecacd.wordpress.com/2013/03/18/node-js-real-time-logging-with-winston-redis-and-socket-io-p1/
// http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/
// https://npmjs.org/package/winston-google-spreadsheet
var Logging = function(level){

    this.level = level || 'info';

    if (Logging.prototype._singletonInstance) {
        return Logging.prototype._singletonInstance;
    }
    Logging.prototype._singletonInstance = this;
	
	this.getLogger = function() {
        return logger;
    }
    var log = {
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
	        colorize: true,
	        level: this.level 
        })
        , new winston.transports.File({
            filename : __dirname + '/debug.log',
	        maxsize: 1024 * 1024 * 10, // 10MB
            json : true,
	        level: 'debug' 
        })
        ]
        ,exitOnError : false
        ,exceptionHandlers : [new (winston.transports.Console)({
             json : false,
             timestamp : true,
	         colorize: true
        }), new winston.transports.File({
             filename : __dirname + '/exceptions.log',
			 maxsize: 1024 * 1024 * 10, // 10MB
             json : false
        })]
        //,levels: log.levels
        ,colors: log.colors 
    });

	
/*
    var logger_info_old = logger.info;
    logger.info = function(msg) {
        var fileAndLine = traceCaller(1);
        return logger_info_old.call(this, fileAndLine + ":" + msg);
    }
	
    var logger_error_old = logger.error;
    logger.error = function(msg) {
        var fileAndLine = traceCaller(1);
        return logger_error_old.call(this, new Date()+":"+fileAndLine + ":" + msg);
    }
	
    var logger_debug_old = logger.debug;
    logger.debug = function(msg) {
        var fileAndLine = traceCaller(1);
        return logger_debug_old.call(this, new Date()+":"+fileAndLine + ":" + msg);
    }
*/    
    function traceCaller(n) {
        if( isNaN(n) || n<0) n=1;
        n+=1;
        var s = (new Error()).stack , a=s.indexOf('\n',5);
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
}

module.exports = new Logging('debug').getLogger(); 

