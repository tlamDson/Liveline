import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DarkModeToggle from "./DarkModeToggle";
import Peer from "peerjs";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const videoGrid = useRef();

  // State management
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [chatMessages, setChatMessages] = useState([
    {
      message:
        "Welcome to the room! You can chat with other participants here.",
      username: "System",
      isSystem: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [username, setUsername] = useState(user?.username || "Anonymous");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const socketRef = useRef();
  const myPeerRef = useRef();
  const peersRef = useRef({});
  const myStreamRef = useRef();
  const videoElementsRef = useRef({}); // Track video elements by user ID

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Function to clean up orphaned video containers
  const cleanupVideoContainers = () => {
    if (!videoGrid.current) return;

    const containers = videoGrid.current.querySelectorAll(
      ".video-container[data-user-id]"
    );
    containers.forEach((container) => {
      const userId = container.getAttribute("data-user-id");
      // If we don't have a peer connection for this user, remove the container
      if (userId && !peersRef.current[userId]) {
        console.log("Removing orphaned video container for user:", userId);
        container.remove();
        delete videoElementsRef.current[userId];
      }
    });

    setParticipantCount(videoGrid.current.children.length);
  };

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard
      .writeText(roomLink)
      .then(() => {
        showNotification("Room link copied to clipboard!", "success");
      })
      .catch(() => {
        showNotification("Failed to copy room link", "error");
      });
  };

  const leaveRoom = () => {
    if (window.confirm("Are you sure you want to leave the room?")) {
      // Cleanup
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((peer) => {
        if (peer.close) peer.close();
      });
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (myPeerRef.current) {
        myPeerRef.current.destroy();
      }
      navigate("/");
    }
  };

  const toggleVideo = async () => {
    if (!myStream) return;

    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
      showNotification(
        videoTrack.enabled ? "Video enabled" : "Video disabled",
        "success"
      );
    }
  };

  const toggleAudio = async () => {
    if (!myStream) return;

    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
      showNotification(
        audioTrack.enabled ? "Microphone enabled" : "Microphone disabled",
        "success"
      );
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const videoTrack = screenStream.getVideoTracks()[0];

        if (videoTrack && myStream) {
          const sender = myStream.getVideoTracks()[0];
          // Replace video track in all peer connections
          Object.values(peersRef.current).forEach((peer) => {
            if (peer.replaceTrack) {
              peer.replaceTrack(sender, videoTrack, myStream);
            }
          });

          setIsScreenSharing(true);
          showNotification("Screen sharing started", "success");

          videoTrack.onended = () => {
            setIsScreenSharing(false);
            showNotification("Screen sharing stopped", "success");
          };
        }
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        const videoTrack = cameraStream.getVideoTracks()[0];
        if (videoTrack && myStream) {
          const sender = myStream.getVideoTracks()[0];
          // Replace video track in all peer connections
          Object.values(peersRef.current).forEach((peer) => {
            if (peer.replaceTrack) {
              peer.replaceTrack(sender, videoTrack, myStream);
            }
          });
        }

        setIsScreenSharing(false);
        showNotification("Screen sharing stopped", "success");
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      showNotification("Failed to toggle screen sharing", "error");
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit("chat-message", {
        message: newMessage,
        username: username,
        roomId: roomId,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          message: newMessage,
          username: "You",
          isOwn: true,
        },
      ]);

      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const addVideoStream = (video, stream, isSelf = false, userId = null) => {
    console.log("Adding video stream:", {
      isSelf,
      userId,
      stream,
      videoTracks: stream?.getVideoTracks(),
    });

    // Check if videoGrid ref is available
    if (!videoGrid.current) {
      console.error("Video grid ref is not available");
      return;
    }

    // Validate that we have a proper stream
    if (!stream || !stream.getVideoTracks().length) {
      console.error("No valid video stream provided for user:", userId);
      return;
    }

    video.srcObject = stream;

    // Only add to DOM after video is ready to play
    video.addEventListener("loadedmetadata", () => {
      console.log("Video metadata loaded for user:", userId);
      video.play().catch((error) => {
        console.error("Error playing video for user:", userId, error);
      });

      const videoContainer = document.createElement("div");
      videoContainer.className = `video-container relative bg-black/30 rounded-2xl overflow-hidden shadow-lg shadow-black/30 border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 aspect-video ${
        isSelf ? "border-green-400 shadow-green-400/30" : "border-white/10"
      }`;

      // Add data attribute for easier identification
      if (userId) {
        videoContainer.setAttribute("data-user-id", userId);
      }

      const videoLabel = document.createElement("div");
      videoLabel.className =
        "absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs font-medium";
      videoLabel.textContent = isSelf
        ? "You"
        : `User ${userId ? userId.substring(0, 8) : "Unknown"}`;

      // Style the video element
      video.className = "w-full h-full object-cover block";

      videoContainer.appendChild(video);
      videoContainer.appendChild(videoLabel);

      // Check if this user already has a video container to prevent duplicates
      if (!isSelf && userId && videoElementsRef.current[userId]) {
        console.log("Video container already exists for user:", userId);
        return;
      }

      videoGrid.current.appendChild(videoContainer);

      // Track video elements by user ID
      if (userId && !isSelf) {
        videoElementsRef.current[userId] = videoContainer;
      }

      setParticipantCount(videoGrid.current.children.length);
    });

    // Handle error loading video
    video.addEventListener("error", (error) => {
      console.error("Video element error:", error);
    });
  };

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    // Socket event handlers
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      showNotification("Connection error", "error");
    });

    socket.on("user-connected", (userId) => {
      console.log("New user connected:", userId);
      setTimeout(() => {
        if (myStreamRef.current && myPeerRef.current) {
          console.log(
            "Making call to user:",
            userId,
            "with stream:",
            myStreamRef.current
          );
          console.log("Stream tracks:", myStreamRef.current.getTracks());
          connectToNewUser(userId, myStreamRef.current, myPeerRef.current);
        } else {
          console.error("Cannot call user - missing stream or peer:", {
            hasStream: !!myStreamRef.current,
            hasPeer: !!myPeerRef.current,
          });
        }
      }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
      console.log("User disconnected:", userId);

      // Close and remove peer connection
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }

      // Remove video element from DOM
      if (videoElementsRef.current[userId]) {
        const videoElement = videoElementsRef.current[userId];
        if (videoElement && videoElement.parentNode) {
          videoElement.remove();
        }
        delete videoElementsRef.current[userId];
      }

      // Clean up any orphaned containers
      setTimeout(() => {
        cleanupVideoContainers();
      }, 100);
    });

    socket.on("chat-message", (data) => {
      setChatMessages((prev) => [
        ...prev,
        {
          message: data.message,
          username: data.username,
          isOwn: false,
        },
      ]);
    });

    socket.on("user-joined", (userData) => {
      const username = userData.username || userData;
      setChatMessages((prev) => [
        ...prev,
        {
          message: `${username} joined the room`,
          username: "System",
          isSystem: true,
        },
      ]);
      showNotification(`${username} joined the room`, "success");
    });

    socket.on("user-left", (userData) => {
      const username = userData.username || userData;
      setChatMessages((prev) => [
        ...prev,
        {
          message: `${username} left the room`,
          username: "System",
          isSystem: true,
        },
      ]);
      showNotification(`${username} left the room`, "error");
    });

    socket.on("user-logged-in", (username) => {
      setChatMessages((prev) => [
        ...prev,
        {
          message: `${username} logged in`,
          username: "System",
          isSystem: true,
        },
      ]);
    });

    socket.on("user-logged-out", (username) => {
      setChatMessages((prev) => [
        ...prev,
        {
          message: `${username} logged out`,
          username: "System",
          isSystem: true,
        },
      ]);
    });

    // Initialize PeerJS
    const myPeer = new Peer(undefined, {
      host: "localhost",
      port: 5001,
      path: "/peerjs",
    });

    myPeerRef.current = myPeer;

    myPeer.on("open", (id) => {
      console.log("My peer ID:", id);
      socket.emit("join-room", roomId, id, username);
    });

    myPeer.on("error", (error) => {
      console.error("PeerJS error:", error);
      showNotification("Connection error occurred", "error");
    });

    const connectToNewUser = (userId, stream, myPeer) => {
      try {
        console.log("Calling user:", userId, "with stream:", stream);
        const call = myPeer.call(userId, stream);

        call.on("stream", (userVideoStream) => {
          console.log("Received stream from user:", userId, userVideoStream);
          console.log("Remote stream tracks:", userVideoStream.getTracks());

          // Create video element only when we receive the stream
          const video = document.createElement("video");
          video.muted = true;
          addVideoStream(video, userVideoStream, false, userId);
        });

        call.on("close", () => {
          console.log("Call closed with user:", userId);
          // Remove the video container, not just the video element
          if (videoElementsRef.current[userId]) {
            const videoContainer = videoElementsRef.current[userId];
            if (videoContainer && videoContainer.parentNode) {
              videoContainer.remove();
            }
            delete videoElementsRef.current[userId];
          }
          if (videoGrid.current) {
            setParticipantCount(
              videoGrid.current.querySelectorAll(".video-container").length
            );
          }
        });

        call.on("error", (error) => {
          console.error("Call error with user:", userId, error);
          // Remove the video container, not just the video element
          if (videoElementsRef.current[userId]) {
            const videoContainer = videoElementsRef.current[userId];
            if (videoContainer && videoContainer.parentNode) {
              videoContainer.remove();
            }
            delete videoElementsRef.current[userId];
          }
          if (videoGrid.current) {
            setParticipantCount(
              videoGrid.current.querySelectorAll(".video-container").length
            );
          }
        });

        peersRef.current[userId] = call;
        if (videoGrid.current) {
          setParticipantCount(
            videoGrid.current.querySelectorAll(".video-container").length
          );
        }
      } catch (error) {
        console.error("Error calling user:", userId, error);
      }
    };

    // Cleanup function
    return () => {
      socket.disconnect();
      myPeer.destroy();
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Clear video elements tracking
      videoElementsRef.current = {};
    };
  }, [roomId]);

  // Periodic cleanup of orphaned video containers
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupVideoContainers();
    }, 5000); // Clean up every 5 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // Separate useEffect to initialize media after component is mounted
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Check if media devices are available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Media devices not supported in this browser");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setMyStream(stream);
        myStreamRef.current = stream; // Store in ref for access across functions
        setIsLoading(false);

        // Wait for videoGrid to be available
        if (!videoGrid.current) {
          console.warn("Video grid not available yet, retrying...");
          setTimeout(() => initializeMedia(), 100);
          return;
        }

        const myVideo = document.createElement("video");
        myVideo.muted = true;
        addVideoStream(myVideo, stream, true);

        if (myPeerRef.current) {
          myPeerRef.current.on("call", (call) => {
            console.log("Receiving call from:", call.peer);

            // Check if we already have a connection with this peer
            if (peersRef.current[call.peer]) {
              console.log("Already connected to peer:", call.peer);
              call.close();
              return;
            }

            console.log("Answering call with stream:", stream);
            call.answer(stream);

            call.on("stream", (userVideoStream) => {
              console.log(
                "Received incoming stream from:",
                call.peer,
                userVideoStream
              );
              console.log(
                "Incoming stream tracks:",
                userVideoStream.getTracks()
              );

              // Create video element only when we receive the stream
              const video = document.createElement("video");
              video.muted = true;
              addVideoStream(video, userVideoStream, false, call.peer);
            });

            call.on("close", () => {
              // Remove the video container, not just the video element
              if (videoElementsRef.current[call.peer]) {
                const videoContainer = videoElementsRef.current[call.peer];
                if (videoContainer && videoContainer.parentNode) {
                  videoContainer.remove();
                }
                delete videoElementsRef.current[call.peer];
              }
              if (videoGrid.current) {
                setParticipantCount(
                  videoGrid.current.querySelectorAll(".video-container").length
                );
              }
            });

            call.on("error", (error) => {
              console.error("Incoming call error:", error);
              // Remove the video container, not just the video element
              if (videoElementsRef.current[call.peer]) {
                const videoContainer = videoElementsRef.current[call.peer];
                if (videoContainer && videoContainer.parentNode) {
                  videoContainer.remove();
                }
                delete videoElementsRef.current[call.peer];
              }
              if (videoGrid.current) {
                setParticipantCount(
                  videoGrid.current.querySelectorAll(".video-container").length
                );
              }
            });

            // Store the peer connection
            peersRef.current[call.peer] = call;
          });
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setIsLoading(false);

        let errorMessage = "Unable to access camera/microphone";
        if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          errorMessage = "No camera or microphone found";
        } else if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Camera/microphone access denied. Please allow access and refresh.";
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          errorMessage =
            "Camera/microphone already in use by another application";
        }

        showNotification(errorMessage, "error");
      }
    };

    // Only initialize media after the first useEffect has run and refs are set
    const timer = setTimeout(() => {
      if (myPeerRef.current) {
        initializeMedia();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Run only once after mount

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white"
            : "bg-white text-gray-800"
        }`}
      >
        <div
          className={`p-5 rounded-lg text-center z-50 backdrop-blur-md border ${
            isDarkMode
              ? "bg-black/80 border-white/20 text-white"
              : "bg-gray-100/90 border-gray-300 text-gray-800"
          }`}
        >
          <h3 className="mb-3 text-lg font-semibold">Connecting to Room...</h3>
          <p className="mb-5">
            Please allow camera/microphone access when prompted
          </p>
          <div
            className={`animate-spin rounded-full h-8 w-8 border-4 mx-auto ${
              isDarkMode
                ? "border-white/30 border-t-white"
                : "border-gray-300 border-t-gray-600"
            }`}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`font-inter h-screen overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white"
          : "bg-white text-gray-800"
      }`}
    >
      <div className="flex-1 flex flex-col p-3 md:p-5">
        <div
          className={`flex flex-col lg:flex-row justify-between items-center mb-5 px-3 py-2 md:px-5 md:py-4 rounded-xl backdrop-blur-md border transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 border-white/20"
              : "bg-gray-100/80 border-gray-200"
          }`}
        >
          <div className="room-info mb-3 lg:mb-0">
            <h1 className="text-lg md:text-2xl font-semibold mb-1">
              <i
                className={`fas fa-video mr-2 ${
                  isDarkMode ? "text-green-400" : "text-indigo-600"
                }`}
              ></i>
              Video Call App
            </h1>
            <div
              className={`text-xs md:text-sm font-mono ${
                isDarkMode ? "text-white/80" : "text-gray-600"
              }`}
            >
              Room ID: {roomId}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3 lg:mb-0">
            <div
              className={`flex items-center gap-2 text-xs md:text-sm ${
                isDarkMode ? "text-white/90" : "text-gray-600"
              }`}
            >
              <i className="fas fa-users"></i>
              <span>{participantCount}</span> participants
            </div>
            <DarkModeToggle className="hidden sm:flex" />
          </div>

          <div className="flex items-center gap-2">
            <DarkModeToggle className="sm:hidden" />
            <button
              className={`border px-3 py-2 md:px-4 md:py-2 rounded-lg cursor-pointer text-xs md:text-sm 
                transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                    : "bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200"
                }`}
              onClick={copyRoomLink}
            >
              <i className="fas fa-copy"></i>
              <span className="hidden sm:inline">Copy Link</span>
            </button>
          </div>
        </div>

        <div
          ref={videoGrid}
          className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 md:gap-5 py-3 md:py-5 overflow-y-auto content-start"
        >
          {participantCount === 0 && (
            <div
              className={`flex flex-col items-center justify-center h-full text-center col-span-full ${
                isDarkMode ? "text-white/70" : "text-gray-500"
              }`}
            >
              <i className="fas fa-video-slash text-3xl md:text-5xl mb-3 md:mb-5 opacity-50"></i>
              <h3 className="text-lg md:text-2xl mb-2 md:mb-3 font-medium">
                Waiting for participants...
              </h3>
              <p className="text-sm md:text-base opacity-80">
                Share the room link to invite others
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div
        className={`w-full md:w-80 xl:w-96 fixed md:relative top-0 right-0 h-full backdrop-blur-md border-l flex flex-col transform transition-transform duration-300 z-50 ${
          isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-gray-100/90 border-gray-200"
        } ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          className={`p-4 md:p-5 border-b flex justify-between items-center ${
            isDarkMode ? "border-white/20" : "border-gray-200"
          }`}
        >
          <h3 className="text-base md:text-lg font-semibold">
            <i
              className={`fas fa-comments mr-2 ${
                isDarkMode ? "text-green-400" : "text-indigo-600"
              }`}
            ></i>
            Chat
          </h3>
          <button
            className={`bg-transparent border-0 text-lg md:text-xl cursor-pointer p-1 rounded-full 
              transition-all duration-300 ${
                isDarkMode
                  ? "text-white hover:bg-white/10"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            onClick={() => setIsChatOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex-1 p-4 md:p-5 overflow-y-auto flex flex-col gap-3">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 md:p-3 rounded-xl text-xs md:text-sm max-w-[80%] break-words transition-all duration-300 ${
                msg.isOwn
                  ? isDarkMode
                    ? "bg-green-400 text-white self-end"
                    : "bg-indigo-600 text-white self-end"
                  : msg.isSystem
                  ? isDarkMode
                    ? "bg-white/5 italic text-center self-center max-w-full text-green-300"
                    : "bg-gray-200 italic text-center self-center max-w-full text-gray-600"
                  : isDarkMode
                  ? "bg-white/10 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.isSystem ? msg.message : `${msg.username}: ${msg.message}`}
            </div>
          ))}
        </div>
        <div
          className={`p-4 md:p-5 border-t ${
            isDarkMode ? "border-white/20" : "border-gray-200"
          }`}
        >
          <div className="flex gap-2 md:gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={500}
              className={`flex-1 border px-3 py-2 md:px-4 md:py-3 rounded-2xl md:rounded-3xl text-xs md:text-sm outline-none 
                transition-all duration-300 focus:ring-2 ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:ring-white/20"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-200"
                }`}
            />
            <button
              onClick={sendMessage}
              className={`border-0 w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer flex items-center justify-center 
                transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-green-400 text-white hover:bg-green-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              <i className="fas fa-paper-plane text-xs md:text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div
        className={`fixed bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-4 
        px-4 py-2 md:px-6 md:py-4 rounded-full backdrop-blur-xl border shadow-lg z-50 transition-all duration-300 ${
          isDarkMode
            ? "bg-black/80 border-white/10 shadow-black/30"
            : "bg-white/90 border-gray-300 shadow-gray-400/30"
        }`}
      >
        <button
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center text-sm md:text-lg 
            transition-all duration-300 hover:scale-105 border ${
              !isVideoEnabled
                ? "bg-red-500 border-red-500 hover:bg-red-600 text-white"
                : isDarkMode
                ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
            }`}
          onClick={toggleVideo}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          <i
            className={`fas ${isVideoEnabled ? "fa-video" : "fa-video-slash"}`}
          ></i>
        </button>

        <button
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center text-sm md:text-lg 
            transition-all duration-300 hover:scale-105 border ${
              !isAudioEnabled
                ? "bg-red-500 border-red-500 hover:bg-red-600 text-white"
                : isDarkMode
                ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
            }`}
          onClick={toggleAudio}
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          <i
            className={`fas ${
              isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"
            }`}
          ></i>
        </button>

        <button
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center text-sm md:text-lg 
            transition-all duration-300 hover:scale-105 border ${
              isScreenSharing
                ? isDarkMode
                  ? "bg-green-400 border-green-400 hover:bg-green-500 text-white"
                  : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white"
                : isDarkMode
                ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
            }`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        >
          <i className="fas fa-desktop"></i>
        </button>

        <button
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center text-sm md:text-lg 
            transition-all duration-300 hover:scale-105 border ${
              isDarkMode
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? "Close chat" : "Open chat"}
        >
          <i className="fas fa-comments"></i>
        </button>

        <button
          className="bg-red-500 border border-red-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center text-sm md:text-lg transition-all duration-300 hover:bg-red-600 hover:scale-105"
          onClick={leaveRoom}
          title="Leave room"
        >
          <i className="fas fa-phone-slash"></i>
        </button>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 px-4 py-3 md:px-5 md:py-4 rounded-lg backdrop-blur-md border transform transition-transform duration-300 z-50 max-w-xs md:max-w-sm ${
            isDarkMode
              ? "bg-black/80 text-white border-white/20"
              : "bg-white/90 text-gray-800 border-gray-300"
          } ${
            notification.type === "success"
              ? isDarkMode
                ? "border-l-4 border-l-green-400"
                : "border-l-4 border-l-green-600"
              : isDarkMode
              ? "border-l-4 border-l-red-500"
              : "border-l-4 border-l-red-600"
          } ${notification.show ? "translate-x-0" : "translate-x-96"}`}
        >
          <div className="text-sm md:text-base">{notification.message}</div>
        </div>
      )}
    </div>
  );
};

export default Room;
