import "../config/envLoader.js";
import { Request, Response, NextFunction } from "express";
import { passportConfig } from "../config/passport.js";
import { generateJWT } from "../common.js";

export const googleAuth = passportConfig.authenticate("google", {
	scope: ["profile", "email"],
});

export const googleCallback = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	passportConfig.authenticate("google", { session: false }, (err, user) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.redirect("/api/users/login");
		}
		const token = generateJWT(user._id, user.email);
		console.log("*******************************");
		console.log(`JWT token (google): ${token} for user id: ${user.id}`);
		console.log("*******************************");
		// Set JWT in cookie
		res.cookie("jwt", token, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "prod",
			sameSite: "lax",
			// maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
		const userEmailObj = {
			email: user?.email,
		};
		// Set user in cookie
		res.cookie("user_email", JSON.stringify(userEmailObj), {
			httpOnly: false,
			secure: process.env.NODE_ENV === "prod",
			sameSite: "lax",
			// maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
		req["user"] = user;
		next();
	})(req, res, next);
};

export const jwtAuth = passportConfig.authenticate("jwt", { session: false });

export const isUserLoggedIn = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	passportConfig.authenticate(
		"jwt",
		{ session: false },
		(err, user, info) => {
			if (err) {
				return next(err);
			}
			if (!user) {
				return res
					.status(401)
					.json({ error: info?.message || "Unauthorized" });
			}
			req["user"] = user;
			next();
		}
	)(req, res, next);
};

export const generateToken = (userId, email) => {
	const token = generateJWT(userId, email);
	return token;
};
