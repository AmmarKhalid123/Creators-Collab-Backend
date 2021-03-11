const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ChannelDataSchema = new Schema({
	cid: {
		type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },
    createdBy: {
		type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    dataType: {
        type: String
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    likedBy: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ChannelData', ChannelDataSchema);