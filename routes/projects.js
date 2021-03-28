var express = require('express');

var Project = require('../models/project');
var ProjectUsers = require('../models/projectUsers');
// var Channel = require('../models/channel');
// var ChannelData = require('../models/channelData');
// var Invitation = require('../models/invitation');
var fs = require('fs');


var authenticate = require('../authenticate');
const User = require('../models/user');
const cors = require('./cors');
// const subsUsers = require('../models/subsUsers');

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
                            if (cd.dataType === 'image' | cd.dataType === 'voice'){
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
                                            //handling subs users
                                            console.log("project deleted:", proj);
                                            Subscription.findOne({user: req.user._id})
                                            .then(sub => {
                                                console.log("ye, ", sub);
                                                subsUsers.find({subsId: sub._id})
                                                .then(members => {
                                                    console.log("will check for", members);
                                                    Project.find({owner: req.user._id})
                                                    .then(allproj => {
                                                        console.log("in these proj: ", allproj);
                                                        if (allproj.length === 0){
                                                            subsUsers.deleteMany({subsId: sub._id})
                                                            .then(async result => {
                                                                console.log("resiltt", sub, result);
                                                                // if (sub.usersRemaining){
                                                                //     sub.usersRemaining = sub.usersRemaining - result.deletedCount;
                                                                // }
                                                                var subSave = await sub.save();
                                                                console.log("subsUsers deleted: ", result);
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.json({success: true, owner: true, userid: req.user._id});
                                                            });
                                                        }
                                                        else{
                                                            var tasks = [];
                                                            var toBeDone = [];
                                                            members.forEach(m => {
                                                                tasks = [];
                                                                allproj.forEach(p => {
                                                                    tasks.push(ProjectUsers.findOne({projectid: p._id, userid: m.userId, role: "member"}));
                                                                })
                                                                Promise.all(tasks)
                                                                .then(doneTasks => {
                                                                    console.log(doneTasks);
                                                                    if (doneTasks.length === 0){
                                                                        toBeDone.push(subsUsers.findOneAndDelete({subsId: sub._id, userId: m.userId}));
                                                                    }
                                                                    else{
                                                                        var nullCheck = doneTasks.filter(a => a !== null);
                                                                        if (nullCheck.length > 0){
                                                                            toBeDone.push(subsUsers.findOneAndDelete({subsId: sub._id, userId: m.userId}));
                                                                        }
                                                                    }
                                                                })
                                                            })
                                                            console.log("abcd", toBeDone, tasks);
                                                            Promise.all(toBeDone)
                                                            .then(async ss => {
                                                                // if (sub.usersRemaining){
                                                                //     sub.usersRemaining = sub.usersRemaining - toBeDone.length;
                                                                // }
                                                                var subSave = await sub.save();
                                                                console.log('subSave', subSave);
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.json({success: true, owner: true, userid: req.user._id});
                                                            })
                                                        }
                                                    }, err => next(err))
                                                }, err => next(err))
                                            }, err => next(err))
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
                        ProjectUsers.findOne({projectid: req.body.pid, role: "owner"})
                        .then(owner => { 
                            console.log("owner", owner);
                            Project.find({owner: owner.userid})
                            .then(projects => {
                                var tasks = [];
                                console.log(projects);
                                projects.forEach(p => {
                                    if (!(p._id.equals(req.body.pid))){
                                        tasks.push(ProjectUsers.findOne({role: "member", userid: req.user._id, projectid: p._id}))
                                    }
                                })
                                Promise.all(tasks)
                                .then(check => {
                                    console.log("check", check, check.length)
                                    if (check.length === 0){
                                        console.log(owner);
                                        console.log({user: owner.userid});
                                        Subscription.findOne({user: owner.userid})
                                        .then(sub => {
                                            console.log(sub);
                                            subsUsers.findOneAndDelete({subsId: sub._id, userId: req.user._id})
                                            .then(d => {
                                                console.log(d);
                                                res.statusCode = 200;
                                                res.setHeader('Content-Type', 'application/json');
                                                res.json({success: true, owner: false, userid: req.user._id});
                                            }, err => next(err))
                                        }, err => next(err))
                                    }
                                    else{
                                        var aa = check.filter(a => a !== null);
                                        if (aa.length === 0){
                                            console.log("agaya");
                                            Subscription.findOne({user: owner.userid})
                                            .then(sub => {
                                                console.log({subsId: sub._id, userId: req.user._id})
                                                subsUsers.findOneAndDelete({subsId: sub._id, userId: req.user._id})
                                                .then(async d => {
                                                    console.log(d);
                                                    // sub.usersRemaining = sub.usersRemaining - 1;
                                                    var saveSub = await sub.save();
                                                    console.log(saveSub);
                                                    res.statusCode = 200;
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.json({success: true, owner: false, userid: req.user._id});
                                                }, err => next(err))
                                            }, err => next(err))
                                        }
                                        else{
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json({success: true, owner: false, userid: req.user._id});
                                        }
                                    }
                                })
                            }, err => next(err))
                        }, err => next(err))
                    }, err => next(err))
                }
                
            }
        }, err => next(err))
    
});

module.exports = projectRouter;