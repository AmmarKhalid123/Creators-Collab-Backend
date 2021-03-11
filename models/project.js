const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ProjectSchema = new Schema({
	name: {
		type: String,
        default: ''
    },
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);