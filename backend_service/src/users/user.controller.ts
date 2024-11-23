import { Router, Request, Response, NextFunction } from "express";
import * as UsersService from "./user.service.js";
import { IUserCreation } from "./user.interface.js";
import {
	generateToken,
	googleAuth,
	googleCallback,
	isUserLoggedIn,
	jwtAuth,
} from "../middleware/auth.js";

const router = Router();

router.post("/get_users", [], async (req: Request, res: Response) => {
	try {
		const findQuery = req.body.find_query || {};
		const projectQuery = req.body.project_query || {};
		const sortOrder = req.body.sort_order || { _id: -1 };
		const page = parseInt(req.body.page) || 1;
		const limit = parseInt(req.body.limit) || 10;
		const users = await UsersService.getUsers(
			findQuery,
			projectQuery,
			sortOrder,
			page,
			limit
		);
		res.status(200).json(users);
	} catch (err: any) {
		res.status(500).json({
			error: `Error fetching users (post): ${err.message}`,
		});
	}
});

router.get("/get_users", [], async (req: Request, res: Response) => {
	try {
		const findQuery = {};
		const projectQuery = {};
		const sortOrder = { _id: -1 };
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.page as string) || 10;
		const users = await UsersService.getUsers(
			findQuery,
			projectQuery,
			sortOrder,
			page,
			limit
		);
		res.status(200).json(users);
	} catch (err: any) {
		res.status(500).json({
			error: `Error fetching users (get): ${err.message}`,
		});
	}
});

router.get("/:user_id", [], async (req: Request, res: Response) => {
	try {
		const userId = req.params.user_id;
		const user = await UsersService.getSingleUser({
			_id: userId,
		});
		res.status(200).json(user);
	} catch (err: any) {
		res.status(500).json({ error: `Error fetching user: ${err.message}` });
	}
});

router.put(
	"/update_user",
	[isUserLoggedIn],
	async (req: Request, res: Response) => {
		try {
			const userId = req.body.user_id;
			const updateQuery = req.body.update_query;
			const updatedUser = await UsersService.updateSingleUser(
				{ _id: userId },
				updateQuery
			);
			res.status(201).json(updatedUser);
		} catch (err: any) {
			res.status(500).json({
				error: `Error updating user: ${err.message}`,
			});
		}
	}
);

router.delete(
	"/:user_id",
	[isUserLoggedIn],
	async (req: Request, res: Response) => {
		try {
			const userId = req.params.user_id;
			const updateQuery = {
				is_deleted: true,
			};
			const updatedUser = await UsersService.updateSingleUser(
				{ _id: userId },
				updateQuery
			);
			res.status(201).json(updatedUser);
		} catch (err: any) {
			res.status(500).json({
				error: `Error deleting user: ${err.message}`,
			});
		}
	}
);

router.post("/signup", [], async (req: Request, res: Response) => {
	try {
		const userCreationObj: IUserCreation = {
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			email: req.body.email,
			p_n: req.body.p_n,
			profile_pic: req.body.profile_pic,
			password: req.body.password,
			metadata: req.body.metadata,
		};
		const user = await UsersService.createUser(userCreationObj);
		const token = generateToken(user?._id?.toString(), user?.email);
		console.log("*******************************");
		console.log(`JWT token (email): ${token} for user id: ${user?._id}`);
		console.log("*******************************");

		// Set JWT in cookie
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "prod",
			sameSite: "lax",
			// maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
		req["user"] = user; // Attach user to the request object
		res.status(201).json({ user, token });
	} catch (err: any) {
		res.status(500).json({
			error: `Error while signing up user: ${err.message}`,
		});
	}
});

router.post("/login", [], async (req, res) => {
	try {
		const { email, password } = req.body;
		// Validate user credentials and get the token
		const { user, token } = await UsersService.validateLogin(
			email,
			password
		);
		// Set JWT in cookie
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "prod",
			sameSite: "lax",
			// maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
		req["user"] = user; // Attach user to the request object
		// Respond with user and token
		return res.status(200).json({ user, token });
	} catch (err: any) {
		console.error("Error during login:", err?.message);
		return res.status(401).json({ error: err.message });
	}
});

router.get("/auth/google", [googleAuth]);

router.get(
	"/auth/google/callback",
	[googleCallback],
	(req: Request, res: Response) => {
		res.redirect("/");
	}
);

router.post("/validate_user", [isUserLoggedIn], async (req, res) => {
	try {
		const { username, api_token, domain } = req.body;
		const userId = req?.user?._id?.toString();
		// Validate user credentials and get the token
		const isValidated = await UsersService.validateJiraToken(
			userId,
			username,
			api_token,
			domain
		);
		// Respond with user and token
		return res.status(200).json({ isValidated });
	} catch (err: any) {
		console.error("Error during user jira validation:", err?.message);
		return res.status(500).json({ error: err.message });
	}
});

export default router;
