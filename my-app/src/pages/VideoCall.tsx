import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { completeConsultation } from "../api/docApi";

interface OpChartData {
  diagnosis?: string;
  prescription?: string;
  doctorNotes?: string;
}

const VideoCall = () => {
  const { state: consultation } = useLocation();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("userdata") || "null");

  // Redirect if no consultation or user
  useEffect(() => {
    if (!consultation) navigate("/dashboard");
    if (!storedUser) navigate("/login");
  }, [consultation, storedUser, navigate]);

  if (!consultation || !storedUser) return null;

  const {
    id: appointmentId,
    doctorId,
    doctorName,
    doctorSpecialization,
    patientId,
    name,
    date,
    time,
  } = consultation;

  const isDoctor =
    storedUser.roleId?.trim().toLowerCase() === "doctor" && storedUser.id === doctorId;

  const me = {
    id: storedUser.id,
    name: isDoctor ? "Dr " + storedUser.displayName : storedUser.firstName + " " + storedUser.lastName,
    role: isDoctor ? "doctor" : "patient",
  };

  const otherUser = isDoctor
    ? { id: patientId, name: consultation.name, role: "patient" }
    : { id: doctorId, name: doctorName, role: "doctor", specialization: doctorSpecialization };

  const [now, setNow] = useState(new Date());
  const [canJoin, setCanJoin] = useState(false);
  const [joinedCall, setJoinedCall] = useState(false); // track iframe loaded
  const [opData, setOpData] = useState<OpChartData>({});

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate scheduled time
  const scheduled = useMemo(() => {
    const t = time.length === 5 ? `${time}:00` : time;
    return new Date(`${date}T${t}`);
  }, [date, time]);

  const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);

  // Allow join 5 min early to 2 hours after
  useEffect(() => {
    setCanJoin(diffMinutes <= 5 && diffMinutes >= -120);
  }, [diffMinutes]);

  // Stable room name for Jitsi
  const roomName = useMemo(() => {
    const raw = `${doctorId}-${patientId}-${date}-${time}`;
    return Math.abs(
      [...raw].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
    )
      .toString(36)
      .slice(0, 16);
  }, [doctorId, patientId, date, time]);

  const handleLeave = () => {
    navigate("/dashboard");
  };

  const handleOpChange = (field: keyof OpChartData, value: string) => {
    setOpData(prev => ({ ...prev, [field]: value }));
  };

  // Submit OP chart
  const handleopsubmit = async () => {
    const payload = {
      appointmentId: consultation.id,
      slotId: consultation.slotId,
      diagnosis: opData.diagnosis || "",
      prescription: opData.prescription || "",
      doctorNotes: opData.doctorNotes || "",
    };

    try {
      console.log("Submitting:", payload);
      const response = await completeConsultation(payload);
      console.log("Response:", response);
    } catch (error) {
      console.error(error);
      alert("Failed to submit OP Chart");
    }
  };

  return (
    <div className="w-full h-screen flex bg-gray-900 text-white">
      {!canJoin ? (
        <div className="m-auto text-center px-6">
          <h2 className="text-2xl font-bold mb-3">Not Time Yet</h2>
          <p className="text-gray-400">
            Scheduled for {date} at {time}
          </p>
          <p className="mt-2 text-gray-500">
            You can join 5 minutes early and up to 2 hours after start time.
          </p>
        </div>
      ) : (
        <>
          {/* 🎥 Jitsi */}
          <div className="flex-1 bg-black">
            <iframe
              title="Jitsi Call"
              allow="camera; microphone; fullscreen; autoplay"
              src={`https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(
                me.name
              )}"`}
              style={{ width: "100%", height: "100%", border: 0 }}
              onLoad={() => setJoinedCall(true)} // mark as joined
            />
          </div>

          {/* ℹ️ Sidebar */}
          <div className="w-96 bg-gray-800 p-6 space-y-6 shadow-xl overflow-y-auto">
            <div className="bg-gray-700 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">You are meeting</h3>
              <p className="text-xl font-bold">{otherUser.name}</p>
              <p className="text-sm text-gray-300 capitalize">
                {otherUser.role}
                {otherUser.specialization && ` • ${otherUser.specialization}`}
              </p>
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <strong>Your role:</strong> {me.role}
              </p>
              <p>
                <strong>Date:</strong> {date}
              </p>
              <p>
                <strong>Time:</strong> {time}
              </p>
            </div>

            <button
              onClick={handleLeave}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold transition"
            >
              Leave Call
            </button>

            {/* OP Chart form */}
            {isDoctor && (
              <div className="bg-gray-700 p-4 rounded-xl mt-4 space-y-3">
                <h3 className="text-lg font-semibold text-[#002E6E] mb-2">OP Chart</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Diagnosis</label>
                  <textarea
                    value={opData.diagnosis || ""}
                    onChange={e => handleOpChange("diagnosis", e.target.value)}
                    disabled={!joinedCall}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-900 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Prescription</label>
                  <textarea
                    value={opData.prescription || ""}
                    onChange={e => handleOpChange("prescription", e.target.value)}
                    disabled={!joinedCall}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-900 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Doctor Notes</label>
                  <textarea
                    value={opData.doctorNotes || ""}
                    onChange={e => handleOpChange("doctorNotes", e.target.value)}
                    disabled={!joinedCall}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-900 text-white resize-none"
                  />
                </div>

                <button
                  onClick={handleopsubmit}
                  disabled={!joinedCall}
                  className={`w-full mt-2 py-2 rounded-lg font-semibold transition ${
                    joinedCall ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
                  }`}
                >
                  Submit OP
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCall;
