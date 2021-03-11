const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
	username: {
		type: String,
        default: '',
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
}, {
    timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);