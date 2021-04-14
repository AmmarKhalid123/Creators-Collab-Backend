const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var InvitationSchema = new Schema({
	userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    projectid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    email: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Invitation', InvitationSchema);