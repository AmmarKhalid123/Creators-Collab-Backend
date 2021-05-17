const express = require('express');
const authenticate = require('../authenticate');
const cors = require('./cors');
const multer = require('multer');
var crypto = require("crypto");
const User = require('../models/user');
var fs = require('fs');
const url = 'http://localhost:3000/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(file.originalname);
        cb(null, 'public/profilepics');
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
.post(cors.corsWithOptions, authenticate.verifyUser, upload.single('imageFile'), async (req, res) => {
    console.log("abcd");
    console.log(req.file);
    var newImg = req.file.path.split('public/')[1];
    User.findById(req.user._id)
    .then(usr => {
        console.log(usr);
        if (usr.image){
            if (usr.image.startsWith(url)){
                var prevImg = usr.image.split(url)[1];
                fs.unlink(`./public/${prevImg}`, (err) => {
                    if (err){
                        console.log(err);
                    }
                })
            }
        }
        usr.image = `${url}${newImg}`;
        usr.save((err, user) => {
            var userInfo = {username: user.username, id: user._id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt, image: user.image, admin: user.admin};
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, user: userInfo});
        })
    })
});
module.exports = uploadRouter;1