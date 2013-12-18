/***********
http://stackoverflow.com/questions/18484775/how-do-you-access-an-amazon-sns-post-body-with-express-node-js
http://aws.amazon.com/developers/access-keys/
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html#!AWS/SNS.html
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html
http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html

api s3 http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
code  https://gist.github.com/helxsz/7925793
************/
var argv = require('optimist').argv;
console.log('(%d,%d)', argv.x, argv.y);
require('colors');

var AWS = require('aws-sdk');
var uuid = require('node-uuid');
AWS.config.loadFromPath('config.json');

// http://docs.aws.amazon.com/AmazonS3/latest/dev/ACLOverview.html#CannedACL
// private public-read public-read-write authenticated-read bucket-owner-read  bucket-owner-full-control
var s3 = new AWS.S3();
//var bucketName = 'node-sdk-sample-' + uuid.v4();
var keyName = 'hello_world.txt';
var bucketName = 'abcadfa';
s3.createBucket({Bucket: bucketName}, function() {
  var params = {Bucket: bucketName, Key: keyName, Body: 'Hello World!',ACL: 'public-read'};  
  s3.putObject(params, function(err, data) {
    if (err)
      console.log(err)
    else
      console.log("Successfully uploaded data to ".green + bucketName + "/" + keyName);
  });
});

s3.listBuckets(function(error, data) {
  if (error) {
    console.log(error); // error is Response.error
  } else {
    //console.log(data); // data is Response.data
	for (var index in data.Buckets) {
        var bucket = data.Buckets[index];
        //console.log("Bucket: ".green, bucket.Name, ' : ', bucket.CreationDate);
    }	
  }
});


s3.listObjects({Bucket:"abcadfa"}, function(err,data){
  if(err){
    console.log(err);
  }
  else{
    for(var i=0;i<data.Contents.length;i++){
      console.log("key:",data.Contents[i].Key);
    }
  }
});


module.exports = {

	
    listBuckets: function (client) {
        client.listBuckets({}, function (err, data) {
            var buckets = data.Buckets;
            var owners = data.Owner;
            for (var i = 0; i < buckets.length; i += 1) {
                var bucket = buckets[i];
                console.log(bucket.Name + " created on " + bucket.CreationDate);
            }
            for (var i = 0; i < owners.length; i += 1) {
                console.log(owners[i].ID + " " + owners[i].DisplayName);
            }
        });
    },

    listObjects: function (client) {
        client.listObjects({Bucket: bucket}, function (err, data) {
            if (err) {
                console.log("error listing bucket objects "+err);
                return;
            }
            var items = data.Contents;
            for (var i = 0; i < items.length; i += 1) {
                console.log( "Bucket:", bucket, "Key:", items[i].Key);
            }			
        });
    },

    getObject: function (client,bucket,key) {
        client.getObject({Bucket: bucket, Key: key}, function (err, data) {
            if (err) {
                console.log("error objects "+err);
                return;
            }
            
			console.log(data.Body , data.Expiration   , data.ContentLength  , data.ContentType );
        });
    },	
	
    deleteBucket: function (client, bucket) {
        client.deleteBucket({Bucket: bucket}, function (err, data) {
            if (err) {
                console.log("error deleting bucket " + err);
            } else {
                console.log("delete the bucket " + data);
            }
        });
    },
    clearBucket: function (client, bucket) {
        var self = this;
        client.listObjects({Bucket: bucket}, function (err, data) {
            if (err) {
                console.log("error listing bucket objects "+err);
                return;
            }
            var items = data.Contents;
            for (var i = 0; i < items.length; i += 1) {
                var deleteParams = {Bucket: bucket, Key: items[i].Key};
                self.deleteObject(client, deleteParams);
            }			
        });
    },
    deleteObject: function (client, deleteParams) {
        client.deleteObject(deleteParams, function (err, data) {
            if (err) {
                console.log("delete err " + deleteParams.Key);
            } else {
                console.log("deleted " + deleteParams.Key);
            }
        });
    },
	// Bucket: , Delete :[{key:}]
	deleteObjects: function (client, deleteParams) {
        client.deleteObjects(deleteParams, function (err, data) {
            if (err) {
                console.log("delete err " + deleteParams.Key);
            } else {
                console.log("deleted " + deleteParams.Key);
            }
        });
    },
};


/*
var params = {'Bucket': 'myBucket', 'Key': 'myKey','Expires': 60}; 
var url = s3.getSignedUrl('getObject', params);
console.log("The URL is", url);
console.log(new Date());
*/


/*  
var params = {Bucket: 'myBucket', Key: 'myImageFile.jpg'};
var file = require('fs').createWriteStream('/path/to/file.jpg');
s3.getObject(params).createReadStream().pipe(file);

s3.getObject(params).
on('httpData', function(chunk) { file.write(chunk); }).
on('httpDone', function() { file.end(); }).
send();


// Read in the file, convert it to base64, store to S3
fs.readFile('myarchive.tgz', function (err, data) {
  if (err) { throw err; }

  var s3 = new AWS.S3();
  s3.client.putObject({
    Bucket: 'mybucketname',
    Key: 'myarchive.tgz',
    Body: data
  }).done(function (resp) {
    console.log('Successfully uploaded package.');
  });

});

*/



/*  SNS 
AWS Free Tier availability:

1 million Mobile Push Notifications
100 SMS
1,000 email/email-JSON
100,000 HTTP/s
unlimited deliveries to SQS Queues



http://blog.matoski.com/articles/snssqs-for-node-js/
http://dev.classmethod.jp/cloud/amazonsns-http/
http://aws.amazon.com/documentation/sns/
http://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html
http://docs.aws.amazon.com/sns/latest/dg/SendMessageToSQS.html


var sns = new AWS.SNS();

// subscribe
sns.Subscribe({topic: "topic", Protocol: "https"}, function (err, data) {
    if (err) {
        console.log(err); // an error occurred
    } else {
        console.log(data); // successful response - the body should be in the data
    }
});


    // publish example
sns.Publish({topic: "topic", message: "my message"}, function (err, data) {
    if (err) {
        console.log(err); // an error occurred
    } else {
        console.log(data); // successful response - the body should be in the data
    }
});
*/
 
 

  /*
var ec2 = new AWS.EC2();

var params = {
  //ImageId: 'ami-1624987f', // Amazon Linux AMI x86_64 EBS
  ImageId: "ami-2d4aa444",
  InstanceType: 't1.micro',
  MinCount: 1, MaxCount: 1
};

// Create the instance
ec2.runInstances(params, function(err, data) {
  if (err) { console.log("Could not create instance", err); return; }

  var instanceId = data.Instances[0].InstanceId;
  console.log("Created instance", instanceId);

  // Add tags to the instance
  params = {Resources: [instanceId], Tags: [
    {Key: 'Name', Value: instanceName}
  ]};
  ec2.createTags(params, function(err) {
    console.log("Tagging instance", err ? "failure" : "success");
  });
});





 app.post('/compressit',function(req,res) {
    try{
        var jsp = require("uglify-js").parser;
        var pro = require("uglify-js").uglify;
 
        var orig_code = req.param("js");
        var ast = jsp.parse(orig_code); // parse code and get the initial AST
        ast = pro.ast_mangle(ast); // get a new AST with mangled names
        ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
        ast = pro.ast_lift_variables(ast);
        var final_code = pro.gen_code(ast,{inline_script:true});
        res.send(final_code);
    }
    catch(err) {
        res.send("Error:" +err.message);
    }
});


Read more: http://jaspreetchahal.org/build-a-javascript-compressor-tool-using-nodejs-expressjs-jade-uglifyjs-tutorial/#ixzz2m4c00BYD
 */