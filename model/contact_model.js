var mongoose = require('../app').mongoose;
var ObjectId = mongoose.Schema.ObjectId;

var contactSchema = new mongoose.Schema({
    sub: String,
	msg: String,
	email: String,
	time: { type: Date, default: Date.now }
});
 
var ContactModel = mongoose.model('Contacts',contactSchema);
exports.ContactModel = ContactModel; 

function createContact(data,callback){
	ContactModel.create(data,function(err,docs){
		if(err) {
			console.log('err ');
			callback(err, null);
		}
		else {
			callback(null, docs);
		}
	})	
}


function findContacts(condition,option,callback){
    //{'limit':20,'skip':0},
	ContactModel.find(condition,'sub email msg time',option, function(err, docs){
		   if(err){ callback(err, null); }
		   else
		   {
			   callback(err,docs);
		   }
	});
}


function findContactByQuery(condition,callback){
	ContactModel.findOne(condition,function(err, doc){
		if(err){callback(err, null);}
		else{
			//console.log("findContactByQuery");
			callback(null, doc);
		}
	})	
} 

function deleteContactById(id,callback){
    var id;
    try {
         id = mongoose.Types.ObjectId(id);
    } catch(e) {
        return callback(err, null);
    }
	
	ContactModel.findByIdAndRemove(id,function(err){
		if(err){console.log('err remove');callback(err, null);}	
		else {
			callback(null);
		}
	});

}

exports.createContact = createContact;
exports.findContacts = findContacts;
exports.findContactByQuery = findContactByQuery;
exports.deleteContactById = deleteContactById;
