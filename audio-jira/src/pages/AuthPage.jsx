import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateInput = () => {
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return false;
    }
    if (isSignUp && (!formData.first_name || !formData.last_name)) {
      setError("First name and last name are required for sign-up.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput()) return;

    setLoading(true);
    setError("");
    try {
      const url = isSignUp
        ? "http://localhost:8000/api/users/signup"
        : "http://localhost:8000/api/users/login";

      const payload = isSignUp
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Incorrect Username/Password");
      }

      const data = await response.json();
      if (isSignUp) {
        alert("Account created successfully! Redirecting to dashboard...");
      } else {
        localStorage.setItem("jwt", data.token); // Store JWT for login
        alert("Login successful! Redirecting to dashboard...");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center sm:px-6 lg:px-8 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp
            ? "Sign up to get started with AudioJira"
            : "Sign in to continue to AudioJira"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 backdrop-blur-lg py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all transform hover:scale-105"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Sign up"
                : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <p>
                Already have an account?{" "}
                <button
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <button
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => setIsSignUp(true)}
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
