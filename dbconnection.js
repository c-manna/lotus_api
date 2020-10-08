var mysql=require('mysql');
// var connection=mysql.createPool({
var connection=mysql.createPool({
		


/*** Linode Server Database 
host:'31.170.161.85',//31.170.161.85 //mysql.hostinger.in
user:'u279363586_max66', //u279363586_abbetpro
password:'x2oQS4gE]',//Havowi@1234
database:'u279363586_max66' //u279363586_api_source

***/
/*** AWS Server Database ***/
host:'15.206.126.91',
user:'root10',
password:'@gdshfioe11245&^^$%',
database:'MAX66_user2.0'




});

connection.getConnection(function(error){
	if(error){
		console.log('Error',error);
	}else{
		console.log('Database Connected');
	}
})
module.exports=connection;