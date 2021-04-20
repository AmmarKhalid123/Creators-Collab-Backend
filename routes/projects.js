var express = require('express');

var Project = require('../models/project');
var ProjectUsers = require('../models/projectUsers');
var Channel = require('../models/channel');
var ChannelData = require('../models/channelData');
var Invitation = require('../models/invitation');
var fs = require('fs');


var authenticate = require('../authenticate');
const User = require('../models/user');
const cors = require('./cors');

var projectRouter = express.Router();
projectRouter.use(express.json());

projectRouter.options('/', cors.corsWithOptions, (req, res) => res.sendStatus(200));

console.log(typeof cors.corsWithOptions);

projectRouter.get('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.body, req.user);
    ProjectUsers.find({userid: req.user._id})
    .populate("projectid")
    .then(projects => {
        var a = [];
        projects.forEach(p => {
            var x = {
                "name": p.projectid.name,
                "_id": p.projectid._id,
                "owner": p.projectid.owner,
                "role": p.role,
                "createdAt": p.projectid.createdAt,
                "updatedAt": p.projectid.updatedAt 
            };
            a.push(x);
        })
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({project: a});
    }, err => next(err));
})

projectRouter.post('/', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (!req.body.name){
        var err = new Error('Project name not found in req.body');
        err.status = 404;
        return next(err);
    }
    if (req.body.name.length > 19){
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, err: 'Project Name should be less than 20 characters.'});
    }
    Project.create({name: req.body.name, owner: req.user._id})
    .then((project) => {
        ProjectUsers.create({userid: req.user._id, projectid: project._id, role: 'owner'})
        .then(a => {
            var x = {
                "name": project.name,
                "_id": project._id,
                "owner": project.owner,
                "role": "owner",
                "createdAt": project.createdAt,
                "updatedAt": project.updatedAt 
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({project: x, success: true});
        })
    })
    .catch(err => next(err));
});
projectRouter.delete('/', cors.corsWithOptions,  authenticate.verifyUser, (req, res, next) => {
    if (!req.body.pid){
        var err = new Error('pid not found in req.body');
        err.status = 404;
        return next(err);
    }
        ProjectUsers.findOne({userid: req.user._id, projectid: req.body.pid})
        .then(access => {
            if (access === null){
                var err = new Error('pid not found in req.body');
                err.status = 401;
                return next(err);
            }
            else{
                if (access.role === "owner"){
                    console.log("an owner");
                    ChannelData.find({pid: req.body.pid})
                    .then(cdlst => {
                        cdlst.forEach(cd => {
                            if (cd.dataType === 'image'){
                                fs.unlink(`public${cd.content}`, err => {
                                    if (err){
                                        console.log(err);
                                    }
                                })
                            }
                        })
                        ChannelData.deleteMany({pid: req.body.pid})
                        .then(data => {
                            console.log("channeldata deleted:", data);
                            Channel.deleteMany({pid: req.body.pid})
                            .then(channel => {
                                console.log("channels deleted:", channel);
                                Invitation.deleteMany({projectid: req.body.pid})
                                .then(invite => {
                                    console.log("invites deleted", invite);
                                    ProjectUsers.deleteMany({projectid: req.body.pid})
                                    .then(pusers => {
                                        console.log("project users deleted:", pusers);
                                        Project.deleteOne({_id: req.body.pid})
                                        .then(proj => {
                                            console.log("project deleted:", proj);
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json({success: true, owner: true, userid: req.user._id});
                                        }, err => next(err))
                                    }, err => next(err))
                                }, err => next(err))
                            }, err => next(err))
                        }, err => next(err))
                    })
                }
                else if(access.role === "member"){
                    ProjectUsers.deleteOne({userid: req.user._id, projectid: req.body.pid, role: "member"})
                    .then(puser => {
                        console.log("project users delt: ", puser);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({success: true, owner: false, userid: req.user._id});                        
                    }, err => next(err))
                }
                
            }
        }, err => next(err))
    
});

module.exports = projectRouter;