var util = require('util'),
    express = require('express'),
    vm = require('vm'),
	path = require('path'),
    fs = require('fs'),
    async = require('async'),
    color = require('colors'),
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    crypto = require('crypto'),
	ejs = require('ejs');
				
var path = "D:/data/CarData/TrainImages";				
fs.readdir(path, function(err, files){
	if (err) {
		// ERROR, tell the user that the files don't existed anymore
		console.log('file don not exist');
	}	
	else {
	    //console.log(files);
	}
	
	var filepath = 'D:/data/CarData/csv.csv';			
	
	var dir = [];
	var readFile = function(file,callback){
		//console.log('file'.green,file);
		var i = 0;
		if(file.indexOf("pos")) {
		    console.log('pos'.green, file);	
            i = 1;			
		}	
		else if(file.indexOf('neg')) {
		    console.log('neg'.red, file);
			i = 0;
		}			
	    fs.appendFile(filepath, path+"/"+file+";"+i+"\n", function(err) {
            if(err) {
                 console.log(err);
            } else {
                console.log("The file was saved!");
            }
        });				
		callback();                       
	}
	async.each(files, readFile, function(err){
        
    });
	
});