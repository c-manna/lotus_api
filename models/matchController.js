var db = require('../dbconnection');

module.exports = {

 placeBet: async (req, res, next) => {
  console.log("called");
  try {
   let sql = `INSERT INTO single_bet_info 
   (market_id,market_status, market_type, market_start_time, market_end_time, description, event_name, bet_time, user_id, bet_id, bet_status,exposure,runner_name,stake,odd,placed_odd,last_odd,p_and_l,amount, available_balance, protential_profit,user_ip,settled_time)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
   let result = await db.query(sql, [req.body.market_id, req.body.market_status, req.body.market_type, req.body.market_start_time, req.body.market_end_time, req.body.description, req.body.event_name, req.body.bet_time, req.body.user_id, req.body.bet_id, req.body.bet_status, req.body.exposure, req.body.runner_name, req.body.stake, req.body.odd, req.body.placed_odd, req.body.last_odd, req.body.p_and_l, req.body.amount, req.body.available_balance, req.body.protential_profit, req.body.user_ip, req.body.settled_time]);
   console.log(result);
   return res.send({
    success: true,
    message: "Bet placed success",
    // data: result
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