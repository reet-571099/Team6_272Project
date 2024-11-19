const { UserStory } = require('./database/storySchema');
const { UserProject } = require('./database/userProjects');

const parseAndStoreStories = async (stories, projectId) => {
  try {
    const storiesWithProjectId = stories.map(story => ({
        ...story,
        project_id: projectId,  
    }));
    await UserStory.insertMany(storiesWithProjectId);
    console.log('User stories inserted successfully!');
  } catch (error) {
    console.error('Error inserting user stories:', error);
    throw error;
  }
};

const updateActiveStories = async (userId, projectId, activeStories) => {
    try {
        const userProject = await UserProject.findOne({ user_id: userId, project_id: projectId });

        if (!userProject) {
            throw new Error('User project not found');
        }

        userProject.active_stories = activeStories;

        const updatedProject = await userProject.save();

        return updatedProject; 
    } catch (error) {
        console.error('Error updating active stories:', error.message);
        throw error;
    }
};

const getActiveStories = async(userId, projectId) => {
    const userProject = await UserProject.findOne({user_id: userId, project_id: projectId});
    return userProject.active_stories;
}

module.exports = { parseAndStoreStories, updateActiveStories, getActiveStories };