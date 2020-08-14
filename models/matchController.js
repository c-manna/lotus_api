const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);

const bcrypt = require('bcrypt');

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
    data: ((setting && setting.length) ? setting[0] : {})
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
   // });
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
