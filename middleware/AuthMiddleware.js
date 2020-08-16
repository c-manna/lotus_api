const jwt = require("jsonwebtoken");
const util = require('util');
const config = require("../config");

exports.checkToken = async (req, res, next) => {
 const token = req.body.token || req.headers['authorization'] || req.params.token || req.query.token;
 if (!token) return next("Token is required");
 try {
  const decoded = await util.promisify(jwt.verify)(token.slice(7), config.JWT.JWT_USER_SECRET);
  req.decoded = decoded;
  return next();
 } catch (err) {
  return next("Something went wrong");
 }
}