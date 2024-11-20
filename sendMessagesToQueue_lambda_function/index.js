import AWS from "aws-sdk";

const sqs = new AWS.SQS({});

export const handler = async (event) => {
	console.log("S3 Event: ", JSON.stringify(event));
	const bucketName = event.Records[0].s3.bucket.name;
	const objectKey = decodeURIComponent(
		event.Records[0].s3.object.key.replace(/\+/g, " ")
	);
	const url = `https://${bucketName}.s3.us-west-1.amazonaws.com/${objectKey}`;
	console.log("Extracted URL: ", url);
	const userId = extractUserIdFromKey(objectKey);
	const projectId = extractProjectIdFromKey(objectKey);
	if (!userId || !projectId) {
		console.error("Missing userId or projectId. Cannot send to SQS.");
		return;
	}
	const sqsMessage = {
		QueueUrl:
			"https://sqs.us-west-1.amazonaws.com/402182691546/transcription_queue",
		MessageBody: JSON.stringify({
			user_id: userId,
			project_id: projectId,
			url,
		}),
	};
	try {
		console.log("Sending message to SQS: ", sqsMessage);
		const result = await sqs.sendMessage(sqsMessage).promise();
		console.log("Message sent to SQS successfully: ", result);
	} catch (error) {
		console.error("Error sending message to SQS: ", error);
		throw error;
	}
};

const extractUserIdFromKey = (key) => {
	const fileName = key.split("/").pop();
	return fileName?.split("_")[0] || null;
};

const extractProjectIdFromKey = (key) => {
	const fileName = key.split("/").pop();
	return fileName?.split("_")[1] || null;
};
