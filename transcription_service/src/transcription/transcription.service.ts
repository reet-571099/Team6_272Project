import "../config/envLoader.js";
import fs from "fs";
import path from "path";
import { createClient } from "@deepgram/sdk";
import { sendSQSMessage } from "../sqs-producer/sqs-producer.service.js";
import { promisify } from "util";
const writeFileAsync = promisify(fs.writeFile);
const unlinkFileAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
import AWS from "aws-sdk";
AWS.config.update({
	region: process.env.AWS_REGION,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();

export async function processTranscriptionMessage(messageObject: any) {
	console.log("messageObject: ", messageObject);
	const transcriptionResult = await deepgramTranscribeAudioUtil(
		messageObject?.audio_url
	);
	const summary =
		transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]
			?.transcript || "";
	console.log("Extracted Summary: ", summary);
	const tempDir = path.join(process.cwd(), "temp");
	const fileName = `transcription-summary-${Date.now()}.txt`;
	const filePath = path.join(tempDir, fileName);
	try {
		try {
			await accessAsync(tempDir, fs.constants.F_OK);
		} catch {
			console.log("Temp folder not found. Creating...");
			await mkdirAsync(tempDir);
		}
		await writeFileAsync(filePath, summary);
		const bucketName = process.env.S3_BUCKET_NAME as string; // Ensure this is set in the environment variables
		const s3Key = `transcriptions/${fileName}`;
		const uploadParams = {
			Bucket: bucketName,
			Key: s3Key,
			Body: fs.createReadStream(filePath),
			ContentType: "text/plain",
		};
		console.log("Uploading file to S3...");
		const s3UploadResult = await s3.upload(uploadParams).promise();
		const fileUrl = s3UploadResult.Location;
		console.log("fileUrl: ", fileUrl);
		const processedData = {
			...messageObject,
			file_url: fileUrl,
			status: "TRANSCIPTION_DONE",
			timestamp: new Date().toISOString(),
		};
		console.log("processedData: ", processedData);
		const storyQueueUrl = process.env.STORY_QUEUE_URL as string;
		await sendSQSMessage(storyQueueUrl, processedData);
	} catch (error) {
		console.error("Error during file upload or processing: ", error);
		throw error;
	} finally {
		// Cleanup the temporary file
		if (fs.existsSync(filePath)) {
			await unlinkFileAsync(filePath);
			console.log("Temporary file deleted: ", filePath);
		}
	}
}

async function deepgramTranscribeAudioUtil(audioUrl) {
	try {
		const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
		const deepgram = createClient(deepgramApiKey);
		const { result, error } =
			await deepgram.listen.prerecorded.transcribeUrl(
				{ url: audioUrl },
				{
					model: "nova-2",
					language: "en",
					smart_format: true,
					punctuate: true,
					paragraphs: true,
					diarize: true,
					filler_words: true,
				}
			);
		if (error) {
			console.error(
				`Error while transcoding audio (deepgram model): ${error}`
			);
			throw new Error(
				`Error while transcoding audio (deepgram model): ${error}`
			);
		}
		return result;
	} catch (err: any) {
		console.error(
			`Error while transcoding audio (deepgram): ${err.message}`
		);
		throw new Error(
			`Error while transcoding audio (deepgram): ${err.message}`
		);
	}
}
