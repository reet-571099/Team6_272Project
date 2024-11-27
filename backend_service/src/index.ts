import "./config/envLoader.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import passport from "passport";
import UserRoutes from "./users/user.controller.js";
import UploadRoutes from "./upload/upload.js";

const app = express();
app.use(express.json());

const corsOptions = {
	origin: "http://localhost:3000", // Allow only your frontend origin
	credentials: true, // Allow cookies and authentication headers
};
app.use(cors(corsOptions));

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

app.use("/api/users", UserRoutes);
app.use("/api/upload", UploadRoutes);
