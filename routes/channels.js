var express = require('express');

var authenticate = require('../authenticate');
var Channel = require('../models/channel');
var ChannelData = require('../models/channelData');
var User = require('../models/user');
var Project = require('../models/project');

const cors = require('./cors');
const ProjectUsers = require('../models/projectUsers');
var fs = require('fs');

var channelRouter = express.Router();
channelRouter.use(express.json());

channelRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

channelRouter
.get('/:pid', cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    if (req.params.pid){
        ProjectUsers.findOne({projectid: req.params.pid, userid: req.user._id})
        .then(project => {
            if (project){
                Channel.find({pid: req.params.pid})
                .then((channel) => {
                    console.log("project", project);
                    console.log("channel", channel);
                    console.log("-------");
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({channel});
                })
                .catch(err => next(err))
            }
            else{
                var err = new Error('You are not authorized to get channels of this project');
                err.status = 403;
                return next(err);
            }
        })
        .catch(err => next(err))
    }
    else{
        var err = new Error('Project Id not in req.params');
        err.status = 403;
        return next(err);
    }
    
})
.post('/:pid',cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (!req.body.channelName){
        var err = new Error('Channel name not found in req.body');
        err.status = 404;
        return next(err);
    }
    if (!req.params.pid){
        var err = new Error('Pid not found in req.params');
        err.status = 404;
        return next(err);
    }
    ProjectUsers.findOne({projectid: req.params.pid, userid: req.user._id})
    .then(project => {
        if (project){
            Channel.create({name: req.body.channelName, pid: req.params.pid, createdBy: req.user._id})
            .then(channel => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({channel, success: true});
            })
            .catch(err => next(err))
        }
        else{
            var err = new Error('You are not authorized to add channel in this project');
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err))
})  
.put('/:cid', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Channel.findById(req.params.cid)
    .then(channel => {
        if (channel.createdBy.equals(req.user._id)){
            Channel.findByIdAndUpdate(req.params.cid, {
                $set: req.body
            }, {new: true})
            .then(channel => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({channel, success: true});
            })
        }
        else {
            Project.findById(channel.pid)
            .then(project => {
                if (req.user._id.equals(project.owner)){
                    Channel.findByIdAndUpdate(req.params.cid, {
                        $set: req.body
                    }, {new: true})
                    .then(channel => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({channel, success: true});
                    })
                }
                else{
                    var err = new Error('You are not authorized to edit this channel');
                    err.status = 401;
                    return next(err);
                }
            })
        }
    })
})
.delete('/:cid', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Channel.findById(req.params.cid)
    .then(channel => {
        if (channel.createdBy.equals(req.user._id)){
            Channel.findByIdAndDelete(req.params.cid)
            .then(channel => {
                ChannelData.find({cid: req.params.cid})
                .then(cdata => {
                    cdata.forEach(c => {
                        if (c.dataType === 'image'){
                            fs.unlink(`./public/${c.content}`, (err) => {
                                if (err){
                                    console.log(err);
                                }
                            })
                        }
                    })
                    ChannelData.deleteMany({cid: req.params.cid})
                    .then((x) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({channel, success: true});
                    })
                })
            })
            .catch(err => next(err))
        }
        else {
            Project.findById(channel.pid)
            .then(project => {
                if (req.user._id.equals(project.owner)){
                    Channel.findByIdAndDelete(req.params.cid)
                    .then(channel => {
                        ChannelData.find({cid: req.params.cid})
                        .then(cdata => {
                            cdata.forEach(c => {
                                if (c.dataType === 'image'){
                                    fs.unlink(`./public/${c.content}`, (err) => {
                                        if (err){
                                            console.log(err);
                                        }
                                    })
                                }
                            })
                            ChannelData.deleteMany({cid: req.params.cid})
                            .then((x) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json({channel, success: true});
                            })
                        })
                    })
                    .catch(err => next(err))
                }
                else{
                    var err = new Error('You are not authorized to edit this channel');
                    err.status = 401;
                    return next(err);
                }
            })
        }
    })
});
module.exports = channelRouter;