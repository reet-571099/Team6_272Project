import "../config/envloader.js";
import AWS from "aws-sdk";

AWS.config.update({
	region: process.env.AWS_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

export async function sendSQSMessage(queueUrl: string, messageObject: any) {
	const params = {
		MessageBody: JSON.stringify(messageObject),
		QueueUrl: queueUrl,
	};
	try {
		const data = await sqs.sendMessage(params).promise();
		console.log(
			`Successfully sent message to SQS (${messageObject?.type}): ${queueUrl}`
		);
		console.log("Message sent: ", data.MessageId);
	} catch (err) {
		console.log("Error sending message: ", err);
	}
}
