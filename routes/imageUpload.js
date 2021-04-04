const express = require('express');
const authenticate = require('../authenticate');
const cors = require('./cors');
const multer = require('multer');
const ChannelData = require('../models/channelData');
var crypto = require("crypto");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(file.originalname);
        cb(null, 'public/images');
    },

    filename: (req, file, cb) => {
        console.log(file)
        const code = crypto.randomBytes(4).toString('hex');
        cb(null, `img_${code}.${file.originalname.split('.')[1]}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    console.log(file)
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

uploadRouter.use(express.json());


uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions,  authenticate.verifyUser, upload.single('imageFile'), async (req, res) => {
    var a = req.file.path.split('public/')[1];
    var data = await ChannelData.create({pid: req.body.pid, cid: req.body.cid, createdBy: req.user._id, dataType: req.body.dataType, title: req.body.title, content: a})
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, data: data});
});
module.exports = uploadRouter;