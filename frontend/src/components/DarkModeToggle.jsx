import React from "react";
import { useTheme } from "../context/ThemeContext";

const DarkModeToggle = ({ className = "" }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        px-3 py-2 rounded-lg border transition-all duration-300 
        flex items-center space-x-2 text-sm font-medium
        ${
          isDarkMode
            ? "bg-gray-800 hover:bg-gray-700 text-yellow-400 border-gray-600"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
        }
        hover:scale-105 active:scale-95
        ${className}
      `}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-lg`}></i>
      <span className="hidden sm:inline">{isDarkMode ? "Light" : "Dark"}</span>
    </button>
  );
};

export default DarkModeToggle;
