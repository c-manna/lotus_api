var db = require('../dbconnection');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var rp = require('request-promise');

var userModel = require('../models/userController');
const matchController = require('../models/matchController');
const AuthMiddleware = require("../middleware/AuthMiddleware");
/****** Login*******/
//http://172.105.38.170:8000/login
router.post('/login', function (req, res) {
    userModel.userlogin(req.body, function (response) {
        res.json(response);
    })
})

/**** 1. Sport URL: ***/
router.get('/event', function (req, res) {
    //http://172.105.38.170:8000/event?id=
    userModel.getEventFetch(req.query, function (response) {
        res.json(response);
    })

})

/*** 2. Fetch series as per sport ****/
router.get('/event-competition', function (req, res) {

    //http://172.105.38.170:8000/event-competition?eventID=1&status=1

    //console.log('query params',req.query)

    userModel.getEventCompetition(req.query, function (response) {
        res.json(response);
    })

})

/*** 3. Fetch matches via series ID and Sport Id ****/
router.get('/fetch-match-series', function (req, res) {

    //http://172.105.38.170:8000/fetch-match-series?eventID=1&competitionId=



    userModel.getmatchBySereis(req.query, function (response) {
        res.json(response);
    })

})

/**** 4. Fetch markets as per match code ***/


router.get('/fetch-market-match', function (req, res) {

    //http://172.105.38.170:8000/fetch-market-match?matcheventID=1

    //console.log('query params',req.query)

    userModel.getmarketBymatch(req.query, function (response) {
        res.json(response);
    })

})

/** 5.*****/


router.get('/fetch-market-runner', function (req, res) {

    //http://172.105.38.170:8000/fetch-market-runner?marketID=1

    //console.log('query params',req.query)

    userModel.getmarketByrunner(req.query, function (response) {
        res.json(response);
    })

})
router.get('/fetch-market-odds', function (req, res) {

    //http://172.105.38.170:8000/fetch-market-odds?marketID=1

    //console.log('query params',req.query)

    userModel.getmarketBookOD(req.query, function (response) {
        res.json(response);
    })

})

router.get('/fetch-market-books', function (req, res) {

    //http://172.105.38.170:8000/fetch-market-books?matchID=1

    //console.log('query params',req.query)

    userModel.getmarketBooksession(req.query, function (response) {
        res.json(response);
    })

})

router.get('/fetch-match-score', function (req, res) {

    userModel.getmatchByScore(req.query, function (response) {
        res.json(response);
    })

})

router.get('/fetch-inplay', function (req, res) {
    //http://172.105.38.170:8000/fetch-inplay/?eventID=1
    userModel.getmatchInplay(req.query, function (response) {
        res.json(response);
    })

})
router.post("/single-place-bet", function (req, res) {

    userModel.singlePlaceInfo(req.body, function (response) {
        res.json(response);
    })
})

router.post('/getexposure', function (req, res) {
    userModel.getExposure(req.body, function (response) {
        res.json(response);
    })
})

router.post('/getbalanceDetails', function (req, res) {
    userModel.getbalanceDetails(req.body, function (response) {
        res.json(response);
    })
})


router.get("/setting", AuthMiddleware.checkToken, matchController.getSetting);
router.post("/update-setting", AuthMiddleware.checkToken, matchController.updateSetting);
router.post("/update-password", AuthMiddleware.checkToken, matchController.updatePassword);
router.get("/open-bet", AuthMiddleware.checkToken, matchController.openBet);
router.get("/profit-loss-bet", AuthMiddleware.checkToken, matchController.profitLossBet);
router.get("/profit-loss-details/:marketId", AuthMiddleware.checkToken, matchController.profitLossDetails);
router.get("/user-commision", AuthMiddleware.checkToken, matchController.getUserCommision);

router.get("/user-details", AuthMiddleware.checkToken, matchController.getUserCommision);
router.post("/transfer-statment", AuthMiddleware.checkToken, matchController.transferStatment);
router.get("/get-bookmaker/:marketId", matchController.getBookmaker);
router.get("/inplay-match", matchController.inplayMatch);
router.get("/getmatchInplay", matchController.getmatchInplay);


module.exports = router;