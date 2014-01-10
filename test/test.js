//  small chunks


var data = {
    e:[
        {n:"humidity", v:22.5, t:12345},
        {n:"humidity", v:23.5, t:24680},
        {n:"lightcc", v:100, t:12345},
        {n:"lightcc", v:200, t:13692}
    ]
};
// big chunks
// http://data.openiot.org/cat
//  https://dev.1248.io:8002/cats/ARMAlertMe (key = ADMINSECRET)
//  http://212.49.230.229:8000/cats/ARM1 (no key)
//  http://geras.1248.io/cat/enlight (key = 1bfc8d081f5b1eed8359a7517fdb054a) 
/*
This is being republished by 1248's Geras as the catalogue http://geras.1248.io/cat/enlight (key = 1bfc8d081f5b1eed8359a7517fdb054a)
The republished catalogue provides SenML resources which support time and rollup queries, allowing apps to fetch just the data they need.
You can see an example of this by using the browser, http://dev.1248.io:8000/browser.html?url=https://geras.1248.io/cat/enlight&key=1bfc8d081f5b1eed8359a7517fdb054a

The AlertMe and Enlight data can both be accessed directly from Geras using the keys (924a7d4dbfab38c964f5545fd6186559 and 1bfc8d081f5b1eed8359a7517fdb054a respectively).
The examples of doing this are in the client-side HTML+JS apps I shared last Friday (https://www.dropbox.com/sh/btilo6qsqyjwluv/ilhsMU5MFA)
Geras allows time and rollup queries as well as subscribing using MQTT/WebSockets.
To view the full Geras API, signup for an account at http://geras.1248.io, then login and see the API tab.

I would suggest that, given the short timeframe for the 29th, you start by modifying the apps I shared last Friday - which access known data series from Geras.
For example, motion.html and energy.html should get you most of what you need for the ARM app presentation you shared.

http://212.49.230.229:8000/cats/ARM1       ........To access ARM cat from us.
http://dev.1248.io:8001/cats/ARM1            .........To access ARM cat through Toby's PathFinder.

"https://dev.1248.io:8002/cats/ARMAlertMe?key=f99864c3e8bf55b2de28d76fca76d10e", //
    //url:"http://212.49.230.229:8000/cats/ARM1",
	//url:"http://geras.1248.io/cat/enlight?key=1bfc8d081f5b1eed8359a7517fdb054a",

*/

/*
request.get({
    url: 'http://geras.1248.io/cat',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("HyperCat discovery".green,body);
});


request.post({
    url: "http://geras.1248.io/series/abc",
	body: JSON.stringify(data),
    headers: {
        'content-type':'application/json',
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("post series ".green,body);
});

//https://geras.1248.io/public/armhome_16_SkyDisplay_00-0D-6F-00-00-F2-62-A5_signal
//https://geras.1248.io/public/armhome_1_MeterReader_00-0D-6F-00-00-F2-6E-23_energy?key=ADMINSECRET

request.get({
    url: 'http://geras.1248.io/serieslist',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("response get serieslist".green,body);
});


request.get({
    url: 'http://geras.1248.io/serieslist?pattern='+encodeURIComponent('/abc/+'),
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("List series matching MQTT pattern".green,body);
});



function getHistoryDataOnDevice(url,key){
    request.get({
        url: 'http://geras.1248.io/now/abc/lightcc',
        headers: {
            'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
        }
    }, function(error, response, body) {
	    if(error)
	    console.log("error  ".red, error);
	    else
	    console.log("Read most recent value".green,body);
    });
}

function getRealTimeData(url,key){
    request.get({
        url: 'http://geras.1248.io/series/foo/temperature?start=1234&end=2468',
        headers: {
            'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
        }
    }, function(error, response, body) {
	    if(error)
	    console.log("error  ".red, error);
	    else
	    console.log("Time windowing".green,body);
    });
}


request.get({
    url: 'http://geras.1248.io/series/abc/lightcc',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("Read single series data".green,body);
});


request.get({
    url: 'http://geras.1248.io/series/abc?recursive',
    headers: {
        'Authorization': 'Basic ' + new Buffer('f99864c3e8bf55b2de28d76fca76d10e:').toString('base64')
    }
}, function(error, response, body) {
	if(error)
	console.log("error  ".red, error);
	else
	console.log("Read single recursive data".green,body);
});
*/