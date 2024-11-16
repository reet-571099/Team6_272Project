import "../config/envloader.js";
import { createClient } from "@deepgram/sdk";
import { sendSQSMessage } from "../sqs-producer/sqs-producer.service.js";

export async function processTranscriptionMessage(messageObject: any) {
	console.log("messageObject: ", messageObject);
	const transcriptionResult = await deepgramTranscribeAudioUtil(
		messageObject?.audio_url
	);
	// TODO: Delete
	console.log("+++++++++++++++++++++++++++++++++++++++++");
	console.log(
		"transcriptionResult (json): ",
		JSON.stringify(transcriptionResult)
	);
	console.log("+++++++++++++++++++++++++++++++++++++++++");
	// Simulate processing
	const processedData = {
		...messageObject,
		status: "TRANSCIPTION_DONE",
		timestamp: new Date().toISOString(),
	};
	const storyQueueUrl = process.env.STORY_QUEUE_URL as string;
	console.log("storyQueueUrl: ", storyQueueUrl);
	await sendSQSMessage(storyQueueUrl, processedData);
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
					summarize: "v2",
					topics: true,
					intents: true,
					smart_format: true,
					punctuate: true,
					paragraphs: true,
					diarize: true,
					filler_words: true,
					sentiment: true,
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
