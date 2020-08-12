const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);

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
   })
  } catch (err) {
   console.log(err)
   return res.send({
    success: false,
    message: "something went wrong",
    err: err
   })
  }
 }

};