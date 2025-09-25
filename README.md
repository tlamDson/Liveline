# 📹 Video Calling App

A modern video calling application built with React, Node.js, Socket.io, and WebRTC. Features real-time video/audio communication, chat messaging, user authentication, and dark/light mode interface.

## ✨ Features

- 🎥 **Video/Audio Calls** - WebRTC-based peer-to-peer communication
- 📺 **Screen Sharing** - Share your screen with participants
- 💬 **Real-time Chat** - Message during calls with join/leave notifications
- 🔐 **User Authentication** - Register, login, and profile management
- � **Dark/Light Mode** - Toggle between themes with persistence
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🏠 **Room System** - Create or join rooms with custom IDs

## � Tech Stack

- **Frontend:** React 19, Tailwind CSS, Socket.io Client, PeerJS
- **Backend:** Node.js, Express, Socket.io, MongoDB (with file fallback)
- **Authentication:** JWT tokens, bcryptjs
- **Real-time:** WebRTC for video, Socket.io for messaging

## 🚀 Quick Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (optional - uses file storage as fallback)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/tlamDson/Calling-App.git
   cd Calling-App

   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

## 💡 How to Use

1. **Register/Login** to create an account
2. **Create Room** - Generate or enter custom Room ID
3. **Join Call** - Share Room ID with others to join
4. **Controls:**
   - 📹 Toggle camera
   - 🎤 Mute/unmute microphone
   - 🖥️ Share screen
   - � Open chat
   - 🌙 Switch themes

## 🔧 Key Ports

- **Frontend:** http://localhost:5173 (Vite dev server)
- **Backend API:** http://localhost:5001 (Express server)
- **Socket.io:** http://localhost:4000 (Real-time communication)
- **PeerJS:** http://localhost:5001/peerjs (WebRTC signaling)

**Built with ❤️ by [tlamDson](https://github.com/tlamDson)**
