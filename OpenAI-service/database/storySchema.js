const mongoose = require('mongoose');

const userStorySchema = new mongoose.Schema({
  story_id: { type: String, required: true },
  project_id: { type: String, required: true },
  story_name: { type: String, required: true },
  story_points: { type: Number, required: true },
  description: { type: [String], required: true },
}, { timestamps: true,
    collection: 'stories',
 });

const UserStory = mongoose.model('UserStory', userStorySchema);

module.exports = { UserStory };