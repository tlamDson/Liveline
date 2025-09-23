import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import Peer from "peerjs";

const Room = () => {
  const { roomId } = useParams();
  const videoGrid = useRef();

  useEffect(() => {
    const socket = io("http://localhost:4000"); // Connect to standalone Socket.IO server

    // Add socket connection debugging
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    //create a peer connection
    const myPeer = new Peer(undefined, {
      host: "localhost",
      port: 5001,
      path: "/peerjs",
    });

    //create a video element for the user
    const myVideo = document.createElement("video");
    myVideo.muted = true;

    let currentStream; // Store the stream for use in socket events

    //get the user's video and audio stream
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        currentStream = stream; // Store the stream
        addVideoStream(myVideo, stream); // Add user's own video

        //answer calls from other users
        myPeer.on("call", (call) => {
          console.log("Answering call from:", call.peer);
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            console.log("Received stream from caller:", call.peer);
            addVideoStream(video, userVideoStream);
          });
          call.on("error", (err) => {
            console.error("Call error:", err);
          });
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    // Wait for peer to get an ID, then join the room
    myPeer.on("open", (id) => {
      console.log("My peer ID:", id);
      socket.emit("join-room", roomId, id); // Use peer ID, not socket ID
    });

    //when a new user connects, call them
    socket.on("user-connected", (userId) => {
      console.log("New user connected:", userId);
      // Add a small delay to ensure the other peer is ready
      setTimeout(() => {
        if (currentStream) {
          connectToNewUser(userId, currentStream, myPeer);
        } else {
          console.log("Stream not ready yet, retrying...");
          setTimeout(() => {
            if (currentStream) {
              connectToNewUser(userId, currentStream, myPeer);
            }
          }, 1000);
        }
      }, 1000);
    });

    //call a new user
    function connectToNewUser(userId, stream, myPeer) {
      console.log("Calling user:", userId);
      try {
        const call = myPeer.call(userId, stream);
        if (!call) {
          console.error("Failed to create call to user:", userId);
          return;
        }

        const video = document.createElement("video");

        call.on("stream", (userVideoStream) => {
          console.log("Received stream from user:", userId);
          addVideoStream(video, userVideoStream);
        });

        call.on("error", (err) => {
          console.error("Error in call to user:", userId, err);
        });

        call.on("close", () => {
          console.log("Call closed with user:", userId);
          video.remove();
        });
      } catch (error) {
        console.error("Error calling user:", userId, error);
      }
    }

    //add a video stream to the video grid
    function addVideoStream(video, stream) {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
      video.setAttribute("autoplay", true);
      video.setAttribute("playsinline", true);

      // Add some styling to make videos visible
      video.style.width = "100%";
      video.style.height = "auto";
      video.style.border = "2px solid #333";
      video.style.borderRadius = "8px";

      videoGrid.current.append(video);
      console.log(
        "Video added to grid. Total videos:",
        videoGrid.current.children.length
      );
    }

    // Cleanup function
    return () => {
      socket.disconnect();
      myPeer.destroy();
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId]);

  return (
    <div>
      <h1>Room ID: {roomId}</h1>
      <div
        ref={videoGrid}
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      ></div>
    </div>
  );
};

export default Room;
