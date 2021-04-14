var express = require('express');
const bodyParser = require('body-parser');

var Invitation = require('../models/invitation');
var ProjectUsers = require('../models/projectUsers');
var User = require('../models/user');
var Project = require('../models/project');

var authenticate = require('../authenticate');
const cors = require('./cors');


var notifRouter = express.Router();
notifRouter.use(express.json());

notifRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

notifRouter
.get('/', cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    const invites = await Invitation.find({email: req.user.email}).populate('projectid');
    console.log('invites', invites);
    var lst = [];
    Promise.all(invites.map(i => {
        return new Promise(async (resolve, reject) => {
            var a = {};
            a['code'] = i.code;
            a['ProjectName'] = i.projectid.name;
            var usr = await User.findOne({_id: i.projectid.owner});
            a['Owner'] = usr.username;
            a['img'] = usr.image;
            resolve(a);    
        })
    }))
    .then(re => {
        console.log(re);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, notifications: re});    
    })
})

module.exports = notifRouter;