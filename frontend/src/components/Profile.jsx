import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const updateData = {
      username: formData.username,
      email: formData.email,
    };

    const result = await updateProfile(updateData);

    if (result.success) {
      setMessage("Profile updated successfully!");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    const result = await updateProfile({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.success) {
      setMessage("Password changed successfully!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
            : "bg-white"
        }`}
      >
        <div
          className={`text-center ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <div
            className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${
              isDarkMode
                ? "border-white/30 border-t-white"
                : "border-gray-300 border-t-gray-600"
            }`}
          ></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
          : "bg-white"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header with Return Button */}
        <div
          className={`backdrop-blur-md border rounded-2xl p-4 sm:p-6 mb-6 shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/")}
              className={`px-4 py-2 rounded-lg transition-all duration-300 
                flex items-center space-x-2 text-sm font-medium border
                hover:scale-105 active:scale-95
                ${
                  isDarkMode
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
                }`}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Home</span>
            </button>
            <DarkModeToggle />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDarkMode ? "bg-white/20" : "bg-indigo-100"
                }`}
              >
                <i
                  className={`fas fa-user text-2xl ${
                    isDarkMode ? "text-white" : "text-indigo-600"
                  }`}
                ></i>
              </div>
              <div>
                <h1
                  className={`text-xl sm:text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {user.username}
                </h1>
                <p className={isDarkMode ? "text-white/80" : "text-gray-600"}>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`px-4 sm:px-6 py-2 rounded-lg transition-all duration-300 
                text-sm font-medium border flex items-center space-x-2
                ${
                  isDarkMode
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30"
                    : "bg-red-500 hover:bg-red-600 text-white border-red-500"
                }`}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`backdrop-blur-md border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <div
            className={`flex border-b ${
              isDarkMode ? "border-white/20" : "border-gray-200"
            }`}
          >
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
                activeTab === "profile"
                  ? isDarkMode
                    ? "bg-white/20 text-white border-b-2 border-white"
                    : "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600"
                  : isDarkMode
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <i className="fas fa-user mr-2"></i>
              <span className="hidden sm:inline">Profile Info</span>
              <span className="sm:hidden">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
                activeTab === "password"
                  ? isDarkMode
                    ? "bg-white/20 text-white border-b-2 border-white"
                    : "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600"
                  : isDarkMode
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <i className="fas fa-lock mr-2"></i>
              <span className="hidden sm:inline">Change Password</span>
              <span className="sm:hidden">Password</span>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {message && (
              <div
                className={`border rounded-lg p-3 mb-6 transition-all duration-300 ${
                  isDarkMode
                    ? "bg-green-500/20 border-green-500/30"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <p
                  className={`text-sm text-center ${
                    isDarkMode ? "text-green-200" : "text-green-800"
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

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

            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                      Updating...
                    </div>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </form>
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-white/90" : "text-gray-700"
                    }`}
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                      focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                      }`}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-white/90" : "text-gray-700"
                    }`}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 
                      focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 focus:ring-white/20"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                      }`}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-white/90" : "text-gray-700"
                    }`}
                  >
                    Confirm New Password
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
                    placeholder="Confirm new password"
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
                      Changing...
                    </div>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
