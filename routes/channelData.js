var express = require('express');

var authenticate = require('../authenticate');
var Channel = require('../models/channel');
var Project = require('../models/project');

const cors = require('./cors');
const ChannelData = require('../models/channelData');
var fs = require('fs');

var channelDataRouter = express.Router();
channelDataRouter.use(express.json());

channelDataRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

channelDataRouter
.get('/', cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    Project.find({owner: req.user._id})
    .then(projects => {
        var a = [];
        var all = [];
        projects.forEach(p => {
            a.push(ChannelData.find({pid: p._id}).populate('likedBy', 'username image'))
        })
        Promise.all(a)
        .then(re => {
            re.forEach(r => {
                r.forEach(cd => all.push(cd));
            })
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({data: all});
        })
    })
    .catch(err => next(err));
})
.get('/:pid', cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    if (!req.params.pid){
        var err = new Error('Project Id not in req.params');
        err.status = 403;
        return next(err);
    }
    else{
        ChannelData.find({pid: req.params.pid})
        .populate('likedBy', 'username image')
        .then(data => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, data: data});
        })
        .catch(err => next(err))
    }
})
.post('/',cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (!req.body.cid){
        var err = new Error('Channel ID not found in req.body');
        err.status = 404;
        return next(err);
    }
    if (!req.body.pid){
        var err = new Error('Pid not found in req.params');
        err.status = 404;
        return next(err);
    }
    if (req.body.dataType === 'link'){
        ChannelData.create({pid: req.body.pid, cid: req.body.cid, createdBy: req.user._id, dataType: req.body.dataType, title: req.body.title, content: req.body.content})
        .then(data => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, data: data});
        })
        .catch(err => next(err))
    }
    else if (req.body.dataType === 'code'){
        console.log("here", {pid: req.body.pid, cid: req.body.cid, createdBy: req.user._id, dataType: req.body.dataType, title: req.body.title, content: req.body.content});
        ChannelData.create({pid: req.body.pid, cid: req.body.cid, createdBy: req.user._id, dataType: req.body.dataType, title: req.body.title, content: req.body.content})
            .then(data => {
                console.log('abe wtf!')
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success: true, data: data});
            })
            .catch(err => {console.log(err); return next(err)})
    }
    else{
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, err: 'Invalid Datatype'});
    }
})
.post('/likecdata/:chdataid', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.params.chdataid)
    ChannelData.findById(req.params.chdataid)
    .then(cdata => {
        if (cdata.likedBy.indexOf(req.user._id) === -1){
            cdata.likedBy = cdata.likedBy.concat([req.user._id]);
        }
        else{
            cdata.likedBy = cdata.likedBy.filter(x => {
                console.log(x);
                console.log(req.user._id);
                return !(req.user._id.equals(x));
            });
            console.log(cdata);
        }

        cdata.save((err, cd) => {
            ChannelData.findById(cd._id)
            .populate('likedBy', 'username image')
            .then(cda => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({chdata: cda, success: true});
            })
        })
    })
})
.put('/:chdataid', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    ChannelData.findById(req.params.chdataid)
    .then(channel => {
        if (channel.createdBy.equals(req.user._id)){
            console.log("abcd", req.body);
                ChannelData.findByIdAndUpdate(req.params.chdataid, {
                    $set: req.body
                }, {new: true})
                .then(ch => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({channel: ch, success: true});
                })
        }
        else {
            Project.findById(channel.pid)
            .then(project => {
                if (req.user._id.equals(project.owner)){
                    ChannelData.findByIdAndUpdate(req.params.chdataid, {
                        $set: req.body
                    }, {new: true})
                    .then(ch => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({channel: ch, success: true});
                    })
                }
                else{
                    var err = new Error('You are not authorized to edit this channel data');
                    err.status = 401;
                    return next(err);
                }
            })
        }
    })
})
.delete('/:chdataid', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    ChannelData.findById(req.params.chdataid)
    .then(channel => {
        if (channel.createdBy.equals(req.user._id)){
            if (channel.dataType === 'image' | channel.dataType === 'voice'){
                fs.unlink(`./public/${channel.content}`, (err) => {
                    if (err){
                        console.log(err);
                    }
                })
            }
            ChannelData.findByIdAndDelete(req.params.chdataid)
            .then(ch => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({channel: ch, success: true});
            })
            .catch(err => next(err))
        }
        else {
            Project.findById(channel.pid)
            .then(project => {
                if (req.user._id.equals(project.owner)){
                    if (channel.dataType === 'image' | channel.dataType === 'voice'){
                        fs.unlink(`./public/${channel.content}`, (err) => {
                            if (err){
                                console.log(err);
                            }
                        })
                    }
                    ChannelData.findByIdAndDelete(req.params.chdataid)
                    .then(ch => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({channel: ch, success: true});
                    })
                    .catch(err => next(err))
                }
                else{
                    var err = new Error('You are not authorized to delete this channel data');
                    err.status = 401;
                    return next(err);
                }
            })
        }
    })

});

module.exports = channelDataRouter;