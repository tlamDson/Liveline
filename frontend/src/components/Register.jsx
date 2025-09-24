import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DarkModeToggle from "./DarkModeToggle";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const { register } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setValidationErrors([]);

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
      if (result.errors) {
        setValidationErrors(result.errors);
      }
    }

    setLoading(false);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
          : "bg-white"
      }`}
    >
      <div className="w-full max-w-md">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-4">
          <DarkModeToggle />
        </div>

        <div
          className={`backdrop-blur-md border rounded-2xl p-8 shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">
              <i
                className={`fas fa-video ${
                  isDarkMode ? "text-white" : "text-indigo-600"
                }`}
              ></i>
            </div>
            <h1
              className={`text-2xl font-bold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Create Account
            </h1>
            <p className={isDarkMode ? "text-white/80" : "text-gray-600"}>
              Join the video calling experience
            </p>
          </div>

          {error && (
            <div
              className={`border rounded-lg p-3 mb-6 transition-all duration-300 ${
                isDarkMode
                  ? "bg-red-500/20 border-red-500/30"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-sm text-center ${
                  isDarkMode ? "text-red-200" : "text-red-800"
                }`}
              >
                {error}
              </p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div
              className={`border rounded-lg p-3 mb-6 transition-all duration-300 ${
                isDarkMode
                  ? "bg-red-500/20 border-red-500/30"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {validationErrors.map((err, index) => (
                <p
                  key={index}
                  className={`text-sm ${
                    isDarkMode ? "text-red-200" : "text-red-800"
                  }`}
                >
                  {err.msg}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-white/90" : "text-gray-700"
                }`}
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                  focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-white/90" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                  focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-white/90" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                  focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                placeholder="Create a password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-white/90" : "text-gray-700"
                }`}
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                  focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold rounded-lg transition-all duration-300 
                disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isDarkMode
                    ? "bg-white/20 hover:bg-white/30 text-white border-white/20 hover:border-white/40"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div
                    className={`animate-spin rounded-full h-5 w-5 border-2 mr-2 ${
                      isDarkMode
                        ? "border-white/30 border-t-white"
                        : "border-white/30 border-t-white"
                    }`}
                  ></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={isDarkMode ? "text-white/80" : "text-gray-600"}>
              Already have an account?{" "}
              <Link
                to="/login"
                className={`font-semibold transition-colors ${
                  isDarkMode
                    ? "text-white hover:text-white/80"
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
