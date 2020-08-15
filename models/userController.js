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

function netExposure(userId){
	return new Promise(function (resolve, reject) {
		db.query("SELECT * FROM single_bet_info WHERE user_id=? LIMIT 1",[userId],function(err,rows,fields){

                           
       
                if(err){
                     reject('Error');
                }else{
                     if(rows.length > 0){
                        resolve(rows[0]);
                    }else{
                        resolve(rows.length);
                    }
                    
                    
                }
            })

	})
}
function available_balanceInfo(userId){
	return new Promise(function (resolve, reject) {
		db.query("SELECT `punter`.`punter_balance`,`punter`.`punter_exposure_limit`,`punter`.`punter_betting_status`,`punter`.`net_exposure` FROM punter WHERE punter_id=? LIMIT 1",[userId],function(err,rows,fields){

                           
       
                if(err){
                     reject('Error');
                }else{
                     if(rows.length > 0){
                        resolve(rows[0]);
                    }else{
                        resolve(rows.length);
                    }
                    
                    
                }
            })

	})
}

function event_managementData(eventID,marketType){
	return new Promise(function (resolve, reject) {
			db.query("SELECT * FROM event_management WHERE event=? AND market=? LIMIT 1",[eventID,marketType],function(err,rows,fields){

                           
       
                if(err){
                     reject('Error');
                }else{
                     if(rows.length > 0){
                        resolve(rows[0]);
                    }else{
                        resolve(rows.length);
                    }
                    
                    
                }
            })

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
					 //console.log(rows[0]);
					
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

		var inPlay=[];
		var allEventCompetition = await event_competition(userparams.eventID);
		var eventCompetitionData = JSON.parse(allEventCompetition);
					//console.log('eventElement==>',event_response[i].eventType);
		//console.log('allEventCompetition',eventCompetitionData);
		//[{"event":{"id":"29956047","name":"FC Minaj v Volyn","countryCode":"UA","timezone":"GMT","openDate":"2020-08-13T14:30:00.000Z"},"marketCount":25,"scoreboard_id":"","selections":null,"liability_type":"0","undeclared_markets":3}]
		if(eventCompetitionData.length >0){
			for(var j=0;j<=eventCompetitionData.length-1;j++){
				var competitionId=eventCompetitionData[j].competition.id;
				//console.log('event competition id==>',competitionId);
				var matchByCompetetion = await matchby_Competetion(userparams.eventID,competitionId);
				var matchCompetitionData = JSON.parse(matchByCompetetion);
				//console.log('matchByCompetetion==>',matchCompetitionData);
				if(matchCompetitionData.length >0){
						for(var i=0;i<=matchCompetitionData.length-1;i++){
							
							//inPlay.push(matchCompetitionData[i].event);
							let matcheventID = matchCompetitionData[i].event.id;
							var fetchmarketMatch = await market_match(matcheventID);
							let fetchmarketMatchData = JSON.parse(fetchmarketMatch);
							//console.log('fetchmarketMatch==>',fetchmarketMatchData);
							if(fetchmarketMatchData.length >0){
								for(var k=0;k<=fetchmarketMatchData.length-1;k++){
									//console.log('market ID==>',fetchmarketMatchData[k].marketId);
									let marketID = fetchmarketMatchData[k].marketId
									var market_bookODD= await book_odd(marketID);
									let bookodd_data = JSON.parse(market_bookODD);
									// console.log('market_bookODD data==>',bookodd_data);
									if(bookodd_data.length >0){
										for(var m=0;m<=bookodd_data.length-1;m++){
											//console.log('market_bookODD inplay data==>',bookodd_data[m].inplay);
											if(bookodd_data[m].inplay == true){
												console.log('matchByCompetetion ID==>',matchCompetitionData[i].event.name);
												inPlay['event_name']=matchCompetitionData[i].event.name;
												console.log('market_bookODD inplay data==>',bookodd_data[m].inplay);
												inPlay.push(bookodd_data[m])
											}
											
										}
									}
								}
							}
						}
				}

			}
			//console.log('inplay array ==>',inPlay)
			callback({success:true,result:inPlay})
		}

	},
		singlePlaceInfo:async function(betInfo,callback){
		//console.log('single bet',betInfo);

		var num_of_rows_exposure=await netExposure(betInfo.user_id);
		//console.log('num_of_rows_exposure ==>',num_of_rows_exposure);
		var check_availableBalance = await available_balanceInfo(betInfo.user_id);
		//console.log('check_availableBalance ==>',check_availableBalance);
		
		if(check_availableBalance.punter_betting_status ==1){
			var user_bet_status=true;
		}else{
			var user_bet_status=false;
		}
		if(betInfo.market_type == 'Match Odds'){
			var marketType='odds';
		}else if(betInfo.market_type == 'Fancy'){
			var marketType='fancy';
		}else{
			var marketType='bookmaker';
		}
		var event_id = betInfo.event_id;
		var event_info = await event_managementData(event_id,marketType);
		console.log('event_info ==>',event_info);
		if(event_info !=0){
			var max_bet =event_info.max_bet;
			var max_market=event_info.max_market;
		}else{
			var max_bet =0;
			var max_market=0;
		}
		var available_balance = check_availableBalance.punter_balance;
		var exposure_limit_balance = check_availableBalance.punter_exposure_limit;

		var stake_amt =betInfo.stake;
		var odd = '';
		var bet_team=betInfo.runner_name;
		var profit=0,loss =0,exposure_amt=0,net_exposure=0,calculate_exposure=0;
		if(betInfo.odd == 0){
			odd = 'back';
			var last_odd = betInfo.last_odd;
			var placed_odd = betInfo.place_odd;
			profit=parseFloat((placed_odd-1)*stake_amt);
			loss = parseFloat(stake_amt);
			exposure_amt=loss;

		}else{
			odd = 'lay';
			var last_odd = betInfo.last_odd;
			var placed_odd = betInfo.place_odd;
			loss=parseFloat((placed_odd-1)*stake_amt);
			profit=parseFloat(stake_amt);
			exposure_amt=loss;
		}
		if(num_of_rows_exposure !=0){
				// if(betInfo.odd == 0){
				// 	net_exposure=parseInt(check_availableBalance.net_exposure + exposure_amt);
				// }else{
					net_exposure=parseFloat(check_availableBalance.net_exposure + exposure_amt);
					//}
			
			
			
			var remain_balance=parseFloat(available_balance+check_availableBalance.net_exposure-net_exposure);
			//console.log('calculate avail 2==>',remain_balance);//11000+1000-2000
		}else{
			// net_exposure=parseInt(check_availableBalance.net_exposure + stake_amt);
			net_exposure=parseFloat(check_availableBalance.net_exposure + exposure_amt);
			
			var remain_balance=parseFloat(available_balance-net_exposure);
			
		}
		
		
		


		
		if(remain_balance<=0){
			remain_balance=0
		}
		
		// console.log('bet ==>',odd);
		// console.log('placed_odd ==>',placed_odd);
		// console.log('loss ==>',loss);
		// console.log('protential profit ==>',profit);
		// console.log('exposure_amt ==>',exposure_amt);
		// console.log('net_exposure ==>',net_exposure);
		// //console.log('calculate_exposure ==>',calculate_exposure);
		// console.log('user exposure_limit_balance ==>',exposure_limit_balance);
		// console.log('user available_balance ==>',available_balance);
		// console.log('remain_balance ==>',remain_balance);
		//var avail =400;var limit=500; 
		if(available_balance<=exposure_limit_balance){
			var final_balance=available_balance;
		}
		if(exposure_limit_balance<=available_balance){
			var final_balance=exposure_limit_balance;
		}

		console.log('final_balance ==>',final_balance);

		 if(final_balance>=net_exposure){
		// if(available_balance>=calculate_exposure || exposure_limit_balance>=calculate_exposure){
			
			
			var profitTeamdetailsArr=[];
			var lossTeamdetailsArr=[];
			for(var i=0;i<=betInfo.runners.length-1;i++){
				if(odd == 'back'){
					if(betInfo.runners[i].runnerName == bet_team){
						//console.log('bet back team name profit',betInfo.runners[i].runnerName+'='+profit);
						var selectionID=betInfo.runners[i].selectionId;
						var team_details={
							odd_type:odd,
							team_name:betInfo.runners[i].runnerName,
							profit_amt:profit.toFixed(2)
						}
						profitTeamdetailsArr.push(team_details);
					}else{
						//console.log('others back team name loss',betInfo.runners[i].runnerName+'='+loss);
						var team_details={
							odd_type:'lay',
							team_name:betInfo.runners[i].runnerName,
							loss_amt:loss.toFixed(2)
						}
						lossTeamdetailsArr.push(team_details);
					}
				}else{
					if(betInfo.runners[i].runnerName == bet_team){
						//console.log('bet lay team name profit',betInfo.runners[i].runnerName+'='+loss);
						var selectionID=betInfo.runners[i].selectionId;
						var team_details={
							odd_type:odd,
							team_name:betInfo.runners[i].runnerName,
							loss_amt:loss.toFixed(2)
						}
						lossTeamdetailsArr.push(team_details);
					}else{
						//console.log('others lay team name loss',betInfo.runners[i].runnerName+'='+profit);
						var team_details={
							odd_type:'back',
							team_name:betInfo.runners[i].runnerName,
							profit_amt:profit.toFixed(2)
						}
						profitTeamdetailsArr.push(team_details);
					}
				}
				
			}
			let sql = `INSERT INTO single_bet_info 
			   (market_id,market_status, market_type,match_id,selection_id, market_start_time, market_end_time, description, event_name, bet_time, user_id, bet_id, bet_status,exposure,runner_name,stake,odd,placed_odd,last_odd,p_and_l,amount, available_balance, protential_profit,user_ip,settled_time,profit_team_data,loss_team_data)
			    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
			var bet_insert =db.query(sql, [betInfo.market_id, betInfo.market_status, betInfo.market_type,betInfo.match_id,selectionID,betInfo.market_start_time,betInfo.market_end_time, betInfo.description, betInfo.event_name, betInfo.bet_time, betInfo.user_id, betInfo.bet_id, betInfo.bet_status, net_exposure, betInfo.runner_name, betInfo.stake, betInfo.odd, betInfo.place_odd, betInfo.last_odd,betInfo.p_and_l, exposure_amt, remain_balance, profit, betInfo.user_ip, betInfo.settled_time,JSON.stringify(profitTeamdetailsArr),JSON.stringify(lossTeamdetailsArr)],function(err, rows, fields){
				// console.log('query',bet_insert.sql);
				if(!err){
					//var update_avl_amt=await update_balance(betInfo.user_id,remain_balance);
					var betId=rows.insertId;

					var query = db.query("Update punter set net_exposure=? where punter_id=?", [net_exposure, betInfo.user_id], function (err, rows, fields) {
			          if(!err){
					             var responseObject = {
					             	status:user_bet_status,
									bet_id:betId,
									bet_type:odd,
									protential_profit:profit.toFixed(2),
									liability_amt:loss.toFixed(2),
									net_exposure:net_exposure.toFixed(2),
									available_balance:remain_balance.toFixed(2),
									balance_limit:exposure_limit_balance.toFixed(2),
									max_market:max_market,
									max_bet:max_bet,
									profit_data:profitTeamdetailsArr,
									loss_data:lossTeamdetailsArr

								}
							callback({success:true,message:'Bet placed success',result:responseObject}) 
			            }else{
			            	callback({success:false,message:'Some thing went wrong',result:''})
			            }
			        })
					
				}else{
			            	callback({success:false,message:'Some thing went wrong',result:''})
			        }
			})
			console.log('<==== Bet place ====>');
		}else{
			console.log('<==== Bet place not====>');
			var responseObject = {
									status:user_bet_status,
									bet_type:odd,
									protential_profit:profit.toFixed(2),
									liability_amt:loss.toFixed(2),
									net_exposure:net_exposure.toFixed(2),
									max_market:max_market,
									max_bet:max_bet,
									available_balance:available_balance.toFixed(2),
									balance_limit:exposure_limit_balance.toFixed(2),
									
									
								}
			callback({success:true,message:'Exposure limit exceed',result:responseObject})
		}
		
		
	},

	getExposure:async function(userData,callback){
		//console.log('getExposure ==>',userData);
		var exposureArr=[];
		var check_availableBalance = await available_balanceInfo(userData.user_id);
		
		if(check_availableBalance !=0){



		var exposure_limit_balance=check_availableBalance.punter_exposure_limit;
		var punter_betting_status =check_availableBalance.punter_betting_status;
		var fetchExposure=db.query("SELECT * FROM single_bet_info WHERE user_id=? AND match_id=?",[userData.user_id,userData.match_id],function(err,rows,fields){
			if(!err){
					if(rows.length >0){
						//console.log("bet info ==>",rows);
						for(var i=0;i<=rows.length-1;i++){
							var oddType=(rows[i].odd=='0')?'Back':'Lay';
							var responseObject={
								bet_id:rows[i].single_bet_id,
								placed_odd:rows[i].placed_odd,
								stake_amount:rows[i].stake,
								net_exposure:rows[i].exposure,
								protential_profit:rows[i].protential_profit,
								liability_amount:rows[i].amount,
								available_balance:rows[i].available_balance,
								exposure_limit:exposure_limit_balance,
								punter_betting_status:punter_betting_status,
								match_name:rows[i].description,
								event_name:rows[i].event_name,
								bet_team:rows[i].runner_name,
								odd_type:oddType,
								market_id:rows[i].market_id,
								market_status:rows[i].market_status,
								bet_status:rows[i].bet_status,
								profit_team_data:JSON.parse(rows[i].profit_team_data.replace(/(\r\n|\n|\r)/gm,"")),
								loss_team_data:JSON.parse(rows[i].loss_team_data.replace(/(\r\n|\n|\r)/gm,"")),
							}
							exposureArr.push(responseObject);
						}
						callback({success:true,message:"All bet list data",result:exposureArr});
					}else{
					var user=db.query("SELECT `punter`.`punter_balance`,`punter`.`punter_exposure_limit`,`punter`.`punter_betting_status`,`punter`.`net_exposure` FROM punter WHERE punter_id=? LIMIT 1",[userData.user_id],function(err,rows,fields){
			                if(err){
			                    callback({success:false,message:"Some thing went wrong"})
			                }else{
			                     if(rows.length > 0){
			                        //resolve(rows[0]);
			                       // console.log('check_availableBalance ==>',rows[0]);
			                       var responseObject ={
			                       	  available_balance:rows[0].punter_balance,
			                       	  exposure_limit:rows[0].punter_exposure_limit,
			                       	  net_exposure:rows[0].net_exposure,
			                       	  punter_betting_status:rows[0].punter_betting_status,
			                       }
			                       exposureArr.push(responseObject);
			                     callback({success:true,message:"User data",result:exposureArr});
			                    }else{
			                        callback({success:false,message:"User data not found",result:exposureArr});
			                    }
			                    
			                    
			                }
			            })
						//console.log('check_availableBalance ==>',check_availableBalance);
					}
			}else{
				callback({success:false,message:"Some thing went wrong"})
			}
		})
		}else{
			callback({success:false,message:"User data not found",result:exposureArr});
		}
	}
	/**
	getmatchInplay:async function(userparams,callback){

		//console.log('In-play==>',userparams.type)
		var competition_array=[];
		if(userparams.type == 'all'){
			var allEventList = await event_list();
			//console.log('allEventList',allEventList);
			var event_response = JSON.parse(allEventList);
			if(event_response.length >0){
				// event_response.forEach(eventElement =>{
				for(var i=0;i<=event_response.length-1;i++){
					
					var eventId=event_response[i].eventType;
					var allEventCompetition = await event_competition(event_response[i].eventType);
					var eventCompetitiondata = JSON.parse(allEventCompetition);
					//console.log('eventElement==>',event_response[i].eventType);
					console.log('allEventCompetition',eventId+'='+eventCompetitiondata);
					if(eventCompetitiondata.length >0){
						for(var j=0;j<=eventCompetitiondata.length-1;i++){
							var competitionId=eventCompetitiondata[j].competition.id;
							console.log('event competition id==>',competitionId);
						}
					}
					

					
				}//)
				//callback({success:true,data:allEventCompetition});
			}

		}
	}
	**/

}


module.exports = userController;