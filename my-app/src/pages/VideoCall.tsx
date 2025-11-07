import React, { useEffect, useMemo, useState } from "react";

const VideoCall = () => {
  const params = new URLSearchParams(window.location.search);

  // ✅ Pull everything from URL params
  const user = { name: params.get("user") || "Unknown" };
  const otherUser = { name: params.get("otherUser") || "Unknown" };
  const callDate = params.get("callDate") || "";
  const callTime = params.get("callTime") || "";
  const role = params.get("role") || "guest";

  // ✅ Assign roles properly
  const patient = role === "patient" ? user : otherUser;
  const doctor = role === "doctor" ? user : otherUser;

  const [now, setNow] = useState(new Date());
  const [canJoin, setCanJoin] = useState(false);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Scheduled datetime
  const scheduled = useMemo(() => {
    if (!callDate || !callTime) return null;
    const timeString = callTime.length === 5 ? `${callTime}:00` : callTime;
    return new Date(`${callDate}T${timeString}`);
  }, [callDate, callTime]);

  // Diff in minutes
  const diffMinutes = useMemo(() => {
    if (!scheduled) return null;
    return (scheduled.getTime() - now.getTime()) / (1000 * 60);
  }, [scheduled, now]);

  // Auto switch when join window opens
  useEffect(() => {
    if (diffMinutes !== null) {
      const allowed = diffMinutes <= 5 && diffMinutes >= -120;
      if (allowed !== canJoin) setCanJoin(allowed);
    }
  }, [diffMinutes, canJoin]);

  // ✅ Room name (16-char unique)
  const roomName = useMemo(() => {
    if (!patient?.name || !doctor?.name || !callDate || !callTime) return "";

    const raw = `${patient.name}-${doctor.name}-${callDate}-${callTime}`.toLowerCase();

    const hash = Math.abs(
      Array.from(raw).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
    )
      .toString(36)
      .slice(0, 16);

    return hash;
  }, [patient?.name, doctor?.name, callDate, callTime]);

  console.log("Role:", role);
  console.log("Patient:", patient);
  console.log("Doctor:", doctor);
  console.log("Room Name:", roomName);

  // Countdown
  const formatCountdown = () => {
    if (!scheduled) return "";
    const diffMs = scheduled.getTime() - now.getTime();
    if (diffMs <= 0) return "Starting now...";
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  // Leave
  const handleLeave = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="w-full h-screen flex bg-gray-900 text-white">
      {!canJoin ? (
        <div className="m-auto text-center px-6">
          <h1 className="text-2xl font-bold mb-4">Not Time Yet</h1>

          {scheduled && (
            <>
              <p className="text-gray-300 mb-1">
                Scheduled for: {callDate} at {callTime}
              </p>
              <p className="text-gray-400 mb-2">
                Current time:{" "}
                {now.toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </p>

              {diffMinutes > 5 ? (
                <p className="text-green-400 font-semibold">
                  Starts in {formatCountdown()}
                </p>
              ) : diffMinutes < -120 ? (
                <p className="text-red-400 font-semibold">
                  Session expired (over 2 hours ago)
                </p>
              ) : (
                <p className="text-yellow-400 font-semibold">
                  Starting soon...
                </p>
              )}
            </>
          )}

          <p className="text-gray-500 mt-4 text-sm">
            You can join 5 minutes early and up to 2 hours after start time.
          </p>
        </div>
      ) : (
        <>
          {/* Video Call */}
          <div className="flex-1 bg-black h-full">
            <iframe
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              src={`https://meet.jit.si/${roomName}`}
              style={{ height: "100%", width: "100%", border: 0 }}
              title="Jitsi Video Call"
            ></iframe>
          </div>

          {/* Info Panel */}
          <div className="w-96 bg-gray-800 h-full p-6 shadow-xl overflow-y-auto space-y-6">
            <div className="bg-gray-700 p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">You are meeting</h3>
              <div className="flex items-center gap-4">
                <img
                  src={"https://via.placeholder.com/80"}
                  alt="profile"
                  className="w-20 h-20 rounded-full border"
                />
                <div>
                  <p className="text-lg font-bold">
                    {role === "patient" ? doctor.name : patient.name}
                  </p>
                  <p className="text-gray-300 text-sm">
                    Role: {role === "patient" ? "Doctor" : "Patient"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-3 rounded-lg text-center text-sm text-gray-300">
              <p>
                Current time:{" "}
                {now.toLocaleTimeString(undefined, { hour12: false })}
              </p>
              <p>
                Meeting time: {callTime} ({callDate})
              </p>
              <p className="mt-1 text-gray-400">Your Role: {role}</p>
            </div>

            <button
              onClick={handleLeave}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Leave Call
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCall;
