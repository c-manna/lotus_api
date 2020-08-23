'use strict';

const cron = require('node-cron');
const matchService = require("../services/matchService");

cron.schedule('* * * * *', async () => {
  console.log('running a task every minute');
  let inPlay = [];
  try {
    const allEventList = await matchService.event_list();
    const event_response = JSON.parse(allEventList);
    for (let a = 0; a < event_response.length; a++) {
      const event_ID = event_response[a].eventType;
      let eachItem = { eventId: event_ID, data: [] };
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
                const index = eachItem.data.findIndex(item => { return (item.match_id == responseObject.match_id && item.competetion_id == responseObject.competetion_id) });
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
  } catch (err) {
    console.log(err);
  }
});