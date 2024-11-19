import "./config/envLoader.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import passport from "passport";
import { startSQSConsumer } from "./sqs-consumer/sqs-consumer.service.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(passport.initialize());

// Logging requests
app.use((req, res, next) => {
	console.log(`${req.method} ${req.path}`);
	next();
});

const mongoDbUrl = process.env.MONGODB_URL as string;
mongoose
	.connect(mongoDbUrl)
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("Error connecting to MongoDB:", err));

const port = process.env.PORT;

app.listen(port, () => {
	console.log(`Running Environment: ${process.env.NODE_ENV}`);
	console.log(`Server is running on port: ${port}`);
});

app.get("/health-check", (req, res) => {
	res.send("Health Check!");
});

// Start the SQS consumer
const transcriptionQueueUrl = process.env.TRANSCRIPTION_QUEUE_URL as string;
startSQSConsumer(transcriptionQueueUrl)
	.then(() => console.log("SQS Consumer started successfully"))
	.catch((error) => console.error("Error starting SQS Consumer:", error));
