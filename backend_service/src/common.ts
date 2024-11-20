import "./config/envLoader.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateJWT = (userId, email) => {
	const payload = { id: userId, email: email };
	return jwt.sign(
		payload,
		JWT_SECRET
		// { expiresIn: "1d" }
	);
};
