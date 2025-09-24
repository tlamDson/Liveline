import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 text-white">
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <i className="fas fa-video text-2xl text-green-400"></i>
              <h1 className="text-xl font-bold">Video Call App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white/80">Welcome, {user?.username}</span>
              <Link
                to="/profile"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <i className="fas fa-user"></i>
                <span>Profile</span>
              </Link>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-5 text-green-400">
            <i className="fas fa-video"></i>
          </div>
          <h1 className="text-5xl font-bold mb-5 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
            Video Call App
          </h1>
          <p className="text-xl opacity-90 mb-10 leading-relaxed">
            Connect with anyone, anywhere. High-quality video conferencing made
            simple.
          </p>

          <div className="mt-10">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8 flex-wrap">
              <input
                type="text"
                className="bg-white/10 border border-white/20 text-white px-5 py-4 rounded-xl text-base outline-none min-w-64 placeholder-white/60"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="bg-green-400 hover:bg-green-500 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-400/30 flex items-center gap-3"
                onClick={joinRoom}
              >
                <i className="fas fa-video"></i>
                Start Meeting
              </button>
            </div>
            <button
              className="bg-white/10 border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 flex items-center gap-3 mx-auto"
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
