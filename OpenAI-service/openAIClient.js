const axios = require('axios');
require('dotenv').config();
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


async function generateUserStories(transcript, projectId) {
    const generateStoriesPrompt = `
    Using the following key points, generate detailed user stories in the following format for a MongoDB database:
  
    For each story, include:
    1. story_name: The name of the feature (Feature Description).
    2. story_points: Assign points based on complexity (2 for simple, 5 for moderate, 8 for complex).
    3. description: A list of acceptance criteria covering:
        - Functional requirements
        - UI/UX considerations
        - Error handling
        - Testing and validation
        - Device/browser compatibility
  
    Key Points:
    ${transcript}
  
    Output each user story in the following JSON format:
    [
      {
        "story_name": "[Feature Name]",
        "story_points": [Story Points],
        "description": [
          "[First Criterion]",
          "[Second Criterion]",
          ...
        ]
      },
    ]
    Include every story that is mentioned in the text.`;

    try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: generateStoriesPrompt }],
      max_tokens: 1500,
      temperature: 0,
    });
    console.log(response.choices[0].message.content)
    const stories = response.choices[0].message.content;
    const cleanStories = stories.replace(/```json|```/g, '').trim();
    const storiesWithID = JSON.parse(cleanStories).map(story => ({
        story_id: uuidv4(),
        project_id: projectId,
        story_name: story.story_name,
        story_points: story.story_points,
        description: story.description,
      }));
      return storiesWithID;
  } catch (error) {
    console.error('Error generating user stories:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { generateUserStories };
