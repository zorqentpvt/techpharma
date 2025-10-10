import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Doctors from "./Doctors";

interface User {
  username: string;
  role: string;
}

export default function Consultings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  const handleJoinCall = () => {
    alert("Joining video consultation...");
    // navigate("/video-call"); // Uncomment if you have a video call route
  };

  const handleBookConsultation = () => {
    alert("Redirecting to doctor list...");
    
    //navigate("/doctors"); // Example page for booking
  };

  const renderSection = () => {
    switch (user.role) {
      // 🩺 Doctor Section
      case "doctor":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              🩺 Doctor Dashboard
            </h2>
            <p className="text-gray-700 mb-6 pl-3">
              Join call to start Patient consultation .
            </p>

            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Upcoming Consultations
              </h3>

              {/* Example Consultation List */}
              <ul className="space-y-3">
                <li className="flex justify-between items-center border-b pb-2">
                  <span>👤 John Doe — 4:00 PM</span>
                  <button
                    onClick={handleJoinCall}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Join Call
                  </button>
                </li>
                <li className="flex justify-between items-center border-b pb-2">
                  <span>👤 Sarah Lee — 5:30 PM</span>
                  <button
                    onClick={handleJoinCall}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Join Call
                  </button>
                </li>
              </ul>
            </div>
          </div>
        );

      // 💬 Patient Section
      case "normal":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              💬 Patient Portal
            </h2>
            <p className="text-gray-700 mb-6">
              join consultations with your doctor.
            </p>

            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 ">
              {/* <button
                onClick={handleBookConsultation}
                className="bg-blue-600 hover:bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-3 rounded-xl ml-110   font-medium"
              >
                📅 Book a Consultation
              </button> */}

              <div className="mt-4 border-t pt-4">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">
                  Upcoming Appointment
                </h3>
                <div className="flex justify-between items-center">
                  <span>🩺 Dr. Smith — Today at 6:00 PM</span>
                  <button
                    onClick={handleJoinCall}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Join Video Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      // ❓ Unknown Role
      default:
        return (
          <div className="p-6 text-center text-lg text-gray-500">
            Unknown role — please log in again.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-7 gap-6">
        <h1 className="text-3xl font-bold mb-8 text-blue-900">
        👨🏻‍⚕️ Consultation Page
      </h1>
        <h2 className="text-lg text-blue-800 font-bold">
          Welcome {user.username ? user.username : "Guest"}
        </h2>
      </header>

      {/* Role-based section */}
      {renderSection()}
    </div>
  );
}
