import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DarkModeToggle from "./DarkModeToggle";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const joinRoom = () => {
    const finalRoomId = roomId.trim() || generateRoomId();
    navigate(`/room/${finalRoomId}`);
  };

  const createRandomRoom = () => {
    const randomRoomId = generateRoomId();
    navigate(`/room/${randomRoomId}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
          : "bg-white"
      } ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      <div
        className={`backdrop-blur-md border-b transition-all duration-300 ${
          isDarkMode
            ? "bg-gray-900/50 border-white/20"
            : "bg-gray-50/80 border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <i
                className={`fas fa-video text-2xl ${
                  isDarkMode ? "text-green-400" : "text-indigo-600"
                }`}
              ></i>
              <h1 className="text-xl font-bold">Video Call App</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-2">
              <span
                className={`text-sm sm:text-base ${
                  isDarkMode ? "text-white/80" : "text-gray-600"
                }`}
              >
                Welcome, {user?.username}
              </span>
              <DarkModeToggle />
              <Link
                to="/profile"
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 
                  flex items-center space-x-2 text-sm font-medium border
                  ${
                    isDarkMode
                      ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white"
                  }`}
              >
                <i className="fas fa-user"></i>
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={() => logout()}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 
                  flex items-center space-x-2 text-sm font-medium border
                  ${
                    isDarkMode
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30"
                      : "bg-red-500 hover:bg-red-600 text-white border-red-500"
                  }`}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="text-center max-w-2xl">
          <div
            className={`text-6xl mb-5 ${
              isDarkMode ? "text-green-400" : "text-indigo-600"
            }`}
          >
            <i className="fas fa-video"></i>
          </div>
          <h1
            className={`text-4xl sm:text-5xl font-bold mb-5 bg-gradient-to-r 
            ${
              isDarkMode
                ? "from-green-400 to-green-500"
                : "from-indigo-600 to-purple-600"
            } bg-clip-text text-transparent`}
          >
            Video Call App
          </h1>
          <p
            className={`text-lg sm:text-xl mb-10 leading-relaxed ${
              isDarkMode ? "text-white/90" : "text-gray-600"
            }`}
          >
            Connect with anyone, anywhere. High-quality video conferencing made
            simple.
          </p>

          <div className="mt-10">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8 flex-wrap">
              <input
                type="text"
                className={`px-5 py-4 rounded-xl text-base outline-none min-w-64 
                  transition-all duration-300 focus:scale-105 border
                  ${
                    isDarkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-green-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500"
                  }`}
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className={`px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 
                  hover:-translate-y-0.5 flex items-center gap-3 border-2
                  ${
                    isDarkMode
                      ? "bg-green-400 hover:bg-green-500 text-white border-green-400 hover:shadow-lg hover:shadow-green-400/30"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:shadow-lg hover:shadow-indigo-600/30"
                  }`}
                onClick={joinRoom}
              >
                <i className="fas fa-video"></i>
                Start Meeting
              </button>
            </div>
            <button
              className={`px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 
                hover:-translate-y-0.5 flex items-center gap-3 mx-auto border
                ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 hover:bg-white/20 text-white hover:shadow-lg hover:shadow-white/10"
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700 hover:shadow-lg hover:shadow-gray-300/50"
                }`}
              onClick={createRandomRoom}
            >
              <i className="fas fa-random"></i>
              Create Random Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
