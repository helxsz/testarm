var async = require('async'),
    fs = require('fs'),
    colors = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
    crypto = require('crypto');	
     _=require('underscore'),
    moment = require('moment'),
	socket = require('socket.io'),
	request = require('request');	
	
var errors = require('../utils/errors'),
	config = require('../conf/config'),
	winston = require('../utils/logging.js');

var io = socket.listen(3000 
    /*,
	{ logger: {
        debug: winston.debug, 
        info: winston.info, 
        error: winston.error, 
        warn: winston.warn
    }
   }*/
);
io.configure(function () {
        winston.info('web socket io configure'.green);   
      	io.set('log level', 1);
	    //setStore(io);	
	    io.enable('browser client minification');  // send minified client
        io.enable('browser client etag');          // apply etag caching logic based on version number
        io.enable('browser client gzip'); 
	    io.set('heartbeat interval', 45);
    	io.set('heartbeat timeout', 120); 
    	io.set('polling duration', 20);
	
        io.set('close timeout', 60*60*24); // 24h time out
    	io.set('transports', [
            'websocket', 'xhr-polling'
            //'xhr-polling' // for benchmarking
       ]);	
});
io.sockets.on('connection', function (socket) {
    console.log('socket connected');
	socket.emit('connect');
	
	io.sockets.emit('mqtt',
           {   'topic'  : 'aaa',
              'payload' : 'ccc'
           }
        );
	
    /*
    socket.on('subscribe', function (data) {
        mqttclient.subscribe(data.topic);
    });
    */
});

module.exports = io;