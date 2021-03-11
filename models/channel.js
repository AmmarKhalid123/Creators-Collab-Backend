const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ChannelSchema = new Schema({
	name: {
		type: String,
        default: ''
    },
    pid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Channel', ChannelSchema);