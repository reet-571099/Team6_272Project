import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
export const loadEnv = (): void => {
	if (process.env.NODE_ENV === "prod") {
		dotenv.config({ path: ".env" });
	} else {
		process.env.NODE_ENV = "staging";
		dotenv.config({ path: ".env.staging" });
	}
};

loadEnv();
