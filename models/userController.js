var db = require('../dbconnection');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var rp = require('request-promise');
var async = require("async");
var moment = require('moment');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


function event_list(){

    return new Promise(function(resolve, reject){
    	request.get({
						headers: {
							'content-type': 'application/json'
						},
						url: "http://178.62.105.201/api/v1/fetch_data?Action=listEventTypes",
						//form: JSON.stringify(req.body)
						}, function (error, response, body) {
							//console.log('Hello World',body);
							// callback({success:true,data:body});
							// //res.json(body);
							if(error){
								reject(error)
							}else{
								resolve(body)
							}
						});

    })
}

function event_competition(eventID){

    return new Promise(function(resolve, reject){
    	request.get({
						headers: {
							'content-type': 'application/json'
						},
						url: "http://178.62.105.201/api/v1/fetch_data?Action=listCompetitions&EventTypeID="+eventID,
						
						}, function (error, response, body) {
							if(error){
								reject(error)
							}else{
								resolve(body)
							}
							
						});

    })
}

function matchby_Competetion(eventID,competitionId){
	return new Promise(function(resolve, reject){
    	request.get({
						headers: {
							'content-type': 'application/json'
						},
						url: "http://178.62.105.201/api/v1/fetch_data?Action=listEvents&EventTypeID="+eventID+"&CompetitionID="+competitionId,
						
						}, function (error, response, body) {
							if(error){
								reject(error)
							}else{
								resolve(body)
							}
							
						});

    })
}

function market_match(matcheventID){
	return new Promise(function(resolve, reject){
    	request.get({
						headers: {
							'content-type': 'application/json'
						},
						url: "http://178.62.105.201/api/v1/fetch_data?Action=listMarketTypes&EventID="+matcheventID,
						
						}, function (error, response, body) {
							if(error){
								reject(error)
							}else{
								resolve(body)
							}
							
						});

    })
}
function marketRunner(marketID){
	return new Promise(function(resolve, reject){
		request.get({
					headers: {
						'content-type': 'application/json'
					},
					url: "http://178.62.105.201/api/v1/fetch_data?Action=listMarketRunner&MarketID="+marketID,
					//form: JSON.stringify(req.body)
					}, function (error, response, body) {
						//callback({success:true,data:body});
						if(error){
							reject(error)
						}else{
							resolve(body)
						}
						
					});

	})
}
  
  function book_odd(marketID){
	return new Promise(function(resolve, reject){
		request.get({
					headers: {
						'content-type': 'application/json'
					},
					url: "http://178.62.105.201/api/v1/listMarketBookOdds?market_id="+marketID,
					//form: JSON.stringify(req.body)
					}, function (error, response, body) {
						//callback({success:true,data:body});
						if(error){
							reject(error)
						}else{
							resolve(body)
						}
						
					});

	})
}

function marketBooksession(matchID){
	return new Promise(function(resolve, reject){
		request.get({
					headers: {
						'content-type': 'application/json'
					},
					url: "http://178.62.105.201/api/v1/listMarketBookSession?match_id="+matchID,
					//form: JSON.stringify(req.body)
					}, function (error, response, body) {
						//callback({success:true,data:body});
						if(error){
							reject(error)
						}else{
							resolve(body)
						}
						
					});

	})
}

var userController = {
	userlogin:function(loginData,callback){
		// var hash = '$2y$10$F2daDpY0tC0KjoOMtAYxWejjiRzrWttkrQ88jRW91jzVjFiLnIMOy';
		// console.log('loginData ===>',loginData);
		// hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
		var userJson = [];
		var token ='';
		var plunter=db.query("SELECT punter.* FROM punter WHERE punter_user_name=? LIMIT 1",[loginData.user],function (err, rows, fields) {
			
			if(!err){
				if(rows.length > 0){
					var plunter_data=rows[0];
					var hash =plunter_data.punter_password;
					hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
						bcrypt.compare(loginData.password, hash, function(err, res) {
					    //console.log(res);
					    	if(res == true){
					    	userJson.push(rows[0]);
					    	crypto.randomBytes(32, function(err, buffer) {
  									token = buffer.toString('hex');
  									//console.log('token',token);

  									callback({success:true,message:"Login success",data:userJson,token:token});
							});
					    	 
					    	
					    }else{
					    	callback({success:false,message:"Login Faiure",data:userJson,token:token});
					    }
					});
				}else{
					callback({success:false,message:"Login Faiure",data:userJson,token:token});
				}
			}else{
				callback({success:false,message:"DB Faiure",data:userJson,token:token});
			}
			
		})

	},
	getEventFetch:async function(userparams,callback){

		
		var allEventList = await event_list();
		//console.log('allEventList',allEventList);
		var responseList= JSON.parse(allEventList);
		if(responseList.length > 0){
				db.query("SELECT events.* FROM events",function(err,rows,fields){
					 console.log(rows[0]);
					
					if(rows.length > 0){
						var event_id = rows[0].id;
						db.query("Update events set event_data=?,is_login=? where id=?", [allEventList,1, event_id], function (err, rows, fields) {
				            if(err){
				               //console.log('update ==>',rows)
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Events update successfully",LastID:userparams.id,data:responseList})
				            }
					
				         })
					}else{
						db.query("Insert into events (event_data,is_login) values (?,?)",[allEventList,0],function(err,rows,fields){

							if(err){
								 
	   					        callback({success:false, message:"Some error occured",data:[]});
							}else{

								callback({success: true, message:"Events added successfully",LastID:rows.insertId,data:responseList})
							}
						})
					}
			 
			 })
		}else{
			callback({success: false, message:"No Events are there!",data:[]})
		}
		

	},
	getEventCompetition:async function(userparams,callback){

		
		//var update_event = await event_status(userparams.eventID);
		var allEventCompetition = await event_competition(userparams.eventID);
		
		//console.log('update_event',update_event);
		var responseList= JSON.parse(allEventCompetition);
		if(responseList.length > 0){
				
			db.query("SELECT COUNT(event_id) AS count_num FROM `competition` WHERE event_id=? LIMIT 1",[userparams.eventID],function(err,rows,fields){

				// console.log("competition",rows[0].count_num)
				if(rows[0].count_num > 0){

					db.query("Update competition set competition_json=? where event_id=?", [allEventCompetition,userparams.eventID], function (err, rows, fields) {
				            if(err){
				               //console.log('update ==>',rows)
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Competition update successfully",LastID:userparams.eventID,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into competition (event_id,competition_json,status) values (?,?,?)",[userparams.eventID,allEventCompetition,1],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							// callback(null,rows.insertId);
							callback({success: true, message:"Competition added successfully",data:responseList})
						}
					})

				}


			})

				




		}else{
			callback({success:false, message:"No data found",data:[]});
		}
		 
		  

		
	},
	getmatchBySereis:async function(userparams,callback){
		
		var matchByCompetetion = await matchby_Competetion(userparams.eventID,userparams.competitionId);

		
		var responseList= JSON.parse(matchByCompetetion);
		
		if(responseList.length > 0){
			db.query("SELECT matches.* FROM `matches` WHERE event_id=? AND competition_id=? LIMIT 1",[userparams.eventID,userparams.competitionId],function(err,rows,fields){

				//console.log("matches",rows.length)
				if(rows.length > 0){

					db.query("Update matches set match_json=? where event_id=? AND competition_id=?", [matchByCompetetion,userparams.eventID,userparams.competitionId], function (err, rows, fields) {
				            if(err){
				               //console.log('update ==>',rows)
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Match update successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into matches (event_id,match_json,competition_id) values (?,?,?)",[userparams.eventID,matchByCompetetion,userparams.competitionId],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							// callback(null,rows.insertId);
							callback({success: true, message:"Match added successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
						}
					})

				}


			})
		
		}else{

			callback({success:false, message:"No data found",data:[]});
		}
	},
	



	getmarketBymatch:async function(userparams,callback){
		
		var fetchmarketMatch = await market_match(userparams.matcheventID);

		var responseList= JSON.parse(fetchmarketMatch);
		
		if(responseList.length > 0){
			db.query("SELECT market.* FROM `market` WHERE match_event_id=? LIMIT 1",[userparams.matcheventID],function(err,rows,fields){

				
				if(rows.length > 0){

					db.query("Update market set market_json=?,event_id=?,competetion_id=? where match_event_id=?", [fetchmarketMatch,userparams.eventID,userparams.competitionId,userparams.matcheventID], function (err, rows, fields) {
				            if(err){
				              
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Market update successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into market (match_event_id,market_json,event_id,competetion_id) values (?,?,?,?)",[userparams.matcheventID,fetchmarketMatch,userparams.eventID,userparams.competitionId],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							
							callback({success: true, message:"Market added successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
						}
					})

				}


			})
		
		}else{

			callback({success:false, message:"No data found",data:[]});
		}

					
	},

	getmarketByrunner:async function(userparams,callback){
		
		var fetch_market_runner = await marketRunner(userparams.marketID);
		
		var responseList= JSON.parse(fetch_market_runner);
		
		if(responseList.length > 0){
			db.query("SELECT market_runner.* FROM `market_runner` WHERE market_id=? LIMIT 1",[userparams.marketID],function(err,rows,fields){

				
				if(rows.length > 0){

					db.query("Update market_runner set runner_data=?,event_id=?,competetion_id=? where market_id=?", [fetch_market_runner,userparams.eventID,userparams.competitionId,userparams.marketID], function (err, rows, fields) {
				           
				            if(err){
				               
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Market Runner update successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into market_runner (market_id,runner_data,event_id,competetion_id) values (?,?,?,?)",[userparams.marketID,fetch_market_runner,userparams.eventID,userparams.competitionId],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							
							callback({success: true, message:"Market Runner added successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
						}
					})

				}


			})
		
		}else{

			callback({success:false, message:"No data found",data:[]});
		}

		
	},
	getmarketBookOD:async function(userparams,callback){
		
		var market_bookODD= await book_odd(userparams.marketID);
		
		var responseList= JSON.parse(market_bookODD);
		//console.log('responseList ==>',responseList.length);
		if(responseList.length > 0){
			db.query("SELECT market_odds.* FROM `market_odds` WHERE market_id=? LIMIT 1",[userparams.marketID],function(err,rows,fields){

				//console.log("matches",rows.length)
				if(rows.length > 0){

					db.query("Update market_odds set market_odd_data=?,event_id=?,competetion_id=? where market_id=?", [market_bookODD,userparams.eventID,userparams.competitionId,userparams.marketID], function (err, rows, fields) {
				            if(err){
				               //console.log('update ==>',rows)
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Market Odds update successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into market_odds (market_id,market_odd_data,event_id,competetion_id) values (?,?,?,?)",[userparams.marketID,market_bookODD,userparams.eventID,userparams.competitionId],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							// callback(null,rows.insertId);
							callback({success: true, message:"Market Odds added successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
						}
					})

				}


			})
		
		}else{

			callback({success:false, message:"No data found",data:[]});
		}

	},

	getmarketBooksession:async function(userparams,callback){

		var session_bookData= await marketBooksession(userparams.matchID);
		//console.log('session_bookData = >',session_bookData);
		var responseList= JSON.parse(session_bookData);
		//console.log('responseList ==>',responseList.length);
		if(responseList.length > 0){
			db.query("SELECT session.* FROM `session` WHERE match_id=? LIMIT 1",[userparams.matchID],function(err,rows,fields){

				//console.log("matches",rows.length)
				if(rows.length > 0){

					db.query("Update session set session_data=?,event_id=?,competetion_id=? where match_id=?", [session_bookData,userparams.eventID,userparams.competitionId,userparams.matchID], function (err, rows, fields) {
				            if(err){
				               //console.log('update ==>',rows)
				                callback({success:false, message:"Some error occured",data:[]});
				            }else{
				                callback({success: true, message:"Session update successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
				            }
					
				    })
				
				}else{
					db.query("Insert into session (match_id,session_data,event_id,competetion_id) values (?,?,?,?)",[userparams.matchID,session_bookData,userparams.eventID,userparams.competitionId],function(err,rows,fields){
		  			
						if(err){
							
                      		callback({success:false, message:"Some error occured",data:[]});
						}else{
							
							// callback(null,rows.insertId);
							callback({success: true, message:"Session added successfully",eventID:userparams.eventID,compID:userparams.competitionId,data:responseList})
						}
					})

				}


			})
		
		}else{

			callback({success:false, message:"No data found",data:[]});
		}
		
	},
	getmatchByScore:async function(userparams,callback){
		request.get({
					headers: {
						'content-type': 'application/json'
					},
					url: ": http://178.62.105.201/api/v1/score?match_id="+userparams.matchID,
					//form: JSON.stringify(req.body)
					}, function (error, response, body) {
						callback({success:true,data:body});
						// if(error){
						// 	reject(error)
						// }else{
						// 	resolve(body)
						// }
						
					});
	},

	getmatchInplay:async function(userparams,callback){

		//console.log('In-play==>',userparams.type)
		if(userparams.type == 'all'){
			var allEventList = await event_list();
			//console.log('allEventList',allEventList);
			var event_response = JSON.parse(allEventList);
			if(event_response.length >0){
				// event_response.forEach(eventElement =>{
				for(var i=0;i<=event_response.length-1;i++){
					console.log('eventElement==>',event_response[i].eventType);
					var allEventCompetition = await event_competition(event_response[i].eventType);
					console.log('allEventCompetition',allEventCompetition);
				}//)
			}

		}
	}

}


module.exports = userController;