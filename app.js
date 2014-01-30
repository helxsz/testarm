var fs = require('fs'),              
    express = require('express'),
    http = require('http'),
    domain = require('domain'),
    crypto = require('crypto'),
    https = require('https'),
    passport = require('passport'),    
    ejs =  require('ejs'),
    path = require('path'),
	colors = require('colors'),
    mongoose = require('mongoose'),
	GridStore = mongoose.mongo.GridStore,
    db = mongoose.connection.db;;
	
var config = require('./conf/config.js'),
    app = express(),
    https_server;   
    webdir = '/web',
    mobiledir = '/mobile';  

var sessionStore;
function configSessionStore(){
    var redisClient = require("redis").createClient(config.redis.port,config.redis.host)
    redisClient.auth(config.redis.auth, function(result) {
	    winston.info("Redis authenticated.".green);  
    });
    redisClient.on("error", function (err) {  
        winston.error("redis Error " + err.red);  
        return false;  
    });    
    redisClient.on('connect',function(err){
	    winston.info('redis connect success'.green);
    });
    var RedisStore  = require("connect-redis")(express);
    sessionStore = new RedisStore({  client:redisClient  });
	return sessionStore;
}

var winston
function configLogging(){
	winston = require('./utils/logging.js');
}
configLogging();



//  allowed cross domain
var allowCrossDomain = function(req, res, next) {
  // WARNING - Be careful with what origins you give access to
  var allowedHost = [
    'http://localhost',
    'http://readyappspush.herokuapp.com/',
    'http://shielded-mesa-5845.herokuapp.com/'
  ];

  if(allowedHost.indexOf(req.headers.origin) !== -1) {
    //res.header('Access-Control-Allow-Max-Age', maxAge);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    next();
  } else {
    res.send(404);
  }
};



if (process.env.NODE_ENV == 'production'){
   //winston.info('on production env', config.port);
}else if(process.env.NODE_ENV == 'development'){
   //winston.info('on development env');
}else {
   //winston.info('there is nothing about it'.yellow); //,   process.env.NODE_ENV,process.env
}

app.configure('development',function(){
	app.set('db-uri',config.mongodb_development);
    app.use(express.static(__dirname+'/static'));
    app.use(express.static(__dirname+'/weibo'));	
    app.use(express.static(__dirname+'/public'));
	
	app.use(webdir, 	express.static(__dirname+webdir));
	app.use(mobiledir,	express.static(__dirname+mobiledir));
	winston.info('app on development'.yellow,config.port);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	config.port = 8080;
});

app.configure('production',function(){
	app.set('db-uri',config.mongodb_production);
	winston.info('app on production'.yellow, config.port);
	app.use(express.errorHandler())
});

app.configure(function(){

    app.engine('.html', ejs.__express);
    app.set('view engine', 'html');
	app.set('views',__dirname+'/views');
	app.set('ejs',ejs);	
    app.disable('x-powered-by');
	app.use(express.favicon(__dirname + '/public/favicon.ico'));	
    app.use(express.compress({
        filter: function (req, res) {
         return /json|text|javascript|css/.test(res.getHeader('Content-Type'));
        },
        level: 9
    })); 	
	
	app.use(express.bodyParser({uploadDir:__dirname+'/public/uploads',keepExtensions: true,limit: '50mb'}));
	app.use(express.methodOverride());
	app.use(express.cookieParser());
    app.use(express.session({ 
					  cookie: { maxAge: 24 * 60 * 60 * 1000 }
    	              ,store: configSessionStore()
    	              ,secret: config.sessionSecret
					  ,key: 'express.sid'
					  ,clear_interval: 3600
    }));
	
    //var access_logfile = fs.createWriteStream('./access.log',{flags:'a'});
	//app.use(express.logger({stream:access_logfile,format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms'}));	
	
    if (config.logRESTRequests) {
        app.use(function(req, res, next){
                winston.info(req.method + ' ' + req.url);
                next();
        });
    }
		
    //app.use(express.csrf()); 
	app.use(conditionalCSRF);
    app.use(function(req, res, next){
      res.locals.token = req.session._csrf;
	  res.locals.year = new Date().getFullYear();
      next();
    });
   
    app.use(passport.initialize());
    app.use(passport.session());	  
		
	// put at last	
	app.get('/version', function(req, res) {
        res.send('0.0.1');
    });	

	// error handling 
    app.use(logErrors);
    app.use(clientErrorHandler);
    app.use(errorHandler); 

    app.use(function (req,res, next) {
        var d = domain.create();
        d.on('error', function (err) {
          winston.error(err);
          res.statusCode = 500;
          res.json({sucess:false, messag: 'error in the server'});
          d.dispose();
        });
        d.add(req);
        d.add(res);
        d.run(next);
    });	
   
    //http://stackoverflow.com/questions/10697660/force-ssl-with-expressjs-3	
	app.use(function(req, res, next) {
       if(!req.secure) {
	      //console.log('not secure'.red,req.headers.host,req.get('Host'),req.url);
          //return res.redirect('https://' + req.get('Host') + req.url);
        }
		//console.log('secure '.green);
        next();
    });
	app.set('trust proxy', true);
	
	app.use(app.router);	
    app.use(function(req, res, next){
        res.status(404); 
        if(req.xhr){
            res.send({ error: 'Not found' });
            return;		
		}		
        if (req.accepts('html')) {
            res.render('error/404', { url: req.url });
            return;
        }
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }
    });	
});

function conditionalCSRF(req, res, next) {
/*https://github.com/balderdashy/sails/blob/master/lib/hooks/csrf/index.js */
  //compute needCSRF here as appropriate based on req.path or whatever
 var ua = req.header('user-agent');
 //console.log(ua);
 
  if (ua.indexOf("android") == -1) {
    //console.log('in csrf');
    express.csrf();
	next();
  } else {
    //console.log('no csrf');
    next();
  }
  
  //express.csrf();
  
}


/******************************************
           error handling   logging
*******************************************/
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  winston.error(err.stack);
  if (req.xhr) {
    winston.error('send error to the client in json'.red,err);

    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error/500', { error: err });
}

/*
var DeviceHandler = require('./routes/beta_api');
var handlers = {
  device: new DeviceHandler(),
};
var routes = require('./routes/beta_api');
routes.setup(app, handlers);
exports.setup = setup;

function setup(app, handlers) {
        app.post('/api/profiles', handlers.account.createAccount);
        app.get('/api/profiles/:username', handlers.account.getAccount);
}

*/



var startServer = function() {
    if (!module.parent) {
        if(app){
			winston.info("the port used ".yellow, config.port);
	        app.listen(config.port,'0.0.0.0',function(){
                winston.info("Express started on port".yellow, config.port);				
	        });
       }else{
            winston.error("\r\ terminated ...\r\n".grey);
            process.exit();
        }
    }
}

var startSSLServer = function(){
	   var options = {
        key: fs.readFileSync('./conf/server.key').toString()
        ,cert: fs.readFileSync('./conf/server.crt').toString()
        ,requestCert: true
        ,rejectUnauthorized: false
		,passphrase: "1027"
      };
	   
      https_server = https.createServer(options,app).listen(443, '0.0.0.0', function(){
            winston.info("Express server listening on port ".green + 433);
			var websocket = require('./routes/websocket_api');
			websocket.initWebsocket(https_server);
      });	  
}


startServer();
exports.https_server = https_server;
exports.sessionStore = sessionStore;

/******************************************
           terminate the server
*******************************************/
app.on('close', function () {
  console.log("Closed app".red);
  mongoose.connection.close();
});
//  terminator === the termination handler.
function terminator(sig) {
   if (typeof sig === "string") {
      winston.info('%s: Received %s - terminating Node server ...',Date(Date.now()), sig);                 
      process.exit(1);
	  app.close();
   }
   winston.info('%s: Node server stopped.'.red, Date(Date.now()) );
}

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});
var util = require("util");
// Don't crash on errors.
process.on("uncaughtException", function(error) {
  util.log("uncaught exception: ".red + error);
  util.log(error.stack);
  winston.error(error.stack.toString());
});

/*********************************************

        mongoose mongodb

**********************************************/

// mongodb mongoose
//mongoose.connect(config.mongodb.connectionString || 'mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +'/' + config.mongodb.database);
//mongoose.createConnection('localhost', 'database', port, opts);


var opts = { server: { auto_reconnect: false,poolSize: 10 }, user: '', pass: '',replset: { strategy: 'ping', rs_name: 'testSet' } }
var database_error = null;

mongoose.connect(config.mongodb_development,opts,function(err){
	if(err) { 
	    winston.error('connect mongodb error'.red,err);
		database_error = err;
		if(err.name == 'MongoError' && err.code == 18 && err.errmsg == 'auth fails'){
		/*
	        mongoose.connection.db.authenticate(config.mongodb.user, config.mongodb.password, function(err) {
	            
	        } )
	     */   		   
		}else{
		    onConnectUnexpected(err);
		}	
	}
	else winston.info('mongodb connect success');
});

mongoose.connection.on('open', function (err) {
      if (reconnTimer) { clearTimeout(reconnTimer); reconnTimer = null; }
      winston.info('connection opening');

});


/****************************
   mongoose retry
   https://gist.github.com/taf2/1058819
****************************/
var reconnTimer = null;
 /*  tryReconnect -> onConnectUnexpected  -> disconnected callback  */
function tryReconnect() {
    reconnTimer = null;
    winston.warm("try to connect: %d".grey, mongoose.connection.readyState);
    db = mongoose.connect(config.mongodb_development,function(err){
	    if(err) {
	        winston.error('connect mongodb error'.red,err);
		    onConnectUnexpected(err);
	    }
	    else winston.log('mongodb connect success'.green,mongoose.connection.readyState);
  });
}


function onConnectUnexpected(error){
		var reportAPI = require('./routes/report_api');
		reportAPI.reportToAdmin('cannot connect to mongodb '+error,function(err,data){
	           if(err) { console.log('can not send problem report mail ',err); }
	           else { console.log('send problem report mail successfully'.green); }		
		})
}

mongoose.connection.on('opening', function() {
  console.log("reconnecting... %d".red, mongoose.connection.readyState);
});

mongoose.connection.on('connecting', function (err) {

});

mongoose.connection.on('disconnecting', function (err) {
   console.log('mongodb disconnecting'.red,err);
});

mongoose.connection.on('disconnected', function (err) {
    console.log('mongodb disconnected'.red,err);
	if(err == null)  err = database_error;
    if(err){
        if(err.name == 'MongoError' && err.code == 18 && err.errmsg == 'auth fails'){
        
		}else{
		    reconnTimer = setTimeout(tryReconnect, 5000); 
		}
    }
});

mongoose.connection.on('close', function (err) {
  mongoose.connection.readyState = 0; // force...
  mongoose.connection.db.close(); // removeAllListeners("reconnect");
   
});

mongoose.connection.on('reconnected', function (err) {

});

mongoose.connection.on('error', function (err) {
    console.error(err);
});

/*******************************************
 mongodb close
********************************************/

function done (err) {
  if (err) console.error(err.stack);
  mongoose.connection.db.dropDatabase(function () {
    mongoose.connection.close();
  });
}



///////////////////////////////////////////////////// 
exports.app = app;
exports.GridStore = GridStore;


bootControllers(app,__dirname + '/routes');
// Bootstrap controllers
function bootControllers(app,route) {
	fs.readdir(route, function(err, files){
		if (err) throw err;
		files.map(function (file) {
            return path.join(route, file);
        }).filter(function (file) {
            return fs.statSync(file).isFile();
        }).forEach(function (file) {         
			var i = file.lastIndexOf('.');
            var ext= (i < 0) ? '' : file.substr(i);
			if(ext==".js")
			bootController(app, file);	
        });
	});
}


function bootController(app, file) {
	var name = file.replace('.js', '');
	require( name);				
}
