import React from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  role: string;
}

export default function Consultings() {
  const navigate = useNavigate();
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  const renderSection = () => {
    switch (user.role) {
 

      case "doctor":
        return (
          <div className="p-6 text-center text-lg">
            🩺 <strong>Doctor Dashboard:</strong> View and manage your patient consultations here.
          </div>
        );

      case "normal":
        return (
          <div className="p-6 text-center text-lg">
            💬 <strong>Patient Portal:</strong> Schedule or join consultations with your doctor.
          </div>
        );


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
        <h1 className="pl-7 text-6xl sm:text-6xl font-semibold font-serif bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
          Consulting
        </h1>
        <h2 className="text-lg text-gray-700">
          Welcome {user.username ? user.username : "Guest"}
        </h2>
      </header>

      {/* Role-based section */}
      {renderSection()}
    </div>
  );
}
