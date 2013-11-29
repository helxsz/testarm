module.exports = {
    name:'Feynlabs',
    sessionStore:'mongodb://localhost/sessionStore/arm',
	sessionSecret: '076ee61d63aa10a125ea872411e433b9',
	port:61350,
	uri: 'http://localhost:8080', // Without trailing /
	host: 'localhost',
    redis: {
        host: 'localhost',
        port: 6379
    },
    mongodb_production: 'mongodb://localhost/arm_production',
    mongodb_development: 'mongodb://localhost/arm_development',
    socketio: {
        level: 2
    },
	environment: (process.env.NODE_ENV !== 'production') ? 'development' : 'production',
	selenium : {
		testtimeout : 60000
	},	
	db:{
      db: 'myDb',
      host: '192.168.1.111',
      port: 6646,  // optional, default: 27017
      username: 'admin', // optional
      password: 'secret', // optional
      collection: 'mySessions' // optional, default: sessions
    },
    logging:{
        console:{
        enabled:true,
        level:"info",
        timestamp:true,
        colorize:true
    },
    file:{
        enabled:false,
        level:"info",
        filepath:"logs/calipso.log",
        timestamp:true
        }
    },
	demo:{
	     enabled: true,
         user: 'demo',
         password: 'demo'
	},
    email:{
         user:"feynlabs.uk@gmail.com"
        ,pass:"newstartup"
        ,name:"Feynlabs"	
	},
    /*
	github: {
       clientID: '30c930492a8218b78db8',
       clientSecret: '772869bd93d91b690cc00368a9e32c6e86f986a6',
	   callbackURL:'https://127.0.0.1//auth/github/callback'
    },
    */
	// https://github.com/settings/applications/60130
	github: {
       clientID: '536f1716d3af679c69c4',
       clientSecret: '26d5ba1d833552bf2acabe4b02db99a79142daec',
	   callbackURL:'http://127.0.0.1:3000/auth/github/callback'
    },	
	// https://developers.facebook.com/apps/663584603654022/summary?save=1
	facebook: {
       clientID: '663584603654022',
       clientSecret: '9e3e97b6b5d4135312bb5e9696ac8467',
	   callbackURL:'http://127.0.0.1:3000/auth/facebook/callback'
    },
	// https://dev.twitter.com/apps/5133885/show
    twitter: {
       clientID: 'k5xM8PXGt9W8WaJTXuSBHw',
       clientSecret: 'ccin9xCcVTUTDk7ptHOr22IrfLYgpubYltUnJWW2Vk',
	   callbackURL:'http://127.0.0.1:3000/auth/twitter/callback'
    },
    google: {
       clientID: 'APP_ID',
       clientSecret: 'APP_SECRET',
	   callbackURL:'/auth/google/callback'
    },
	// https://www.dropbox.com/developers/apps/info/hzgdwykknvbpiyz     feynlabs.uk
    dropbox:{
       clientID: 'hzgdwykknvbpiyz',
       clientSecret: 'obxt2nq1r09ue6s',
	   callbackURL:'http://127.0.0.1:3000/auth/dropbox/callback'	
	}	
};


//SSL Info
exports.country = "UK";
exports.state = "Liverpool";
exports.locale = "Liverpool";
exports.commonName = "Feynlabs";
exports.subjectAltName = "127.0.0.1";
