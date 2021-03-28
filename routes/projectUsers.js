var express = require('express');

var ProjectUsers = require('../models/projectUsers');

var authenticate = require('../authenticate');
const cors = require('./cors');
// const SubsUsers = require('../models/subsUsers');
const Projects = require('../models/project');
// const Subscription = require('../models/subscription');

var projectUserRouter = express.Router();
projectUserRouter.use(express.json());


projectUserRouter.route('/:pid')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    ProjectUsers.findOne({projectid: req.params.pid, userid: req.user._id})
    .then(inProj => {
        if (inProj){
            ProjectUsers.find({projectid: req.params.pid})
            .populate('userid')
            .then(x => {
                var b = [];
                x.forEach(p => {
                    var obj = {};
                    obj.id = p._id;
                    obj.projectid = p.projectid;
                    obj.role = p.role;
                    obj.createdAt = p.createdAt;
                    obj.updadetAt = p.updadetAt;
                    var userInfo = {username: p.userid.username, id: p.userid._id, email: p.userid.email, createdAt: p.userid.createdAt, updatedAt: p.userid.updatedAt, image: p.userid.image,};
                    obj.userid = userInfo;
                    b.push(obj);
                })
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({projectUsers: b, success: true});
            })
        }
    })
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    ProjectUsers.findOneAndDelete({userid: req.body.userid, role: 'member'})
    .then(puserDel => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, owner: false, userid: req.body.userid});
    })
})
module.exports = projectUserRouter;