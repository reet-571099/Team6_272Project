const mongoose = require('mongoose');

const userProjectsSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  project_id: { type: String, required: true },
  total_stories: { type: Number, required: true },
  active_stories: { type: Number, required: true },
  inactive_stories: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'user_projects', // Specify the collection name
});

const UserProject = mongoose.model('UserProject', userProjectsSchema);

module.exports = { UserProject };