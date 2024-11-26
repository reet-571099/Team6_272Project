const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const { generateUserStories } = require("../openAIClient");
const path = require("path");
const {
	parseAndStoreStories,
	updateActiveStories,
	getActiveStories,
} = require("../storyService");
const { UserStory } = require("../database/storySchema");
const { UserProject } = require("../database/userProjects");
const axios = require("axios");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

dotenv.config();

const router = express.Router();

// Route to generate story points from input file
router.get("/generate-story-points", async (req, res) => {
	try {
		const filePath = path.join(__dirname, "../transcript.txt");
		const fileContent = fs.readFileSync(filePath, "utf-8");
		//const { project_id, user_id } = req.query;
		const user_id = "123456";
		const project_id = "P001";
		if (!project_id) {
			return res.status(400).json({ error: "Project ID is required" });
		}
		const stories = await generateUserStories(fileContent, project_id);
		const savedStories = await parseAndStoreStories(stories, project_id);
		await updateActiveStories(user_id, project_id, stories.length);
		res.status(200).json({
			message: "Stories saved in DB",
			stories: savedStories,
		});
	} catch (error) {
		res.status(500).json({ error: "Failed to generate stories", error });
	}
});

router.get("/getActiveStories", async (req, res) => {
	try {
		//const {user_id, project_id} = req.query;
		const user_id = "123456";
		const project_id = "P001";
		const activePoints = await getActiveStories(user_id, project_id);
		res.status(200).json({ activeStories: activePoints });
	} catch (err) {
		console.log("Some error occured", err);
		res.status(500).json({ error: "Failed to get active stories", err });
	}
});

router.get("/stories/:project_id", async (req, res) => {
	const { project_id } = req.params;
	try {
		const stories = await UserStory.find({ project_id });

		if (stories.length === 0) {
			return res
				.status(404)
				.json({ message: "No stories found for this project ID" });
		}

		res.status(200).json({ stories });
	} catch (error) {
		console.error("Error fetching stories:", error.message);
		res.status(500).json({ error: "Server error while fetching stories" });
	}
});

router.put("/stories/:story_id/:project_id", async (req, res) => {
	const { story_id, project_id } = req.params;
	const updateData = req.body;
	if (!updateData || (!updateData.story_name && !updateData.description)) {
		return res
			.status(400)
			.json({ message: "Please provide valid data to update" });
	}
	const updateFields = {};
	if (updateData.story_name) {
		updateFields.story_name = updateData.story_name;
	}
	if (updateData.description) {
		updateFields.description = updateData.description;
	}

	try {
		const updatedStory = await UserStory.findOneAndUpdate(
			{ story_id, project_id },
			{ $set: updateFields },
			{ new: true }
		);

		if (!updatedStory) {
			return res
				.status(404)
				.json({ message: "Story not found or invalid IDs" });
		}

		res.status(200).json({
			message: "Story updated successfully",
			updatedStory,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Server error, please try again later",
		});
	}
});

router.post("/user-projects", async (req, res) => {
	try {
		if (req.headers["x-api-key"] !== process.env.STORY_SERVICE_API_KEY) {
			return res.status(400).json({
				message: "invalid x-api-key!",
			});
		}
		const {
			user_id,
			project_id,
			total_stories,
			active_stories,
			inactive_stories,
		} = req.body;

		const userProject = new UserProject({
			user_id,
			project_id,
			total_stories,
			active_stories,
			inactive_stories,
		});

		await userProject.save();

		res.status(201).json({
			message: "User project created successfully",
			data: userProject,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create user project" });
	}
});

router.post("/pushToJIRA", async (req, res) => {
	const { story_id, project_id, userId } = req.body;

	try {
		const story = await UserStory.findOne({ story_id, project_id });
		if (!story) {
			return res.status(404).json({ error: "Story not found" });
		}

		const descriptionText = story.description.join(" ");

		const payload = {
			project_key: "SCRUM",
			summary: story.story_name,
			issuetype: "Task",
			description: descriptionText,
		};
		const jiraResponse = await axios.post(
			`http://18.222.152.111:5001/create_jira_story?username=${userId}`,
			payload,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		res.status(200).json({
			message: "Story pushed to JIRA successfully",
			jiraResponse: jiraResponse.data,
		});
	} catch (error) {
		console.error("Error pushing story to JIRA:", error);
		res.status(500).json({
			error: "Failed to push story to JIRA",
			details: error.message,
		});
	}
});

module.exports = router;
