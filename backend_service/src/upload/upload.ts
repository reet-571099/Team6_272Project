import "../config/envLoader.js";
import { Router } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import path from "path";
import { isUserLoggedIn } from "../middleware/auth.js";

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		const fileExt = path.extname(file.originalname).toLowerCase();
		if (fileExt !== ".mp3") {
			return cb(new Error("Only MP3 files are allowed!"));
		}
		cb(null, true);
	},
});

const router = Router();

// Upload Route
router.post(
	"",
	[upload.single("audio_file"), isUserLoggedIn],
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).send({ message: "No file uploaded!" });
			}
			const userId = req.user._id?.toString();
			const projectId = req.body.project_id;
			if (!userId || !projectId) {
				return res.status(400).send({
					message:
						"User needs to be logged in and project id should be present!",
				});
			}
			const folder = "audios";
			const customFileName = `${userId}_${projectId}_${Date.now()}_${
				req.file.originalname
			}`;
			const uploadParams = {
				Bucket: process.env.AWS_S3_BUCKET_NAME!,
				Key: `${folder}/${customFileName}`,
				Body: req.file.buffer,
				ContentType: "audio/mpeg",
			};
			const data = await s3.upload(uploadParams).promise();
			res.status(200).send({
				message: "File uploaded successfully!",
				url: data.Location,
			});
		} catch (err) {
			console.error("Error uploading file:", err);
			res.status(500).send({ message: "File upload failed!", err });
		}
	}
);

export default router;
