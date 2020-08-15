const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);

const bcrypt = require('bcrypt');
const _ = require('lodash');

//const validator = require("../middleware/validator");
// http://172.105.38.170:8000/fetch-market-odds?eventID=4&competitionId=11365612&marketID=1.171958107
module.exports = {

 placeBet: async (req, res, next) => {
  try {
   const userId = "2750231N007";
   const userData = await query("SELECT * from punter where punter_id =?", [userId]);
   if (!(userData && userData.length)) return next("User data not found");
   const reqData = { ...req.body, user_id: userId, bet_status: 1 };
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

 getSetting: async (req, res, next) => {
  const userId = "2750231N007";
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

 updateSetting: async (req, res, next) => {
  const userId = "2750231N007";
  try {
   const setting = await query('UPDATE settings SET ? WHERE ?', [req.body, { user_id: userId }]);
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

 updatePassword: async (req, res, next) => {
  const userId = "2750231N007";
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
   const updatePassword = await query('UPDATE punter SET ? WHERE ?', [{ punter_password: hashPassword }, { punter_id: userId }]);
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

 openBet: async (req, res, next) => {
  const userId = "8349711Z001";
  try {
   let dataList = await query("SELECT * FROM single_bet_info WHERE market_status =? AND user_id =?", [0, userId]);
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

 profitLossBet: async (req, res, next) => {
  const userId = "8349711Z001";
  let startDate = new Date(new Date().setDate(new Date().getDate() - 7))
  let endDate = new Date();
  if (req.query.startDate && req.query.endDate) {
   startDate = new Date(req.query.startDate);
   endDate = new Date(req.query.endDate);
  }
  console.log(startDate, endDate);
  try {
   // let sqlQuery = "SELECT DATE(bet_time) as bet_time,GROUP_CONCAT(JSON_OBJECT('bet_time',bet_time)) as groupData from single_bet_info group by DATE(single_bet_info.bet_time)";
   let sqlQuery = "SELECT * FROM single_bet_info WHERE settled_time BETWEEN ? AND ? AND market_status = ? AND user_id= ?";

   // let sqlQuery = "select * from(SELECT market_status,user_id,bet_time, JSON_OBJECT('bet_id',bet_id,'amount',amount) from single_bet_info group by DATE(single_bet_info.bet_time) )as T where user_id = '2750231N005' and market_status = 1"
   // let sqlQuery = "SELECT JSON_OBJECT('bet_id',bet_id,'amount',amount) from single_bet_info group by DATE(single_bet_info.bet_time)"
   // let sqlQuery = "SELECT DISTINCT  settled_time,market_id,market_type,description,market_start_time,settled_time,bet_id FROM single_bet_info WHERE settled_time BETWEEN '2020-08-03' AND '2020-08-15' AND market_status = '1' AND user_id= '2750231N005'";
   // var jsonBody = JSON.parse(proposalBody.proposal_raw_json.replace(/(\r\n|\n|\r)/gm, ""));
   // let sqlQuery = "SELECT market_id,GROUP_CONCAT (CONCAT('{name:', bet_time ,'}')) as groupData from single_bet_info group by market_id"
   // let sqlQuery = "SELECT market_id,CONCAT('[',GROUP_CONCAT(JSON_OBJECT('bet_time',bet_time)),']') as groupData from single_bet_info group by market_id"
   // let sqlQuery = "SELECT * FROM ( SELECT * FROM single_bet_info GROUP BY date(bet_time) ) AS sub ORDER BY bet_time ASC ";
   // let sqlQuery = "SELECT DATE(bet_time), market_id, market_type FROM single_bet_info GROUP BY DATE(single_bet_info.bet_time), market_id, market_type;"
   // // let dataList = await query("SELECT * FROM single_bet_info WHERE market_status =? AND user_id =?", [0, userId]);
   let dataList = await query(sqlQuery, [startDate, endDate, 0, userId]); //params need to be changed
   // // let test = JSON.stringify(dataList)
   // // obj2 = {};
   // // for (const key of Object.getOwnPropertyNames(dataList)) {
   // //  obj2[key.replace(/[|&;$%@.:"<>()+,]/g, "")] = dataList[key];
   // // }
   // // const newArray = [];
   // for (let i = 0; i < dataList.length; i++) {
   //  // let jsonData = JSON.parse(dataList[i].groupData.replace(/\\\([^\)\(]*\)/, ""));
   //  let jsonData = JSON.parse(dataList[i].groupData);
   //  dataList[i].groupData = jsonData;
   // }

   var groupedByDate = _.groupBy(dataList, function (item) {
    return item.bet_time.toString().substring(0, 15);
   });
   let newData = [];
   for (let key in groupedByDate) {
    newData.push({ item: key, value: groupedByDate[key] });
   }


   // for (let key in groupedByDate) {
   //  const eachItem = groupedByDate[key];
   //  var groupByMarket = await _.groupBy(eachItem, function (item) {
   //   return item.market_id;
   //  });
   //  groupedByDate[key]['groupByMarket'] = groupByMarket;
   //  console.log(groupByMarket)
   // }




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


 profitLossDetails: async (req, res, next) => {
  const userId = "8349711Z001";
  const marketId = req.params.marketId;
  // let sqlQuery = "SELECT DATE(bet_time) as bet_time,JSON_ARRAY(GROUP_CONCAT(JSON_OBJECT('bet_time',bet_time))) as groupData from single_bet_info group by DATE(single_bet_info.bet_time)"
  try {
   let dataList = await query("SELECT * FROM single_bet_info WHERE market_status =? AND user_id =? AND market_id =?", [0, userId, marketId]);
   // let dataList = await query("SELECT * FROM single_bet_info WHERE market_status =? ", [0, userId, marketId]);
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

 getUserCommision: async (req, res, next) => {
  const userId = req.decoded.punter_id;
  try {
   let dataList = await query("SELECT punter_commission FROM punter WHERE punter_id =?", [userId]);
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
 }

};
