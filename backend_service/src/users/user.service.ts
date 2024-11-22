import "../config/envLoader.js";
import axios from "axios";
import { IUserCreation } from "./user.interface.js";
import * as UsersDataLayer from "./user.datalayer.js";
import { UserType } from "../models/user.schema.js";

export async function getUsers(
	findQuery = {},
	projectQuery = {},
	sortOrder = {},
	page = 1,
	limit = 10
) {
	try {
		const users = await UsersDataLayer.getUsers(
			findQuery,
			projectQuery,
			sortOrder,
			page,
			limit
		);
		return users;
	} catch (err: any) {
		console.error(`error while fetching users: ${err?.message}`);
		throw new Error(`error while fetching users: ${err?.message}`);
	}
}

export async function getSingleUser(findQuery: any, projectQuery = {}) {
	try {
		const user = await UsersDataLayer.getSingleUser(
			findQuery,
			projectQuery
		);
		return user;
	} catch (err: any) {
		console.error(`error while fetching user: ${err?.message}`);
		throw new Error(`error while fetching user: ${err?.message}`);
	}
}

export async function createUser(
	UserCreationObj: IUserCreation
): Promise<UserType> {
	try {
		const user = await UsersDataLayer.createUser(UserCreationObj);
		return user;
	} catch (err: any) {
		console.error(`error while creating user: ${err?.message}`);
		throw new Error(`error while creating user: ${err?.message}`);
	}
}

export async function updateSingleUser(findQuery: any, updateQuery: any) {
	try {
		const user = await UsersDataLayer.updateSingleUser(
			findQuery,
			updateQuery
		);
		return user;
	} catch (err: any) {
		console.error(`error while updating user: ${err?.message}`);
		throw new Error(`error while updating user: ${err?.message}`);
	}
}

export async function validateLogin(email, password) {
	try {
		const { user, token } = await UsersDataLayer.validateLogin(
			email,
			password
		);
		return { user, token };
	} catch (err: any) {
		console.error("Error during login:", err?.message);
		throw new Error(`Error during login: ${err?.message}`);
	}
}

export async function validateJiraToken(userId, username, api_token, domain) {
	try {
		const response = await axios.post(
			`${process.env.JIRA_VALIDATION_BASE_URL}/validate_user`,
			{
				username,
				api_token,
				domain,
			},
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		if (response?.data?.status == "success") {
			const updatedUser = await UsersDataLayer.updateSingleUser(
				{ _id: userId },
				{ jira_token: api_token }
			);
			if (updatedUser?.jira_token) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} catch (err: any) {
		console.error("Error during user jira validation", err?.message);
		throw new Error(`Error during user jira validation ${err?.message}`);
	}
}
