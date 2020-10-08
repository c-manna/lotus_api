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
const util = require('util');
const query = util.promisify(db.query).bind(db);
const config = require("../config");
const jwt = require('jsonwebtoken');


function event_list() {

    return new Promise(function (resolve, reject) {
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
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }
        });

    })
}

function event_competition(eventID) {

    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/fetch_data?Action=listCompetitions&EventTypeID=" + eventID,

        }, function (error, response, body) {
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function matchby_Competetion(eventID, competitionId) {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/fetch_data?Action=listEvents&EventTypeID=" + eventID + "&CompetitionID=" + competitionId,

        }, function (error, response, body) {
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function market_match(matcheventID) {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/fetch_data?Action=listMarketTypes&EventID=" + matcheventID,

        }, function (error, response, body) {
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function marketRunner(marketID) {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/fetch_data?Action=listMarketRunner&MarketID=" + marketID,
            //form: JSON.stringify(req.body)
        }, function (error, response, body) {
            //callback({success:true,data:body});
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function book_odd(marketID) {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/listMarketBookOdds?market_id=" + marketID,
            //form: JSON.stringify(req.body)
        }, function (error, response, body) {
            //callback({success:true,data:body});
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function marketBooksession(matchID) {
    return new Promise(function (resolve, reject) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: "http://178.62.105.201/api/v1/listMarketBookSession?match_id=" + matchID,
            //form: JSON.stringify(req.body)
        }, function (error, response, body) {
            //callback({success:true,data:body});
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }

        });

    })
}

function netExposure(userId) {
    return new Promise(function (resolve, reject) {
        db.query("SELECT * FROM single_bet_info WHERE user_id=? LIMIT 1", [userId], function (err, rows, fields) {



            if (err) {
                reject('Error');
            } else {
                if (rows.length > 0) {
                    resolve(rows[0]);
                } else {
                    resolve(rows.length);
                }


            }
        })

    })
}

function available_balanceInfo(userId) {
    return new Promise(function (resolve, reject) {
        db.query("SELECT `punter`.`punter_balance`,`punter`.`punter_exposure_limit`,`punter`.`punter_betting_status`,`punter`.`net_exposure` FROM punter WHERE punter_id=? LIMIT 1", [userId], function (err, rows, fields) {



            if (err) {
                reject('Error');
            } else {
                if (rows.length > 0) {
                    resolve(rows[0]);
                } else {
                    resolve(rows.length);
                }


            }
        })

    })
}

function event_managementData(eventID) {
    if (eventID == -1) {
        return new Promise(function (resolve, reject) {
            db.query("SELECT * FROM event_management WHERE market=?", ['Match Odds'], function (err, rows, fields) {
                if (err) {
                    reject('Error');
                } else {
                    if (rows.length > 0) {
                        resolve(rows);
                    } else {
                        resolve(rows.length);
                    }


                }
            })

        })
    } else {
        return new Promise(function (resolve, reject) {
            db.query("SELECT * FROM event_management WHERE event=?", [eventID], function (err, rows, fields) {
                if (err) {
                    reject('Error');
                } else {
                    if (rows.length > 0) {
                        resolve(rows);
                    } else {
                        resolve(rows.length);
                    }


                }
            })

        })
    }
}


var userController = {
    userlogin: async (loginData, callback) => {
        try {
            const userData = await query("SELECT punter.* FROM punter WHERE punter_user_name=? LIMIT 1", [loginData.user]);
            if (!(userData && userData.length)) return callback({
                success: false,
                message: "Login Faiure"
            });
            const user = userData[0];
            let hash = user.punter_password;
            hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
            const isMatch = await util.promisify(bcrypt.compare)(loginData.password, hash);
            if (!isMatch) return callback({
                success: false,
                message: "Login Faiure",
                data: userJson,
                token: token
            });
            const payload = {
                punter_id: user.punter_id,
                punter_user_name: user.punter_user_name,
                punter_belongs_to: user.punter_belongs_to
            }
            const token = await util.promisify(jwt.sign)(payload, config.JWT.JWT_USER_SECRET, {
                expiresIn: "120 days"
            });
            return callback({
                success: true,
                message: "Login success",
                data: payload,
                token: token
            });
        } catch (err) {
            return callback({
                success: false,
                message: "Something went wrong"
            });
        }
    },
    getEventFetch: async function (userparams, callback) {
        // API DATA STOPED 
        var allEventList = await event_list();

        var responseList = JSON.parse(allEventList);
        if (responseList.length > 0) {
            db.query("SELECT events.* FROM events", function (err, rows, fields) {
                //console.log(rows[0]);

                if (rows.length > 0) {
                    var event_id = rows[0].id;
                    db.query("Update events set event_data=?,is_login=? where id=?", [allEventList, 1, event_id], function (err, rows, fields) {
                        if (err) {
                            //console.log('update ==>',rows)
                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Events update successfully",
                                LastID: userparams.id,
                                data: responseList
                            })
                        }

                    })
                } else {
                    db.query("Insert into events (event_data,is_login) values (?,?)", [allEventList, 0], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {

                            callback({
                                success: true,
                                message: "Events added successfully",
                                LastID: rows.insertId,
                                data: responseList
                            })
                        }
                    })
                }

            })
        } else {
            callback({
                success: false,
                message: "No Events are there!",
                data: []
            })
        }
        /* db.query("SELECT events.* FROM events", function (err, rows, fields) {

            if (err)
            {
                            //console.log('update ==>',rows)
                       callback({
                            success: false,
                            message: "Some error occured",
                            data: []
                        });
            }else
            {
                if (rows.length > 0) {
                    callback({
                                success: true,
                                message: "Events added successfully",
                                //LastID: rows.insertId,
                                data: JSON.parse(rows[0].event_data.replace(/\\"/g, '"'))
                            })

                }else{
                    callback({
                        success: false,
                        message: "No Events are there!",
                        data: []
                    })
                }         
            }
        }) */

    },
    getEventCompetition: async function (userparams, callback) {
        //API STOPED       
        var allEventCompetition = await event_competition(userparams.eventID);
        var responseList = JSON.parse(allEventCompetition);
        if (responseList.length > 0) {

            db.query("SELECT COUNT(event_id) AS count_num FROM `competition` WHERE event_id=? LIMIT 1", [userparams.eventID], function (err, rows, fields) {

                // console.log("competition",rows[0].count_num)
                if (rows[0].count_num > 0) {

                    db.query("Update competition set competition_json=? where event_id=?", [allEventCompetition, userparams.eventID], function (err, rows, fields) {
                        if (err) {
                            //console.log('update ==>',rows)
                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Competition update successfully",
                                LastID: userparams.eventID,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into competition (event_id,competition_json,status) values (?,?,?)", [userparams.eventID, allEventCompetition, 1], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {

                            // callback(null,rows.insertId);
                            callback({
                                success: true,
                                message: "Competition added successfully",
                                data: responseList
                            })
                        }
                    })

                }


            })






        } else {
            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }
/*         db.query("SELECT * FROM `competition` WHERE event_id=? LIMIT 1", [userparams.eventID], function (err, rows, fields) {
            if (err) {

                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {
                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Competition Fetch successfully",
                        //LastID: rows.insertId,
                        data: JSON.parse(rows[0].competition_json.replace(/\\"/g, '"'))
                    })

                } else {
                    callback({
                        success: false,
                        message: "No Competition are there!",
                        data: []
                    })
                }
            }
        }) */
    },
    getmatchBySereis: async function (userparams, callback) {


        //API STOPED

        var matchByCompetetion = await matchby_Competetion(userparams.eventID, userparams.competitionId);


        var responseList = JSON.parse(matchByCompetetion);

        if (responseList.length > 0) {
            db.query("SELECT matches.* FROM `matches` WHERE event_id=? AND competition_id=? LIMIT 1", [userparams.eventID, userparams.competitionId], function (err, rows, fields) {

                //console.log("matches",rows.length)
                if (rows.length > 0) {

                    db.query("Update matches set match_json=? where event_id=? AND competition_id=?", [matchByCompetetion, userparams.eventID, userparams.competitionId], function (err, rows, fields) {
                        if (err) {
                            //console.log('update ==>',rows)
                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Match update successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into matches (event_id,match_json,competition_id) values (?,?,?)", [userparams.eventID, matchByCompetetion, userparams.competitionId], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {

                            // callback(null,rows.insertId);
                            callback({
                                success: true,
                                message: "Match added successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }
                    })

                }


            })

        } else {

            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }

       

        /* db.query("SELECT matches.* FROM `matches` WHERE event_id=? AND competition_id=? LIMIT 1", [userparams.eventID, userparams.competitionId], function (err, rows, fields) {

            if (err) {

                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {

                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Match fetch successfully",
                        eventID: userparams.eventID,
                        compID: userparams.competitionId,
                        data: JSON.parse(rows[0].match_json.replace(/\\"/g, '"'))
                    })
                } else {
                    callback({
                        success: false,
                        message: "No data found",
                        data: []
                    });
                }
            }


        }) */

    },
    getmarketBymatch: async function (userparams, callback) {

        // API STOPED
        var fetchmarketMatch = await market_match(userparams.matcheventID);

        var responseList = JSON.parse(fetchmarketMatch);

        if (responseList.length > 0) {
            db.query("SELECT market.* FROM `market` WHERE match_event_id=? LIMIT 1", [userparams.matcheventID], function (err, rows, fields) {


                if (rows.length > 0) {

                    db.query("Update market set market_json=?,event_id=?,competetion_id=? where match_event_id=?", [fetchmarketMatch, userparams.eventID, userparams.competitionId, userparams.matcheventID], function (err, rows, fields) {
                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Market update successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into market (match_event_id,market_json,event_id,competetion_id) values (?,?,?,?)", [userparams.matcheventID, fetchmarketMatch, userparams.eventID, userparams.competitionId], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {


                            callback({
                                success: true,
                                message: "Market added successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }
                    })

                }


            })

        } else {

            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }
        /* db.query("SELECT market.* FROM `market` WHERE match_event_id=? LIMIT 1", [userparams.matcheventID], function (err, rows, fields) {
            if (err) {

                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {

                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Market fetch successfully",
                        eventID: userparams.eventID,
                        compID: userparams.competitionId,
                        data: JSON.parse(rows[0].market_json.replace(/\\"/g, '"'))
                    })

                } else {
                    callback({
                        success: false,
                        message: "No data found",
                        data: []
                    });
                }
            }

        }) */
    },

    getmarketByrunner: async function (userparams, callback) {
        // API STOPED 
        var fetch_market_runner = await marketRunner(userparams.marketID);
        var responseList = JSON.parse(fetch_market_runner);

        if (responseList.length > 0) {
            db.query("SELECT market_runner.* FROM `market_runner` WHERE market_id=? LIMIT 1", [userparams.marketID], function (err, rows, fields) {


                if (rows.length > 0) {

                    db.query("Update market_runner set runner_data=?,event_id=?,competetion_id=? where market_id=?", [fetch_market_runner, userparams.eventID, userparams.competitionId, userparams.marketID], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Market Runner update successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into market_runner (market_id,runner_data,event_id,competetion_id) values (?,?,?,?)", [userparams.marketID, fetch_market_runner, userparams.eventID, userparams.competitionId], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {


                            callback({
                                success: true,
                                message: "Market Runner added successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }
                    })

                }


            })

        } else {

            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }
        /* db.query("SELECT market_runner.* FROM `market_runner` WHERE market_id=? LIMIT 1", [userparams.marketID], function (err, rows, fields) {
            if (err) {

                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {

                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Market Runner added successfully",
                        eventID: userparams.eventID,
                        compID: userparams.competitionId,
                        data: JSON.parse(rows[0].runner_data.replace(/\\"/g, '"'))
                    })
                } else {
                    callback({
                        success: false,
                        message: "No data found",
                        data: []
                    });
                }


            }
        }) */
    },
    getmarketBookOD: async function (userparams, callback) {

        // API STOPED

        var market_bookODD = await book_odd(userparams.marketID);

        var responseList = JSON.parse(market_bookODD);
        
        if (responseList.length > 0) {
            db.query("SELECT market_odds.* FROM `market_odds` WHERE market_id=? LIMIT 1", [userparams.marketID], function (err, rows, fields) {

                
                if (rows.length > 0) {

                    db.query("Update market_odds set market_odd_data=?,event_id=?,competetion_id=? where market_id=?", [market_bookODD, userparams.eventID, userparams.competitionId, userparams.marketID], function (err, rows, fields) {
                        if (err) {
                            
                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Market Odds update successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into market_odds (market_id,market_odd_data,event_id,competetion_id) values (?,?,?,?)", [userparams.marketID, market_bookODD, userparams.eventID, userparams.competitionId], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {

                            // callback(null,rows.insertId);
                            callback({
                                success: true,
                                message: "Market Odds added successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }
                    })

                }


            })

        } else {

            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }


        /* db.query("SELECT market_odds.* FROM `market_odds` WHERE market_id=? LIMIT 1", [userparams.marketID], function (err, rows, fields) {
            if (err) {
                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {
                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Market Odds added successfully",
                        eventID: userparams.eventID,
                        compID: userparams.competitionId,
                        data: JSON.parse(rows[0].market_odd_data.replace(/\\"/g, '"'))
                    })
                } else {
                    callback({
                        success: false,
                        message: "No data found",
                        data: []
                    });
                }
            }

        }) */
    },

    getmarketBooksession: async function (userparams, callback) {

        // API STOPED

        var session_bookData = await marketBooksession(userparams.matchID);
        //console.log('session_bookData = >',session_bookData);
        var responseList = JSON.parse(session_bookData);
        //console.log('responseList ==>',responseList.length);
        if (responseList.length > 0) {
            db.query("SELECT session.* FROM `session` WHERE match_id=? LIMIT 1", [userparams.matchID], function (err, rows, fields) {

                //console.log("matches",rows.length)
                if (rows.length > 0) {

                    db.query("Update session set session_data=?,event_id=?,competetion_id=? where match_id=?", [session_bookData, userparams.eventID, userparams.competitionId, userparams.matchID], function (err, rows, fields) {
                        if (err) {
                            //console.log('update ==>',rows)
                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {
                            callback({
                                success: true,
                                message: "Session update successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }

                    })

                } else {
                    db.query("Insert into session (match_id,session_data,event_id,competetion_id) values (?,?,?,?)", [userparams.matchID, session_bookData, userparams.eventID, userparams.competitionId], function (err, rows, fields) {

                        if (err) {

                            callback({
                                success: false,
                                message: "Some error occured",
                                data: []
                            });
                        } else {

                            // callback(null,rows.insertId);
                            callback({
                                success: true,
                                message: "Session added successfully",
                                eventID: userparams.eventID,
                                compID: userparams.competitionId,
                                data: responseList
                            })
                        }
                    })

                }


            })

        } else {

            callback({
                success: false,
                message: "No data found",
                data: []
            });
        }

        /* db.query("SELECT session.* FROM `session` WHERE match_id=? LIMIT 1", [userparams.matchID], function (err, rows, fields) {
            if (err) {
                callback({
                    success: false,
                    message: "Some error occured",
                    data: []
                });
            } else {
                if (rows.length > 0) {
                    callback({
                        success: true,
                        message: "Session added successfully",
                        eventID: userparams.eventID,
                        compID: userparams.competitionId,
                        data: JSON.parse(rows[0].session_data.replace(/\\"/g, '"'))
                    })
                } else {
                    callback({
                        success: false,
                        message: "No data found",
                        data: []
                    });
                }
            }

        }) */

    },
    getmatchByScore: async function (userparams, callback) {
        request.get({
            headers: {
                'content-type': 'application/json'
            },
            url: ": http://178.62.105.201/api/v1/score?match_id=" + userparams.matchID,
            //form: JSON.stringify(req.body)
        }, function (error, response, body) {
            callback({
                success: true,
                data: body
            });
            // if(error){
            // 	reject(error)
            // }else{
            // 	resolve(body)
            // }

        });
    },

    getmatchInplay: async function (userparams, callback) {

        var inPlay = [];
        var allEventList = await event_list();

        var event_response = JSON.parse(allEventList);
        //console.log('event_response ==>',event_response);
        if (event_response.length > 0) {
            for (a = 0; a <= event_response.length - 1; a++) {
                var event_ID = event_response[a].eventType;
                //			console.log('event_id 1==>',event_ID);
                // var allEventCompetition = await event_competition(userparams.eventID);
                var allEventCompetition = await event_competition(event_ID);
                var eventCompetitionData = JSON.parse(allEventCompetition);
                //console.log('eventCompetitionData response ===>',eventCompetitionData);
                if (eventCompetitionData.length > 0) {
                    for (var j = 0; j <= eventCompetitionData.length - 1; j++) {
                        var competitionId = eventCompetitionData[j].competition.id;
                        var competitionName = eventCompetitionData[j].competition.name;

                        // var matchByCompetetion = await matchby_Competetion(userparams.eventID, competitionId);
                        var matchByCompetetion = await matchby_Competetion(event_ID, competitionId);
                        var matchCompetitionData = JSON.parse(matchByCompetetion);
                        //console.log('matchByCompetetion==>',matchCompetitionData);
                        if (matchCompetitionData.length > 0) {
                            for (var i = 0; i <= matchCompetitionData.length - 1; i++) {

                                //inPlay.push(matchCompetitionData[i].event);
                                let matcheventID = matchCompetitionData[i].event.id;
                                var matchName = matchCompetitionData[i].event.name;
                                var fetchmarketMatch = await market_match(matcheventID);
                                let fetchmarketMatchData = JSON.parse(fetchmarketMatch);
                                //console.log('fetchmarketMatch==>',fetchmarketMatchData);
                                if (fetchmarketMatchData.length > 0) {
                                    for (var k = 0; k <= fetchmarketMatchData.length - 1; k++) {
                                        //console.log('market ID==>',fetchmarketMatchData[k].marketId);
                                        let marketID = fetchmarketMatchData[k].marketId;
                                        var market_bookODD = await book_odd(marketID);
                                        let bookodd_data = JSON.parse(market_bookODD);
                                        // console.log('market_bookODD data==>',bookodd_data);
                                        if (bookodd_data.length > 0) {
                                            for (var m = 0; m <= bookodd_data.length - 1; m++) {

                                                if (bookodd_data[m].inplay == true) {
                                                    // console.log('market_bookODD inplay data event_ID==>',event_ID);
                                                    // console.log('market_bookODD inplay data competitionName==>',competitionName);
                                                    // console.log('market_bookODD inplay data matcheventID==>',matcheventID);
                                                    // console.log('market_bookODD inplay data matchName==>',matchName);
                                                    var responseObject = {
                                                        event_id: event_ID,
                                                        event_name: competitionName,
                                                        competetion_id: competitionId,
                                                        match_id: matcheventID,
                                                        match_name: matchName,
                                                        inPlay_data: bookodd_data[m]

                                                    }
                                                    inPlay.push(responseObject);
                                                    // var inplay_count = db.query("SELECT COUNT(event_id) AS count_num FROM `in_play` WHERE event_id=? LIMIT 1", [event_ID], function(err, rows, fields) {
                                                    //         if (!err) {
                                                    //             console.log('count_num ==>', rows[0].count_num);
                                                    //             if (rows[0].count_num > 0) {
                                                    //                 var inplay_update = db.query("Update in_play set inplay_data=? where event_id=?", [inPlay, event_ID], function(err, rows, fields) {
                                                    //                     if (err) {
                                                    //                         return;
                                                    //                     } else {
                                                    //                         console.log('update');
                                                    //                     }

                                                    //                 })
                                                    //             } else {
                                                    //                 var inplay_insert = db.query("Insert into in_play (event_id,inplay_data) values (?,?)", [event_ID, inPlay], function(err, rows, fields) {

                                                    //                     if (err) {
                                                    //                         return;
                                                    //                     } else {
                                                    //                         console.log('insert');
                                                    //                     }
                                                    //                 })
                                                    //             }
                                                    //         }


                                                    //     }) 
                                                    // console.log('market_bookODD inplay data==>',responseObject);
                                                    //inPlay.push(bookodd_data[m])

                                                }

                                            }
                                        }
                                    }
                                }
                            }
                        }

                    }
                    //console.log('inplay array ==>',inPlay)
                    // callback({
                    //     success: true,
                    //     result: inPlay
                    // })
                }
            }


            callback({
                success: true,
                result: inPlay
            })
        }
    },
    getmatchEventInplay: async function (userparams, callback) {

        var inPlay = [];
        var allEventCompetition = await event_competition(userparams.eventID);
        var eventCompetitionData = JSON.parse(allEventCompetition);

        if (eventCompetitionData.length > 0) {
            for (var j = 0; j <= eventCompetitionData.length - 1; j++) {
                var competitionId = eventCompetitionData[j].competition.id;
                var competitionName = eventCompetitionData[j].competition.name;

                var matchByCompetetion = await matchby_Competetion(userparams.eventID, competitionId);
                var matchCompetitionData = JSON.parse(matchByCompetetion);
                // console.log('matchByCompetetion==>',matchCompetitionData);
                if (matchCompetitionData.length > 0) {
                    for (var i = 0; i <= matchCompetitionData.length - 1; i++) {

                        //inPlay.push(matchCompetitionData[i].event);
                        let matcheventID = matchCompetitionData[i].event.id;
                        var matchName = matchCompetitionData[i].event.name;
                        var fetchmarketMatch = await market_match(matcheventID);
                        let fetchmarketMatchData = JSON.parse(fetchmarketMatch);
                        //console.log('fetchmarketMatch==>',fetchmarketMatchData);
                        if (fetchmarketMatchData.length > 0) {
                            for (var k = 0; k <= fetchmarketMatchData.length - 1; k++) {
                                //console.log('market ID==>',fetchmarketMatchData[k].marketId);
                                let marketID = fetchmarketMatchData[k].marketId;
                                var market_bookODD = await book_odd(marketID);
                                let bookodd_data = JSON.parse(market_bookODD);
                                // console.log('market_bookODD data==>',bookodd_data);
                                if (bookodd_data.length > 0) {
                                    for (var m = 0; m <= bookodd_data.length - 1; m++) {
                                        //console.log('market_bookODD inplay data==>',bookodd_data[m].inplay);
                                        if (bookodd_data[m].inplay == true) {

                                            var responseObject = {
                                                event_name: competitionName,
                                                competetion_id: competitionId,
                                                match_id: matcheventID,
                                                match_name: matchName,
                                                inPlay_data: bookodd_data[m],
                                                runner_details: fetchmarketMatchData

                                            }
                                            // console.log('market_bookODD inplay data==>',responseObject);
                                            //inPlay.push(bookodd_data[m])
                                            inPlay.push(responseObject)
                                        }

                                    }
                                }
                            }
                        }
                    }
                }

            }
            //console.log('inplay array ==>',inPlay)
            callback({
                success: true,
                result: inPlay
            })
        }

    },
    singlePlaceInfo: async function (betInfo, callback) {
        var check_availableBalance = await available_balanceInfo(betInfo.user_id);
        var profit = 0,
            loss = 0;
        var remain_balance = Math.abs(check_availableBalance.punter_balance - betInfo.current_exposure);
        if (betInfo.odd == 0) {
            profit = parseFloat((betInfo.place_odd - 1) * betInfo.stake);
            loss = parseFloat(betInfo.stake);
        } else {
            loss = parseFloat((betInfo.place_odd - 1) * betInfo.stake);
            profit = parseFloat(betInfo.stake);
        }
        var all_teams_exposure_data = [];
        for (var i = 0; i <= betInfo.runners.length - 1; i++) {
            if (betInfo.runners[i].runnerName == betInfo.runner_name) {
                var team_details = {
                    odd_type: betInfo.odd,
                    team_name: betInfo.runners[i].runnerName,
                    amount: betInfo.odd == 0 ? Math.abs(profit.toFixed(2)) : -Math.abs(loss.toFixed(2))
                }
                all_teams_exposure_data.push(team_details);
            } else {
                var team_details = {
                    odd_type: betInfo.odd == 0 ? 1 : 0,
                    team_name: betInfo.runners[i].runnerName,
                    amount: betInfo.odd == 0 ? -Math.abs(loss.toFixed(2)) : Math.abs(profit.toFixed(2))
                }
                all_teams_exposure_data.push(team_details);
            }
        }
        let sql = `INSERT INTO single_bet_info 
               (market_id,market_status, market_type,match_id,selection_id, market_start_time, market_end_time, description, event_name, user_id, bet_id, bet_status,exposure,runner_name,stake,odd,placed_odd,last_odd,p_and_l,amount, available_balance, protential_profit,user_ip,settled_time,all_teams_exposure_data,master_id,event_id,competition_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        var bet_insert = db.query(sql, [betInfo.market_id, betInfo.market_status, betInfo.market_type, betInfo.match_id, betInfo.selection_id, betInfo.market_start_time, betInfo.market_end_time, betInfo.description, betInfo.event_name, betInfo.user_id, betInfo.bet_id, betInfo.bet_status, betInfo.liability, betInfo.runner_name, betInfo.stake, betInfo.odd, betInfo.place_odd, betInfo.last_odd, betInfo.p_and_l, betInfo.amount, remain_balance, profit, betInfo.user_ip, betInfo.settled_time, JSON.stringify(all_teams_exposure_data), betInfo.master_id, betInfo.event_id, betInfo.competition_id], function (err, rows, fields) {
            console.log('query', bet_insert.sql);
            if (!err) {
                let net_exposure = check_availableBalance.net_exposure + betInfo.current_exposure;
                var query = db.query("Update punter set net_exposure=?,punter_balance=? where punter_id=?", [net_exposure, remain_balance, betInfo.user_id], function (err, rows, fields) {
                    if (!err) {
                        var responseObject = {}
                        callback({
                            success: true,
                            message: 'Bet placed success',
                            result: responseObject
                        })
                    } else {
                        callback({
                            success: false,
                            message: 'Some thing went wrong',
                            result: ''
                        })
                    }
                })

            } else {
                callback({
                    success: false,
                    message: 'Some thing went wrong',
                    result: ''
                })
            }
        })
    },
    singlePlaceInfoForFancy: async function (betInfo, callback) {
        var check_availableBalance = await available_balanceInfo(betInfo.user_id);
        var remain_balance = Math.abs(check_availableBalance.punter_balance - betInfo.current_exposure);
        let sql = `INSERT INTO single_bet_info 
               (market_id,market_status, market_type,match_id,selection_id, market_start_time, market_end_time, description, event_name,  user_id, bet_id, bet_status,exposure,runner_name,stake,odd,placed_odd,last_odd,p_and_l,amount, available_balance, protential_profit,user_ip,settled_time,all_teams_exposure_data,master_id,price,event_id,competition_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        var bet_insert = db.query(sql, [betInfo.market_id, betInfo.market_status, betInfo.market_type, betInfo.match_id, betInfo.selection_id, betInfo.market_start_time, betInfo.market_end_time, betInfo.description, betInfo.event_name, betInfo.user_id, betInfo.bet_id, betInfo.bet_status, betInfo.liability, betInfo.runner_name, betInfo.stake, betInfo.odd, betInfo.place_odd, betInfo.last_odd, betInfo.p_and_l, betInfo.amount, remain_balance, betInfo.profit, betInfo.user_ip, betInfo.settled_time, betInfo.minValueOfFancy, betInfo.master_id, betInfo.price, betInfo.event_id, betInfo.competition_id], function (err, rows, fields) {
            //console.log('query', bet_insert.sql);
            if (!err) {
                let net_exposure = check_availableBalance.net_exposure + betInfo.current_exposure;
                var query = db.query("Update punter set net_exposure=?,punter_balance=? where punter_id=?", [net_exposure, remain_balance, betInfo.user_id], function (err, rows, fields) {
                    if (!err) {
                        var responseObject = {}
                        callback({
                            success: true,
                            message: 'Bet placed success',
                            result: responseObject
                        })
                    } else {
                        callback({
                            success: false,
                            message: 'Some thing went wrong in update',
                            result: ''
                        })
                    }
                })

            } else {
                callback({
                    success: false,
                    message: 'Some thing went wrong insert',
                    result: ''
                })
            }
        })
    },
    getMaxBetMaxMarket: async function (userData, callback) {
        var event_info = await event_managementData(userData.event_id);
        callback({
            success: true,
            message: "Max bet max market info",
            result: event_info
        });
    },
    getMaxMarketSummation: async function (userData, callback) {
        db.query("SELECT sum(stake) as sum_of_max_market FROM single_bet_info WHERE market_status = 0 AND market_type=?", [userData.market_type], function (err, rows, fields) {
            if (!err) {
                var responseObject = 0;
                if (rows.length > 0) {
                    var responseObject = rows[0].sum_of_max_market;
                }
                callback({
                    success: true,
                    message: "summation of max market",
                    result: responseObject
                })
            } else {
                callback({
                    success: false,
                    message: "Something went wrong",
                    result: ''
                })
            }
        })
    },
    getbalanceDetails: async function (userData, callback) {
        var plunter = db.query("SELECT punter.* FROM punter WHERE punter_id=? LIMIT 1", [userData.user_id], function (err, rows, fields) {

            if (!err) {
                // console.log('user data',rows[0]);
                var responseObject = {
                    user_name: rows[0].punter_user_name,
                    available_balance: rows[0].punter_balance,
                    balance_limit: rows[0].punter_exposure_limit,
                    net_exposure: rows[0].net_exposure,
                    wining_amount: "0.00"

                }
                callback({
                    success: true,
                    message: "User Balance Details",
                    result: responseObject
                })
            } else {
                callback({
                    success: false,
                    message: "Something went wrong",
                    result: ''
                })
            }

        })
    },

    singleBetStatus: async function (userData, callback) {
        var marketStatus = 0, betStatus = 1;

        var bet_query = db.query("SELECT  `single_bet_info`.`single_bet_id`,`single_bet_info`.`odd`,`single_bet_info`.`placed_odd`,`single_bet_info`.`market_id`,`single_bet_info`.`match_id`,`single_bet_info`.`selection_id`,`single_bet_info`.`competition_id`,`single_bet_info`.`event_id` FROM `single_bet_info` WHERE market_status=? AND bet_status=?", [marketStatus, betStatus], function (err, rows, fields) {
            if (!err) {
                //console.log(rows)
                if (rows.length > 0) {
                    for (var i = 0; i <= rows.length - 1; i++) {
                        // console.log('odd value ==>',rows[i]);
                        //if(rows[i].odd == 0){
                        //console.log('odd value ==>',rows[i]);
                        var singleBetId = rows[i].single_bet_id;
                        var oddValue = rows[i].odd;
                        var eventID = rows[i].event_id;
                        var marketID = rows[i].market_id;
                        var matchID = rows[i].match_id;
                        var competitionID = rows[i].competition_id;
                        var selectionID = rows[i].selection_id;
                        var placedOdd = rows[i].placed_odd;
                        var inplay_query = db.query("SELECT `in_play`.`inplay_data` FROM `in_play` WHERE `event_id`=?", [eventID], function (err, rows, fields) {
                            if (!err) {
                                //console.log('inplay data',rows[0])
                                if (rows.length > 0) {
                                    //console.log('inplay data',rows[0].inplay_data)
                                    var result = JSON.parse(rows[0].inplay_data);
                                    for (var j = 0; j <= result.length - 1; j++) {

                                        if (result[j].event_id == eventID && result[j].competetion_id == competitionID && result[j].match_id == matchID) {
                                            //console.log('inplay data',result[j].inPlay_data);
                                            var inplayRes = result[j].inPlay_data;
                                            if (inplayRes.marketId == marketID) {
                                                //console.log('runners 1==>',inplayRes);
                                                if (inplayRes.runners.length > 0) {
                                                    var runnersArray = inplayRes.runners;
                                                    for (k = 0; k <= runnersArray.length - 1; k++) {
                                                        //console.log('runners 2==>',runnersArray[k].selectionId);
                                                        //console.log('selectionID 1==>',selectionID);
                                                        if (runnersArray[k].selectionId == selectionID) {
                                                            //console.log('runners 3==>',runnersArray[k]);
                                                            if (oddValue == 0) {
                                                                //Back
                                                                //console.log('Back',runnersArray[k].ex);
                                                                var y = runnersArray[k].ex.availableToBack[1].price;
                                                                //console.log('placed odd ==>',placedOdd+'<='+y);
                                                                if (y >= placedOdd) {
                                                                    betStatus = 0;
                                                                    //console.log('Back 0',betStatus);
                                                                    var update_bet = db.query("Update single_bet_info set bet_status=? where single_bet_id=?", [betStatus, singleBetId], function (err, rows, fields) {
                                                                        if (!err) {
                                                                            //  callback({success:true,Message:"Back bet status updated with 0"})
                                                                        } else {
                                                                            //callback({success:false,message:"Database Error Occured"})
                                                                        }
                                                                    })
                                                                } else {
                                                                    betStatus = 1;
                                                                    //console.log('Back 1',betStatus);
                                                                    var update_bet = db.query("Update single_bet_info set bet_status=? where single_bet_id=?", [betStatus, singleBetId], function (err, rows, fields) {
                                                                        if (!err) {
                                                                            //  callback({success:true,Message:"Back bet status updated with 1"})
                                                                        } else {
                                                                            //  callback({success:false,message:"Database Error Occured"})
                                                                        }
                                                                    })
                                                                }

                                                            } else {
                                                                //Lay
                                                                //console.log('Lay',runnersArray[k].ex);
                                                                var y = runnersArray[k].ex.availableToLay[1].price;
                                                                if (y <= placedOdd) {
                                                                    betStatus = 0;
                                                                    //console.log('Lay 0',betStatus);
                                                                    var update_bet = db.query("Update single_bet_info set bet_status=? where single_bet_id=?", [betStatus, singleBetId], function (err, rows, fields) {
                                                                        if (!err) {
                                                                            //  callback({success:true,Message:"Lay bet status updated with 0"})
                                                                        } else {
                                                                            //  callback({success:false,message:"Database Error Occured"})
                                                                        }
                                                                    })
                                                                } else {
                                                                    betStatus = 1;
                                                                    //console.log('Lay 1',betStatus);
                                                                    var update_bet = db.query("Update single_bet_info set bet_status=? where single_bet_id=?", [betStatus, singleBetId], function (err, rows, fields) {
                                                                        if (!err) {
                                                                            //callback({success:true,Message:"Lay bet status updated with 1"})
                                                                        } else {
                                                                            //callback({success:false,message:"Database Error Occured"})
                                                                        }
                                                                    })
                                                                }
                                                            }

                                                        }
                                                    }
                                                }
                                            }
                                            //callback({success:true,result:result[j].inPlay_data})
                                        }
                                    }
                                } else {
                                    callback({ success: false, message: "No Data Found" });
                                }
                            } else {
                                callback({ success: false, message: "Database Error Occured" })
                            }
                        })
                        //}
                    }
                } else {
                    callback({ success: false, message: "No Data Found" });
                }
            } else {
                callback({ success: false, message: "Database Error Occured" })
            }
        })
    },
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
    getmatchInplay1: async function (userparams, callback) {

        var inPlay = [];
        var allEventCompetition = await event_competition(userparams.eventID);
        var eventCompetitionData = JSON.parse(allEventCompetition);

        if (eventCompetitionData.length > 0) {
            for (var j = 0; j <= eventCompetitionData.length - 1; j++) {
                var competitionId = eventCompetitionData[j].competition.id;
                var competitionName = eventCompetitionData[j].competition.name;

                var matchByCompetetion = await matchby_Competetion(userparams.eventID, competitionId);
                var matchCompetitionData = JSON.parse(matchByCompetetion);
                // console.log('matchByCompetetion==>',matchCompetitionData);
                if (matchCompetitionData.length > 0) {
                    for (var i = 0; i <= matchCompetitionData.length - 1; i++) {

                        //inPlay.push(matchCompetitionData[i].event);
                        let matcheventID = matchCompetitionData[i].event.id;
                        var matchName = matchCompetitionData[i].event.name;
                        var fetchmarketMatch = await market_match(matcheventID);
                        let fetchmarketMatchData = JSON.parse(fetchmarketMatch);
                        //console.log('fetchmarketMatch==>',fetchmarketMatchData);
                        if (fetchmarketMatchData.length > 0) {
                            for (var k = 0; k <= fetchmarketMatchData.length - 1; k++) {
                                //console.log('market ID==>',fetchmarketMatchData[k].marketId);
                                let marketID = fetchmarketMatchData[k].marketId;
                                var market_bookODD = await book_odd(marketID);
                                let bookodd_data = JSON.parse(market_bookODD);
                                // console.log('market_bookODD data==>',bookodd_data);
                                if (bookodd_data.length > 0) {
                                    for (var m = 0; m <= bookodd_data.length - 1; m++) {
                                        //console.log('market_bookODD inplay data==>',bookodd_data[m].inplay);
                                        if (bookodd_data[m].inplay == true) {

                                            var responseObject = {
                                                event_name: competitionName,
                                                competetion_id: competitionId,
                                                match_id: matcheventID,
                                                match_name: matchName,
                                                inPlay_data: bookodd_data[m]

                                            }
                                            // console.log('market_bookODD inplay data==>',responseObject);
                                            //inPlay.push(bookodd_data[m])
                                            inPlay.push(responseObject)
                                        }

                                    }
                                }
                            }
                        }
                    }
                }

            }
            //console.log('inplay array ==>',inPlay)
            callback({
                success: true,
                result: inPlay
            })
        }

    },

}


module.exports = userController;