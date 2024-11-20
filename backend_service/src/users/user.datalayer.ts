import { generateJWT } from "../common.js";
import { UserModel, UserType } from "../models/user.schema.js";
import { IUserCreation } from "./user.interface.js";
import bcrypt from "bcrypt";

export async function getUsers(
	findQuery = {},
	projectQuery = {},
	sortOrder = {},
	page = 1,
	limit = 10
) {
	try {
		if (limit === -1) {
			const users = await UserModel.find(findQuery, projectQuery).sort(
				sortOrder
			);
			return users;
		} else {
			const skip = (page - 1) * limit;
			const users = await UserModel.find(findQuery, projectQuery)
				.sort(sortOrder)
				.skip(skip)
				.limit(limit);
			return users;
		}
	} catch (err: any) {
		console.error(`error while fetching users: ${err?.message}`);
		throw new Error(`error while fetching users: ${err?.message}`);
	}
}

export async function getSingleUser(findQuery: any, projectQuery = {}) {
	try {
		const user = await UserModel.findOne(findQuery, projectQuery).lean();
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
		const user = new UserModel(UserCreationObj);
		return await user.save();
	} catch (err: any) {
		console.error(`error while creating user: ${err?.message}`);
		throw new Error(`error while creating user: ${err?.message}`);
	}
}

export async function updateSingleUser(findQuery: any, updateQuery: any) {
	try {
		const user = await UserModel.findOneAndUpdate(findQuery, updateQuery, {
			new: true,
		}).lean();
		return user;
	} catch (err: any) {
		console.error(`error while updating user: ${err?.message}`);
		throw new Error(`error while updating user: ${err?.message}`);
	}
}

export async function validateLogin(email: string, password: string) {
	try {
		const user = await UserModel.findOne({ email, is_deleted: false });
		if (!user) {
			throw new Error("User not found");
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new Error("Invalid password");
		}
		const token = generateJWT(user?._id?.toString(), user?.email);
		return { user, token };
	} catch (err: any) {
		throw new Error(`Login failed: ${err?.message}`);
	}
}
