import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DarkModeToggle from "./DarkModeToggle";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
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
              Welcome Back
            </h1>
            <p className={isDarkMode ? "text-white/80" : "text-gray-600"}>
              Sign in to your account
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                  focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                placeholder="Enter your password"
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
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={isDarkMode ? "text-white/80" : "text-gray-600"}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className={`font-semibold transition-colors ${
                  isDarkMode
                    ? "text-white hover:text-white/80"
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
