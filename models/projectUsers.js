const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ProjectUserSchema = new Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  role: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectUser', ProjectUserSchema);