module.exports = {
	apps: [
		{
			name: "react-app", // Name of your app
			script: "npx", // Command to run
			args: "serve -s build -l 3001", // Arguments for the serve command
		},
	],
};
