const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const { ExpressPeerServer } = require("peer");
let authRoutes;

// Try to use MongoDB-based auth routes, fallback to file-based
try {
  authRoutes = require("./routes/auth");
} catch (error) {
  console.log("Using fallback auth routes");
  authRoutes = require("./routes/auth-fallback");
}

//create an express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB (optional - will use file storage if connection fails)
let mongoConnected = false;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/callapp", {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    mongoConnected = true;
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("🔄 Using file-based storage as fallback");
    console.log("💡 To use MongoDB:");
    console.log("   1. Install MongoDB locally, or");
    console.log(
      "   2. Update MONGODB_URI in .env with MongoDB Atlas connection string"
    );
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
  mongoConnected = false;
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected - using file storage");
  mongoConnected = false;
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
  mongoConnected = true;
});

// Routes
app.use("/api/auth", authRoutes);

//create a server using http
const server = http.createServer(app);

//Peer server
const peerServer = ExpressPeerServer(server, { debug: true });
//use the peer server middleware
app.use("/peerjs", peerServer);

// Create standalone Socket.IO server on separate port
const io = require("socket.io")({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//listening socket io on different port
io.listen(4000);

// Store room participants
const roomParticipants = new Map(); // roomId -> Set of {socketId, userId, username}

//listen for connection event on the socket io server
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  //listen for join-room event from the client
  socket.on(
    "join-room",
    (roomId, userId, username = `User${userId.substr(0, 6)}`) => {
      console.log(`User ${username} (${userId}) joined room ${roomId}`);

      //join the user to the room
      socket.join(roomId);

      // Track this user in the room
      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Set());
      }
      roomParticipants.get(roomId).add({
        socketId: socket.id,
        userId: userId,
        username: username,
      });

      //notify others users in the room that a new user has connected
      socket.to(roomId).emit("user-connected", userId);

      // Send user joined message to room
      socket.to(roomId).emit("chat-message", {
        message: `${username} joined the room`,
        username: "System",
        isSystem: true,
        timestamp: new Date().toISOString(),
      });

      // Store room and user info in socket for disconnect handling
      socket.roomId = roomId;
      socket.userId = userId;
      socket.username = username;
    }
  );

  //listen for chat messages
  socket.on("chat-message", (data) => {
    console.log(`Chat message in room ${data.roomId}:`, data);
    //broadcast the message to all other users in the room
    socket.to(data.roomId).emit("chat-message", {
      message: data.message,
      username: data.username,
      timestamp: new Date().toISOString(),
    });
  });

  //listen for disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.roomId && socket.userId && socket.username) {
      // Remove user from room participants
      if (roomParticipants.has(socket.roomId)) {
        const participants = roomParticipants.get(socket.roomId);
        for (let participant of participants) {
          if (participant.socketId === socket.id) {
            participants.delete(participant);
            break;
          }
        }

        // Clean up empty rooms
        if (participants.size === 0) {
          roomParticipants.delete(socket.roomId);
        }
      }

      // Notify other users in the room
      socket.to(socket.roomId).emit("user-disconnected", socket.userId);
      socket.to(socket.roomId).emit("chat-message", {
        message: `${socket.username} left the room`,
        username: "System",
        isSystem: true,
        timestamp: new Date().toISOString(),
      });
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
