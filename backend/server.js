const express = require("express");
// import http from the http module
const http = require("http");
const { ExpressPeerServer } = require("peer");

//create an express app
const app = express();
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

//listen for connection event on the socket io server
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  //listen for join-room event from the client
  socket.on("join-room", (roomId, userId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    //join the user to the room
    socket.join(roomId);
    //notify others users in the room that a new user has connecte
    socket.to(roomId).emit("user-connected", userId);
  });
  //listen for disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
