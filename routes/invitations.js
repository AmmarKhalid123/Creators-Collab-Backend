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
                    Subscription.findOne({user: project.owner._id})
                    .then(subs => {
                        SubsUsers.findOne({subsId: subs._id, userId: req.user._id})
                        .then(alreadyPresent => {
                            console.log("ayaa");
                            if (alreadyPresent){
                                ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                                .then(re => {
                                    console.log("deleting invites");
                                    Invitation.findOneAndDelete({code: req.params.code})
                                    .then(r => {
                                        console.log("r", r);
                                        awsemail.sendEmail(project.owner.email, project.owner.username, getInviteAcceptEmail(req.user.username))
                                        .then(sesres => {
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
                                        .catch(seserr => {
                                            console.log('email not sent', seserr);
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
                                    .catch(err => next(err));
                                })
                                .catch(err => next(err));                        
                            }
                            else{
                                SubsUsers.find({subsId: subs._id})
                                .then(totalInvites => {
                                    if (subs.Plan === "Free"){
                                        if (totalInvites.length === 0){ // this condition will be changed for monthly and yearly
                                            SubsUsers.create({userId: req.user._id, subsId: subs._id})
                                            .then(s => {
                                                ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                                                .then(re => {
                                                    Invitation.findOneAndDelete({code: req.params.code})
                                                    .then(r => {
                                                        subs.usersRemaining = subs.usersLimit - 1;
                                                        subs.save((err, sub) => {
                                                            awsemail.sendEmail(project.owner.email, project.owner.username, getInviteAcceptEmail(req.user.username))
                                                            .then(sesres => {
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                            .catch(errses => {
                                                                console.log('email not sent');
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                        })
                                                    })
                                                    .catch(err => {
                                                        console.log(err)
                                                        return next(err)
                                                    });
                                                })
                                                .catch(err => next(err));
                                            })
                                        }
                                        else{
                                            var err = new Error("You cannot invite more users, already have one invited. Upgrade!")
                                            err.status = 403;
                                            return next(err);
                                        }
                                    }
                                    if (subs.Plan === "Monthly Lite" | subs.Plan === 'Yearly Lite'){
                                        if (totalInvites.length <= 5){ // this condition will be changed for monthly and yearly
                                            SubsUsers.create({userId: req.user._id, subsId: subs._id})
                                            .then(s => {
                                                ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                                                .then(re => {
                                                    Invitation.findOneAndDelete({code: req.params.code})
                                                    .then(r => {
                                                        subs.usersRemaining = subs.usersLimit - 1;
                                                        subs.save((err, sub) => {
                                                            awsemail.sendEmail(project.owner.email, project.owner.username, getInviteAcceptEmail(req.user.username))
                                                            .then(sesres => {
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                            .catch(seserr => {
                                                                console.log('email not sent', seserr);
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                        })
                                                    })
                                                    .catch(err => {
                                                        console.log(err)
                                                        return next(err)
                                                    });
                                                })
                                                .catch(err => next(err));
                                            })
                                        }
                                        else{
                                            var err = new Error("You cannot invite more users, already have one invited. Upgrade!")
                                            err.status = 403;
                                            return next(err);
                                        }
                                    }
                                    if (subs.Plan === "Monthly Pro" | subs.Plan === 'Yearly Pro'){
                                        if (totalInvites.length <= 15){ // this condition will be changed for monthly and yearly
                                            SubsUsers.create({userId: req.user._id, subsId: subs._id})
                                            .then(s => {
                                                ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                                                .then(re => {
                                                    Invitation.findOneAndDelete({code: req.params.code})
                                                    .then(r => {
                                                        subs.usersRemaining = subs.usersLimit - 1;
                                                        subs.save((err, sub) => {
                                                            awsemail.sendEmail(project.owner.email, project.owner.username, getInviteAcceptEmail(req.user.username))
                                                            .then(sesres => {
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                            .catch(seserr => {
                                                                console.log('seserr', seserr);
                                                                var x = {
                                                                    "name": project.name,
                                                                    "_id": project._id,
                                                                    "owner": project.owner._id,
                                                                    "role": "member",
                                                                    "createdAt": project.createdAt,
                                                                    "updatedAt": project.updatedAt 
                                                                };
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                console.log("abcdedfksj", x, re)
                                                                res.json({result: x, success: true});
                                                            })
                                                        })
                                                    })
                                                    .catch(err => {
                                                        console.log(err)
                                                        return next(err)
                                                    });
                                                })
                                                .catch(err => next(err));
                                            })
                                        }
                                        else{
                                            var err = new Error("You cannot invite more users, already have one invited. Upgrade!")
                                            err.status = 403;
                                            return next(err);
                                        }
                                    }
                                    if (subs.Plan === "Monthly Unlimited" | subs.Plan === 'Yearly Unlimited' | subs.Plan === 'LTD'){
                                        // if (totalInvites.length <= 0){ // this condition will be changed for monthly and yearly
                                            SubsUsers.create({userId: req.user._id, subsId: subs._id})
                                            .then(s => {
                                                ProjectUsers.create({userid: req.user._id, projectid: invite[0].projectid, role: 'member'})
                                                .then(re => {
                                                    Invitation.findOneAndDelete({code: req.params.code})
                                                    .then(r => {
                                                        awsemail.sendEmail(project.owner.email, project.owner.username, getInviteAcceptEmail(req.user.username))
                                                        .then(sesres => {
                                                            var x = {
                                                                "name": project.name,
                                                                "_id": project._id,
                                                                "owner": project.owner._id,
                                                                "role": "member",
                                                                "createdAt": project.createdAt,
                                                                "updatedAt": project.updatedAt 
                                                            };
                                                            res.statusCode = 200;
                                                            res.setHeader('Content-Type', 'application/json');
                                                            console.log("abcdedfksj", x, re)
                                                            res.json({result: x, success: true});
                                                        })
                                                        .catch(sesres => {
                                                            console.log('emailerr', sesres);
                                                            var x = {
                                                                "name": project.name,
                                                                "_id": project._id,
                                                                "owner": project.owner._id,
                                                                "role": "member",
                                                                "createdAt": project.createdAt,
                                                                "updatedAt": project.updatedAt 
                                                            };
                                                            res.statusCode = 200;
                                                            res.setHeader('Content-Type', 'application/json');
                                                            console.log("abcdedfksj", x, re)
                                                            res.json({result: x, success: true});
                                                        })
                                                    })
                                                    .catch(err => {
                                                        console.log(err)
                                                        return next(err)
                                                    });
                                                })
                                                .catch(err => next(err));
                                            })
                                        // }
                                        // else{
                                        //     var err = new Error("You cannot invite more users, already have one invited. Upgrade!")
                                        //     err.status = 403;
                                        //     return next(err);
                                        // }
                                    }
                                })
                                .catch(err => next(err));
                            }
                        })
                        .catch(err => next(err))
                    })
                    .catch(err => next(err))
                })
                .catch(err => next(err))
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
    Invitation.findOne({email: req.body.email, projectid: req.body.projectid})
    .then(invitation => {
        if (invitation){
            console.log('heree');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({invite: invitation, success: true});
        }
        else{
            const code = crypto.randomBytes(4).toString('hex');
            Invitation.create({projectid: req.body.projectid, email: req.body.email, code})
            .then(invite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({invite, success: true});
            })
        }
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