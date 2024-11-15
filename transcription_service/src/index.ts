import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import passport from "passport";

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === "prod") {
	dotenv.config({ path: ".env" });
} else {
	process.env.NODE_ENV = "staging";
	dotenv.config({ path: ".env.staging" });
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(passport.initialize());
// logging requests
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
	console.log(`Listening on port: ${port}`);
});

app.get("/health-check", (req, res) => {
	res.send("Health Check!");
});
