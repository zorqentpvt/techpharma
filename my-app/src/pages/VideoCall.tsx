import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Phone, Video, Mic, MicOff, VideoOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SERVER_URL = "http://localhost:8080"; // ✅ Signaling server URL

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [callStarted, setCallStarted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [status, setStatus] = useState("Waiting to start call...");

  const roomId = "doctor-patient-room";

  // 🛰️ Setup Socket.io
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to signaling server");
      socket.emit("join", roomId);
    });

    socket.on("offer", async (offer) => {
      console.log("Received offer");
      if (!peerConnection.current) createPeerConnection();

      await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current!.createAnswer();
      await peerConnection.current!.setLocalDescription(answer);

      socket.emit("answer", { answer, roomId });
      setStatus("Connected to peer");
    });

    socket.on("answer", async (answer) => {
      console.log("Received answer");
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("candidate", async (candidate) => {
      try {
        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("disconnect", () => {
      console.warn("Disconnected from server");
      setStatus("Disconnected. Please refresh.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🎥 Create Peer Connection
  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("candidate", { candidate: event.candidate, roomId });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  // 🚀 Start Call
  const startCall = async () => {
    try {
      setCallStarted(true);
      setStatus("Requesting camera & microphone...");

      createPeerConnection();

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(localStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

      localStream.getTracks().forEach((track) =>
        peerConnection.current?.addTrack(track, localStream)
      );

      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      socketRef.current?.emit("offer", { offer, roomId });
      setStatus("Calling...");
    } catch (error) {
      console.error("Error starting call:", error);
      setStatus("Failed to start call — check permissions.");
      setCallStarted(false);
    }
  };

  // 🔚 End Call
  const endCall = () => {
    stream?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    setCallStarted(false);
    setStatus("Call ended.");
  };

  // 🎙️ Toggle mic
  const toggleMic = () => {
    if (!stream) return;
    const enabled = !isMicOn;
    stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
    setIsMicOn(enabled);
  };

  // 📷 Toggle camera
  const toggleCam = () => {
    if (!stream) return;
    const enabled = !isCamOn;
    stream.getVideoTracks().forEach((track) => (track.enabled = enabled));
    setIsCamOn(enabled);
  };

  return (
    <div className="relative w-full h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-4 left-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* Header */}
      <h1 className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-semibold text-center">
        Doctor–Patient Video Call
      </h1>
      <p className="absolute top-14 text-gray-400">{status}</p>

      {/* Video Area */}
      <div className="relative w-full max-w-6xl h-[75vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        />

        {/* Local Video */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-48 h-32 rounded-xl border-2 border-white shadow-lg object-cover"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-6 bg-gray-800 bg-opacity-60 px-6 py-3 rounded-full shadow-lg transition-all">
        {callStarted ? (
          <>
            <button
              onClick={toggleMic}
              title="Toggle microphone"
              className={`p-3 rounded-full transition ${
                isMicOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={toggleCam}
              title="Toggle camera"
              className={`p-3 rounded-full transition ${
                isCamOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={endCall}
              title="End call"
              className="bg-red-700 hover:bg-red-800 px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <Phone size={20} /> End
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            title="Start call"
            className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg transition"
          >
            <Video size={20} /> Start Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
