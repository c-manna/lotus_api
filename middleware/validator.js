const Validator = require('validatorjs');

let createBateData = {
 "market_id": "required",
 "market_status": "required",
 "market_type": "required",
 "market_start_time": "required",
 "market_end_time": "required",
 "description": "required",
 "event_name": "required",
 "bet_id": "required",
 "exposure": "required",
 "runner_name": "required",
 "stake": "required",
 "odd": "required",
 "placed_odd": "required",
 "last_odd": "required",
 "p_and_l": "required",
 "amount": "required",
 "available_balance": "required",
 "protential_profit": "required",
 "user_ip": "required",
 "settled_time": "required"
};

exports.checkBetData = (data) => {
 let validation = new Validator(data, createBateData);
 console.log("validation==", validation.passes());
}