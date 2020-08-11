var mysql = require('mysql');
// var connection=mysql.createPool({
var connection = mysql.createPool({


	/*** Local Server Database ***/
	//url https://phpmyadmin.hostinger.com/auth
	/* host: '31.170.161.85',//31.170.161.85 //mysql.hostinger.in
	user: 'u279363586_max66', //u279363586_abbetpro
	password: 'x2oQS4gE]',//Havowi@1234
	database: 'u279363586_max66' //u279363586_api_source
 */
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'lotus'


});

connection.getConnection(function (error) {
	if (error) {
		console.log('Error', error);
	} else {
		console.log('Database Connected');
	}
})
module.exports = connection;