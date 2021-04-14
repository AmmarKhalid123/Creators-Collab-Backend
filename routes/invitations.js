var express = require('express');

var Invitation = require('../models/invitation');
var ProjectUsers = require('../models/projectUsers');
var User = require('../models/user');
var Project = require('../models/project');

var authenticate = require('../authenticate');
const cors = require('./cors');
var crypto = require("crypto");

var inviteRouter = express.Router();
inviteRouter.use(express.json());

inviteRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

inviteRouter
.get('/:code', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Invitation.find({code: req.params.code})
    .then(invite => {
        console.log(invite);
        if (invite.length === 1){
            if (invite[0].email === req.user.email){ // jiske lye invite hai usi ne access
                console.log(invite);
                Project.findById(invite[0].projectid)
                .populate('owner', 'email username')
                .then(project => {
                    ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                    .then(re => {
                        console.log("deleting invites");
                        Invitation.findOneAndDelete({code: req.params.code})
                        .then(r => {
                            console.log("r", r);
                            var x = {
                                "name": project.name,
                                "_id": project._id,
                                "owner": project.owner._id,
                                "role": "member",
                                "createdAt": project.createdAt,
                                "updatedAt": project.updatedAt 
                            };
                            console.log("x", x);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json({result: x, success: true});
                        })
                    })
                })
            }
            else{
                var err = new Error('This Invite request was not for you');
                err.status = 403;
                return next(err);    
            }
        }
        else{
            var err = new Error('Wrong Invite request');
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log('heree');
    if (!req.body.email){
        var err = new Error('Email not found in req.body');
        err.status = 403;
        return next(err);
    }
    if (!req.body.projectid){
        var err = new Error('Project Id not found in req.body');
        err.status = 403;
        return next(err);
    }
    const code = crypto.randomBytes(4).toString('hex');
    Invitation.create({projectid: req.body.projectid, email: req.body.email, code})
    .then(invite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({invite, success: true});
    })
})
.delete('/:code', cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
   const inv = await Invitation.findOneAndDelete({email: req.user.email, code: req.params.code});
    console.log(inv);
   res.statusCode = 200;
   res.setHeader('Content-Type', 'application/json');
   res.json({success: true});
});

module.exports = inviteRouter;