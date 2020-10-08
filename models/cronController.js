'use strict';
const util = require('util');
var db = require('../dbconnection');
const query = util.promisify(db.query).bind(db);
const cron = require('node-cron');
const matchService = require("../services/matchService");

cron.schedule('* * * * *', async() => {
    console.log('running a task every minute');
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
            let output = await query(sqlQuery, [inPlay[i].eventId, JSON.stringify(inPlay[i].data), inPlay[i].eventId]);
            console.log("output==", output);
        }
    } catch (err) {
        console.log("error==", err);
    }
});

cron.schedule('* * * * *', async() => {
    console.log("corn start")
    const marketStatus = 0,
        betStatus = 1;

    try {
        let betList = await query("SELECT  `single_bet_info`.`single_bet_id`,`single_bet_info`.`odd`,`single_bet_info`.`placed_odd`,`single_bet_info`.`market_id`,`single_bet_info`.`match_id`,`single_bet_info`.`selection_id`,`single_bet_info`.`competition_id`,`single_bet_info`.`event_id` FROM `single_bet_info` WHERE market_status=? AND bet_status=?", [marketStatus, betStatus]);
        console.log("unmatched bets count==", betList.length)
        for (let i = 0; i < betList.length; i++) {
            let singleBetId = betList[i].single_bet_id;
            let oddValue = betList[i].odd;
            let eventID = betList[i].event_id;
            let marketID = betList[i].market_id;
            let matchID = betList[i].match_id;
            let competitionID = betList[i].competition_id;
            let selectionID = betList[i].selection_id;
            let placedOdd = betList[i].placed_odd;
            let inPlayData = await query("SELECT `in_play`.`inplay_data` FROM `in_play` WHERE `event_id`=?", [eventID]);
            if (inPlayData.length) {
                let result = JSON.parse(inPlayData[0].inplay_data);
                for (let j = 0; j < result.length; j++) {
                    if (result[j].event_id == eventID && result[j].competetion_id == competitionID && result[j].match_id == matchID) {
                        let inplayRes = result[j].inPlay_data;
                        if (inplayRes.marketId == marketID) {
                            if (inplayRes.runners.length) {
                                let runnersArray = inplayRes.runners;
                                for (k = 0; k < runnersArray.length; k++) {
                                    let betStatus = 1;
                                    if (runnersArray[k].selectionId == selectionID) {
                                        if (oddValue == 0) {
                                            let y = runnersArray[k].ex.availableToBack[1].price;
                                            if (y >= placedOdd) betStatus = 0;
                                            else betStatus = 1;
                                        } else {
                                            let y = runnersArray[k].ex.availableToLay[1].price;
                                            if (y <= placedOdd) betStatus = 0;
                                            else betStatus = 1;
                                        }
                                        if (betStatus == 0)
                                            await query("Update single_bet_info set bet_status=? where single_bet_id=?", [betStatus, singleBetId]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log("error single_bet_info==", err);
    }
});