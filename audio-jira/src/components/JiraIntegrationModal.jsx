import React, { useState } from "react";
import {
	X,
	Loader2,
	ArrowRight,
	ArrowLeft,
	Check,
	AlertCircle,
} from "lucide-react";

// Custom Alert component to replace shadcn/ui Alert
const CustomAlert = ({ children, className = "" }) => (
	<div
		className={`flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-xl text-red-600 ${className}`}
	>
		<AlertCircle className="h-4 w-4" />
		<p className="text-sm">{children}</p>
	</div>
);

const SuccessAnimation = () => (
	<div className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
		<div className="w-32 h-32 relative">
			<svg
				className="absolute inset-0 animate-ping"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle
					cx="50"
					cy="50"
					r="45"
					stroke="#4CAF50"
					strokeWidth="8"
					strokeDasharray="20 10"
					className="animate-pulse"
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
					<Check className="w-16 h-16 text-white" />
				</div>
			</div>
		</div>
		<h2 className="text-2xl font-bold text-gray-800 mt-6">
			Integration Successful!
		</h2>
		<p className="text-gray-600 mt-2">Redirecting to dashboard...</p>
	</div>
);

const JiraIntegrationModal = ({ onComplete, onSkip }) => {
	const [step, setStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);
	const [formData, setFormData] = useState({
		jiraUrl: "",
		email: "",
		apiToken: "",
		project: "",
		defaultAssignee: "",
	});

	// Function to get JWT token
	const getAuthToken = () => {
		return localStorage.getItem("jwt") || "";
	};

	// Validation function for Jira URL
	const isValidJiraUrl = (url) => {
		return url.includes(".atlassian.net");
	};

	const validateCredentials = async () => {
		setIsLoading(true);
		setError("");

		// Validate Jira URL
		if (!isValidJiraUrl(formData.jiraUrl)) {
			setError(
				"Invalid Jira URL. The URL must include '.atlassian.net'."
			);
			setIsLoading(false);
			return;
		}

		try {
			const domain = formData.jiraUrl
				.replace(/^https?:\/\//, "")
				.replace(/\/$/, "");
			const token = getAuthToken();

			const response = await fetch(
				"http://3.15.28.161:5001/validate_user",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					credentials: "include",
					body: JSON.stringify({
						username: formData.email,
						api_token: formData.apiToken,
						domain: domain,
					}),
				}
			);

			if (response.status === 401) {
				// Display specific error message for 401 status
				setError("Invalid credentials, try again.");
				return;
			}

			if (response.ok) {
				// Validation successful
				setStep(2); // Proceed to the next step
				setError(""); // Clear any existing error messages
				return;
			}

			// Handle other error statuses
			const data = await response.json();
			throw new Error(
				data.message || "Failed to validate Jira credentials"
			);
		} catch (err) {
			// Handle generic errors
			setError(
				err.message ||
					"Failed to validate Jira credentials. Please check your inputs and try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = () => {
		// Show success animation
		setShowSuccess(true);

		// Redirect to dashboard after animation
		setTimeout(() => {
			onComplete(formData);
		}, 2500); // 2.5 seconds to show the success animation
	};

	const Step = ({ number, current, title }) => (
		<div className="flex items-center">
			<div
				className={`flex items-center justify-center w-8 h-8 rounded-xl ${
					number === current
						? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
						: number < current
						? "bg-green-500 text-white"
						: "bg-gray-200 text-gray-600"
				}`}
			>
				{number < current ? <Check className="h-4 w-4" /> : number}
			</div>
			<span className="ml-2 text-sm text-gray-600">{title}</span>
			{number < 2 && (
				<div className="w-12 h-1 mx-2 bg-gray-200 rounded-full">
					<div
						className={`h-full rounded-full ${
							number < current ? "bg-green-500" : "bg-gray-200"
						}`}
					/>
				</div>
			)}
		</div>
	);

	// If success animation is showing, render just the success screen
	if (showSuccess) {
		return <SuccessAnimation />;
	}

	return (
		<div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity z-50">
			<div className="fixed inset-0 z-10 overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
						<div>
							<div className="mb-8">
								<div className="flex items-center justify-center space-x-4">
									<Step
										number={1}
										current={step}
										title="Connect"
									/>
									<Step
										number={2}
										current={step}
										title="Verify"
									/>
								</div>
							</div>

							{error && (
								<CustomAlert className="mb-6">
									{error}
								</CustomAlert>
							)}

							{step === 1 && (
								<div>
									<div className="text-center mb-6">
										<h3 className="text-xl font-semibold text-gray-900">
											Connect to Jira
										</h3>
										<p className="mt-2 text-gray-600">
											Enter your Jira instance URL and
											credentials
										</p>
									</div>
									<form
										onSubmit={(e) => {
											e.preventDefault();
											validateCredentials();
										}}
									>
										<div className="space-y-4">
											<InputField
												label="Jira Instance URL"
												placeholder="your-domain.atlassian.net"
												value={formData.jiraUrl}
												onChange={(e) =>
													setFormData({
														...formData,
														jiraUrl: e.target.value,
													})
												}
												required
											/>
											<InputField
												label="Email"
												type="email"
												placeholder="your-email@company.com"
												value={formData.email}
												onChange={(e) =>
													setFormData({
														...formData,
														email: e.target.value,
													})
												}
												required
											/>
											<InputField
												label="API Token"
												type="password"
												placeholder="Your Jira API token"
												value={formData.apiToken}
												onChange={(e) =>
													setFormData({
														...formData,
														apiToken:
															e.target.value,
													})
												}
												required
												helper="Generate an API token from your Atlassian account settings"
											/>
											<div className="flex justify-end space-x-3 pt-4">
												<button
													type="button"
													onClick={onSkip}
													className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-500 transition-colors"
												>
													Skip for now
												</button>
												<button
													type="submit"
													disabled={isLoading}
													className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
												>
													{isLoading ? (
														<>
															<Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
															Validating...
														</>
													) : (
														<>
															Next
															<ArrowRight className="ml-2 h-4 w-4" />
														</>
													)}
												</button>
											</div>
										</div>
									</form>
								</div>
							)}

							{step === 2 && (
								<div>
									<div className="text-center mb-6">
										<h3 className="text-xl font-semibold text-gray-900">
											Verify Connection
										</h3>
										<p className="mt-2 text-gray-600">
											Confirm your Jira integration
											settings
										</p>
									</div>
									<div className="bg-gray-50/50 rounded-xl p-6 mb-6">
										<dl className="space-y-4">
											<div className="flex justify-between">
												<dt className="text-sm font-medium text-gray-500">
													Jira Instance
												</dt>
												<dd className="text-sm text-gray-900">
													{formData.jiraUrl}
												</dd>
											</div>
											<div className="flex justify-between">
												<dt className="text-sm font-medium text-gray-500">
													Email
												</dt>
												<dd className="text-sm text-gray-900">
													{formData.email}
												</dd>
											</div>
										</dl>
									</div>
									<div className="flex justify-end space-x-3">
										<button
											type="button"
											onClick={() => setStep(1)}
											className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-500 transition-colors"
										>
											<ArrowLeft className="mr-2 h-4 w-4" />
											Back
										</button>
										<button
											onClick={handleSubmit}
											className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:opacity-90 transition-all transform hover:scale-105"
										>
											Complete Setup
											<Check className="ml-2 h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const InputField = ({
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	required,
	helper,
}) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
		<input
			type={type}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			required={required}
			className="w-full px-3 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
		/>
		{helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
	</div>
);

export default JiraIntegrationModal;
