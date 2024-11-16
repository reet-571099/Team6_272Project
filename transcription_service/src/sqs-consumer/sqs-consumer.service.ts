import "../config/envloader.js";
import AWS from "aws-sdk";
import { processTranscriptionMessage } from "../transcription/transcription.service.js";

AWS.config.update({
	region: process.env.AWS_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

export async function startSQSConsumer(queueUrl: string) {
	console.log(`Starting SQS Consumer for queue: ${queueUrl}`);
	while (true) {
		try {
			const params = {
				QueueUrl: queueUrl,
				MaxNumberOfMessages: 10,
				WaitTimeSeconds: 10,
			};
			const result = await sqs.receiveMessage(params).promise();
			if (result?.Messages && result?.Messages?.length > 0) {
				for (const message of result.Messages) {
					if (message?.Body) {
						await handleMessage(
							message.Body,
							queueUrl,
							message.ReceiptHandle!
						);
					}
				}
			}
		} catch (error) {
			console.error("Error consuming messages:", error);
		}
	}
}

async function handleMessage(
	body: string,
	queueUrl: string,
	receiptHandle: string
) {
	try {
		const messageObject = JSON.parse(body);
		// Process the message
		await processTranscriptionMessage(messageObject);
		// Delete the message
		await deleteMessage(queueUrl, receiptHandle);
	} catch (error) {
		console.error("Error handling message:", error);
	}
}

async function deleteMessage(queueUrl: string, receiptHandle: string) {
	const deleteParams = {
		QueueUrl: queueUrl,
		ReceiptHandle: receiptHandle,
	};
	try {
		await sqs.deleteMessage(deleteParams).promise();
		console.log("Message deleted successfully");
	} catch (error) {
		console.error("Error deleting message:", error);
	}
}
