import "../config/envloader.js";
import { sendSQSMessage } from "../sqs-producer/sqs-producer.service.js";

export async function processMessage(messageObject: any) {
	console.log("Processing transcription message:", messageObject);
	// Simulate processing
	const processedData = {
		...messageObject,
		status: "Processed",
		timestamp: new Date().toISOString(),
	};
	const storyQueueUrl = process.env.STORY_QUEUE_URL as string;
	console.log("storyQueueUrl: ", storyQueueUrl);
	await sendSQSMessage(storyQueueUrl, processedData);
}
