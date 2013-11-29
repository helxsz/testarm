var fs = require('fs'),
    request = require("request"),
	mqtt = require('mqtt');
	
var olddata;
setInterval(readFile, 4000);

var mqttclient = mqtt.createClient(1883, "test.mosquitto.org");
mqttclient.on('connect', function(){
    console.log('MQTT Connected'.green, new Date());
});


function readFile(){
    fs.readFile('c:\\k.txt', 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        console.log(data);
		
		mqttclient.publish('parking/1', data);
		
		/*
		if(olddata !=data){
		    console.log('send new data');
			olddata = data;
		}	
			var url;
			

            url = 'http://localhost:8080/parking_spots?data='+data;
			request.get(url, function(error, response, body) {
			    if (!error && response.statusCode == 200) {
                      console.log(body) // Print the google web page.
                }else{
				     console.log(error);
				}
			})
			
		    
            url = 'http://54.212.249.167:80/parking_spots?data='+data;
			request.get(url, function(error, response, body) {
			    if (!error && response.statusCode == 200) {
                      console.log(body) // Print the google web page.
                }else{
				     console.log(error);
				}
			})
		*/
			
    });
}