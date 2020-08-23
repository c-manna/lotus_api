// var db = require('../dbconnection');
var request = require('request');
// const util = require('util');
// const query = util.promisify(db.query).bind(db);


exports.event_list = () => {
  return new Promise(function (resolve, reject) {
    request.get({
      headers: {
        'content-type': 'application/json'
      },
      url: "http://178.62.105.201/api/v1/fetch_data?Action=listEventTypes",
    }, function (error, response, body) {
      if (error) {
        reject(error)
      } else {
        resolve(body)
      }
    });
  });
}

exports.event_competition = (eventID) => {
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

exports.matchby_Competetion = (eventID, competitionId) => {
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

exports.market_match = (matcheventID) => {
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

exports.marketRunner = (marketID) => {
  return new Promise(function (resolve, reject) {
    request.get({
      headers: {
        'content-type': 'application/json'
      },
      url: "http://178.62.105.201/api/v1/fetch_data?Action=listMarketRunner&MarketID=" + marketID,
    }, function (error, response, body) {
      if (error) {
        reject(error)
      } else {
        resolve(body)
      }
    });
  })
}

exports.book_odd = (marketID) => {
  return new Promise(function (resolve, reject) {
    request.get({
      headers: {
        'content-type': 'application/json'
      },
      url: "http://178.62.105.201/api/v1/listMarketBookOdds?market_id=" + marketID,
    }, function (error, response, body) {
      if (error) {
        reject(error)
      } else {
        resolve(body)
      }
    });
  })
}

exports.marketBooksession = (matchID) => {
  return new Promise(function (resolve, reject) {
    request.get({
      headers: {
        'content-type': 'application/json'
      },
      url: "http://178.62.105.201/api/v1/listMarketBookSession?match_id=" + matchID,
    }, function (error, response, body) {
      if (error) {
        reject(error)
      } else {
        resolve(body)
      }
    });
  })
}

exports.netExposure = (userId) => {
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

exports.available_balanceInfo = (userId) => {
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

exports.event_managementData = (eventID, marketType) => {
  return new Promise(function (resolve, reject) {
    db.query("SELECT * FROM event_management WHERE event=? AND market=? LIMIT 1", [eventID, marketType], function (err, rows, fields) {
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