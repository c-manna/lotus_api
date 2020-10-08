const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);

const bcrypt = require('bcrypt');
const _ = require('lodash');
const moment = require("moment");

const matchService = require("../services/matchService");

//const validator = require("../middleware/validator");
// http://172.105.38.170:8000/fetch-market-odds?eventID=4&competitionId=11365612&marketID=1.171958107
module.exports = {

    placeBet: async(req, res, next) => {
        try {
            const userId = "2750231N007";
            const userData = await query("SELECT * from punter where punter_id =?", [userId]);
            if (!(userData && userData.length)) return next("User data not found");
            const reqData = {...req.body,
                user_id: userId,
                bet_status: 1
            };
            let result = await query('INSERT INTO single_bet_info SET ?', reqData);
            console.log(result.insertId);
            return res.send({
                success: true,
                message: "Bet placed success",
                data: result
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            })
        }
    },

    getSetting: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        try {
            const setting = await query("SELECT * from settings where user_id =?", [userId]);
            return res.send({
                success: true,
                data: ((setting && setting.length) ? setting[0] : {}),
                systemTime: new Date()
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    updateSetting: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        try {
            const setting = await query('UPDATE settings SET ? WHERE ?', [req.body, {
                user_id: userId
            }]);
            return res.send({
                success: true,
                message: "Setting data updated"
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    updatePassword: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        if (!req.body.password) return next("Old password is required");
        if (!req.body.newPassword) return next("New password is required");
        try {
            let user = await query("SELECT * from punter where punter_id =?", [userId]);
            if (!(user && user.length)) return next("User data not found");
            let hash = user[0].punter_password;
            hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
            const bcryptPassword = util.promisify(bcrypt.compare);
            const matchPassword = await bcryptPassword(req.body.password, hash);
            if (!matchPassword) return next("Password not matched");
            let hashPassword = user[0].punter_password;
            const updatePassword = await query('UPDATE punter SET ? WHERE ?', [{
                punter_password: hashPassword
            }, {
                punter_id: userId
            }]);
            return res.send({
                success: true,
                message: "Password update success"
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    openBet: async(req, res, next) => {
        const userId = req.decoded.punter_id,
            marketId = req.query.market_id;
        try {
            let sqlQuery = "SELECT * FROM single_bet_info WHERE market_status =? AND user_id =?";
            if (marketId) sqlQuery = "SELECT * FROM single_bet_info WHERE market_status =? AND user_id =? AND market_id =?";
            let dataList = await query(sqlQuery, [0, userId, marketId]);
            return res.send({
                success: true,
                data: dataList
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    profitLossBet: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        let startDate = new Date(new Date().setDate(new Date().getDate() - 7))
        let endDate = new Date();
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(parseInt(req.query.startDate));
            endDate = new Date(parseInt(req.query.endDate));
        }
        // console.log(startDate, endDate, req.query.startDate, req.query.endDate);
        try {
            let sqlQuery = "SELECT * FROM single_bet_info WHERE settled_time BETWEEN ? AND ? AND market_status = ? AND user_id= ?";
            let dataList = await query(sqlQuery, [startDate, endDate, 1, userId]); //params need to be changed

            var groupedByDate = _.groupBy(dataList, function(item) {
                return item.bet_time.toString().substring(0, 15);
            });
            let newData = [];
            for (let key in groupedByDate) {
                newData.push({
                    item: key,
                    value: groupedByDate[key]
                });
            }

            return res.send({
                success: true,
                data: newData
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },


    profitLossDetails: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        const marketId = req.params.marketId;
        try {
            let dataList = await query("SELECT * FROM single_bet_info WHERE market_status =? AND user_id =? AND market_id =?", [1, userId, marketId]);
            return res.send({
                success: true,
                data: dataList
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    getUserCommision: async(req, res, next) => {
        const userId = req.decoded.punter_id;
        try {
            let dataList = await query("SELECT punter_commission, punter_balance, punter_balance_type FROM punter WHERE punter_id =?", [userId]);
            return res.send({
                success: true,
                data: dataList[0]
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    transferStatment: async(req, res, next) => {
        const page = parseInt(!isNaN(req.query.page) ? req.query.page : 1),
            limit = parseInt(!isNaN(req.query.limit) ? req.query.limit : 25),
            userId = req.decoded.punter_id;
        let startDate = new Date("01/01/2020")
        let endDate = new Date();
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(parseInt(req.query.startDate));
            endDate = new Date(parseInt(req.query.endDate));
        }
        let balanceStatement = [],
            transferStatement = [],
            betStatement = [];
        let query1 = "SELECT amount, (bs_date) AS date, bs_id, master_id, punter_id, type, user_type FROM balance_statement WHERE punter_id =? AND bs_date BETWEEN ? AND ? ";
        let query2 = "SELECT amount, master_id, p_and_l, payment_given_to, payment_receive_from, punter_id, remarks, (transfer_date) AS date, transfer_time, ts_id FROM transfer_statement WHERE punter_id =? AND transfer_date BETWEEN ? AND ? ";
        let query3 = "SELECT single_bet_id, market_id, match_id, selection_id, market_status, market_type, market_start_time, market_end_time, description, event_name, bet_time, user_id, bet_id, bet_status, exposure, runner_name, stake, odd, placed_odd, last_odd, profit_team_data, loss_team_data, p_and_l, amount, available_balance, protential_profit, user_ip, (settled_time) AS date FROM single_bet_info WHERE user_id =? AND market_status=? AND settled_time BETWEEN ? AND ?";
        console.log(req.body.filter);
        try {
            if (req.body.filter) {
                if (req.body.filter.balance_statement && req.body.filter.type) {
                    query1 = "SELECT amount, (bs_date) AS date, bs_id, master_id, punter_id, type, user_type FROM balance_statement WHERE punter_id =? AND bs_date BETWEEN ? AND ? AND type= ?";
                    balanceStatement = await query(query1, [userId, startDate, endDate, req.body.filter.type]);
                } else if (req.body.filter.transfer_statement) {
                    query2 = "SELECT amount, master_id, p_and_l, payment_given_to, payment_receive_from, punter_id, remarks, (transfer_date) AS date, transfer_time, ts_id FROM transfer_statement WHERE punter_id =? AND transfer_date BETWEEN ? AND ? AND p_and_l =?";
                    transferStatement = await query(query2, [userId, startDate, endDate, req.body.filter.p_and_l]);
                } else if (req.body.filter.balance_statement && req.body.filter.transfer_statement) {
                    query1 = "SELECT amount, (bs_date) AS date, bs_id, master_id, punter_id, type, user_type FROM balance_statement WHERE punter_id =? AND bs_date BETWEEN ? AND ? AND user_type =?";
                    query2 = "SELECT amount, master_id, p_and_l, payment_given_to, payment_receive_from, punter_id, remarks, (transfer_date) AS date, transfer_time, ts_id FROM transfer_statement WHERE punter_id =? AND transfer_date BETWEEN ? AND ? AND user_type= ?";
                    balanceStatement = await query(query1, [userId, startDate, endDate, req.body.filter.user_type]);
                    // transferStatement = await query(query2, [userId, startDate, endDate, req.body.filter.user_type]);
                } else if (req.body.filter.single_bet_info) {
                    betStatement = await query(query3, [userId, 1, startDate, endDate]);
                }
            } else {
                balanceStatement = await query(query1, [userId, startDate, endDate]);
                transferStatement = await query(query2, [userId, startDate, endDate]);
                betStatement = await query(query3, [userId, 1, startDate, endDate]);
            }
            const dataList = [...balanceStatement, ...transferStatement, ...betStatement];
            const count = dataList.length;
            const sortData = _.sortBy(dataList, function(o) {
                return new moment(o.date);
            }).reverse();
            return res.send({
                success: true,
                data: sortData.splice((page - 1) * limit, limit),
                count: count
            });
        } catch (err) {
            console.log(err)
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    getBookmaker: async(req, res, next) => {
        const eventId = req.params.eventId;
        const competitionId = req.params.competitionId;
        const matchId = req.params.matchId;
        const status = (req.query.status ? req.query.status : 1);
        let sqlQuery = "SELECT status, details, market_id FROM bookmaker WHERE event_id= ? AND competition_id= ? AND match_id= ? AND status= ?";
        try {
            let dataList = await query(sqlQuery, [eventId, competitionId, matchId, status]);
            return res.send({
                success: true,
                data: (dataList && dataList.length && dataList[0].details) ? [{
                    details: JSON.parse(dataList[0].details),
                    marketId: dataList[0].market_id
                }] : []
            });
        } catch (err) {
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    inplayMatch: async(req, res, next) => {
        const eventId = req.query.eventID;
        let sqlQuery = "SELECT * FROM in_play";
        if (eventId) sqlQuery = "SELECT * FROM in_play WHERE event_id= ?";
        try {
            let dataList = await query(sqlQuery, [eventId]);
            for (let i = 0; i < dataList.length; i++) {
                // console.log('inplayMatch==>', dataList[i].inplay_data, JSON.parse(dataList[i].inplay_data))
                if (dataList[i].inplay_data) dataList[i].inplay_data = JSON.parse(dataList[i].inplay_data);
                // if (dataList[i].inplay_data) dataList[i].inplay_data = dataList[i].inplay_data;
            }
            return res.send({
                success: true,
                data: ((eventId) ? ((dataList.length) ? dataList[0] : {}) : dataList)
            });
        } catch (err) {
            console.log(err);
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    getmatchInplay: async(req, res, next) => {
        let inPlay = [];
        try {
            const allEventList = await matchService.event_list();
            const event_response = JSON.parse(allEventList);
            for (let a = 0; a < event_response.length; a++) {
                const event_ID = event_response[a].eventType;
                let eachItem = {
                    eventId: event_ID,
                    data: []
                };
                const allEventCompetition = await matchService.event_competition(event_ID);
                const eventCompetitionData = JSON.parse(allEventCompetition);
                for (let j = 0; j < eventCompetitionData.length; j++) {
                    const competitionId = eventCompetitionData[j].competition.id;
                    const competitionName = eventCompetitionData[j].competition.name;
                    const matchByCompetetion = await matchService.matchby_Competetion(event_ID, competitionId);
                    const matchCompetitionData = JSON.parse(matchByCompetetion);
                    for (let i = 0; i < matchCompetitionData.length; i++) {
                        const matcheventID = matchCompetitionData[i].event.id;
                        const matchName = matchCompetitionData[i].event.name;
                        const fetchmarketMatch = await matchService.market_match(matcheventID);
                        const fetchmarketMatchData = JSON.parse(fetchmarketMatch);
                        for (let k = 0; k < fetchmarketMatchData.length; k++) {
                            const marketID = fetchmarketMatchData[k].marketId;
                            const market_bookODD = await matchService.book_odd(marketID);
                            const bookodd_data = JSON.parse(market_bookODD);
                            for (let m = 0; m < bookodd_data.length; m++) {
                                if (bookodd_data[m].inplay == true) {
                                    const responseObject = {
                                        event_id: event_ID,
                                        event_name: competitionName,
                                        competetion_id: competitionId,
                                        match_id: matcheventID,
                                        match_name: matchName,
                                        inPlay_data: bookodd_data[m]
                                    }
                                    const index = eachItem.data.findIndex(item => {
                                        return (item.match_id == responseObject.match_id && item.competetion_id == responseObject.competetion_id)
                                    });
                                    if (index < 0)
                                        eachItem.data.push(responseObject);
                                }
                            }
                        }
                    }
                }
                inPlay.push(eachItem);
            }
            for (let i = 0; i < inPlay.length; i++) {
                let sqlQuery = "REPLACE INTO in_play (event_id, inplay_data) VALUES(?, ?)";
                await query(sqlQuery, [inPlay[i].eventId, JSON.stringify(inPlay[i].data)]);
            }
            return res.send({
                success: true,
                data: inPlay
            })
        } catch (err) {
            console.log(err);
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    },

    myMarket: async(req, res, next) => {
        const userId = req.decoded.punter_id
            // let sqlQuery = "SELECT single_bet_id, market_id, match_id, selection_id, market_status, market_type, market_start_time, market_end_time, description, event_name, bet_time, user_id, bet_id, bet_status, exposure, runner_name, stake, odd, placed_odd, last_odd, p_and_l, amount, available_balance, protential_profit, user_ip, settled_time FROM single_bet_info WHERE market_status =? AND user_id =? GROUP BY market_id";
        let sqlQuery = "SELECT market_id, market_status, user_id, event_name, description, event_id, competition_id, match_id FROM single_bet_info WHERE market_status =? AND user_id =? GROUP BY market_id, event_name, description, market_id, event_id, competition_id, match_id";
        try {
            let dataList = await query(sqlQuery, [0, userId]);
            return res.send({
                success: true,
                data: dataList
            });
        } catch (err) {
            return res.send({
                success: false,
                message: "something went wrong",
                err: err
            });
        }
    }

};