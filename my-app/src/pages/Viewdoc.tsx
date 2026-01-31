import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { updateUserStatus } from "../api/adminapi";

type Doctor = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  specializationId: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  isActive: boolean;
};

type Address = {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

type ContactInfo = {
  primaryPhone: string;
};

type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  phoneNumber: string;
  email: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string;
  gender: string;
  contactInfo: ContactInfo;
  address: Address;
  status: string;
  lastLoginAt: string;
  language: string;
  preferences: Record<string, any>;
  roleId: string;
  doctor: Doctor;
  isActive: boolean;
  firsttime: boolean;
};

const ViewDoctor: React.FC = () => {
  const { state } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.doctor) {
      setUser(state.doctor);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [state]);

  const toggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      await updateUserStatus(user.id, { status: newStatus });

      setUser(
        (prev) =>
          prev && {
            ...prev,
            status: newStatus,
            isActive: newStatus === "active",
            doctor: { ...prev.doctor, isActive: newStatus === "active" },
          }
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (loading)
    return <div className="text-center py-10 text-lg text-gray-500">Loading user data...</div>;

  if (!user)
    return <div className="text-center py-10 text-lg text-gray-500">No user data available.</div>;

  return (
    <div className="min-h-screen bg-blue-50 rounded-2xl py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md p-8">
          <h1 className="text-4xl font-bold text-[#0f4c81] flex items-center gap-3">
            🧑‍⚕️ {user.displayName}
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Role: <span className="font-medium">{user.roleId}</span>
          </p>
          <span
            className={`inline-block mt-4 px-4 py-1.5 rounded-full text-base font-semibold ${
              user.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.status.toUpperCase()}
          </span>
        </div>

        {/* User + Address */}
        <div className="grid gap-8 md:grid-cols-2">

          {/* User Info */}
          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">👤 User Info</h2>
            <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
              <li><b>ID:</b> {user.id}</li>
              <li><b>Email:</b> {user.email}</li>
              <li><b>Phone:</b> {user.phoneNumber}</li>
              <li><b>Email Verified:</b> {user.isEmailVerified ? "Yes" : "No"}</li>
              <li><b>Phone Verified:</b> {user.isPhoneVerified ? "Yes" : "No"}</li>
              <li><b>DOB:</b> {new Date(user.dateOfBirth).toLocaleDateString()}</li>
              <li><b>Gender:</b> {user.gender}</li>
              <li><b>Last Login:</b> {new Date(user.lastLoginAt).toLocaleString()}</li>
              <li><b>Language:</b> {user.language}</li>
              <li><b>First Time:</b> {user.firsttime ? "Yes" : "No"}</li>
            </ul>
          </div>

          {/* Address */}
          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">📍 Address</h2>
            <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
              <li><b>Address:</b> {user.address.address || "N/A"}</li>
              <li><b>City:</b> {user.address.city || "N/A"}</li>
              <li><b>State:</b> {user.address.state || "N/A"}</li>
              <li><b>Country:</b> {user.address.country || "N/A"}</li>
              <li><b>Postal Code:</b> {user.address.postalCode || "N/A"}</li>
              <li><b>Latitude:</b> {user.address.latitude}</li>
              <li><b>Longitude:</b> {user.address.longitude}</li>
            </ul>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
          <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">💊 Doctor Info</h2>
          <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
            <li><b>ID:</b> {user.doctor.id}</li>
            <li><b>Specialization:</b> {user.doctor.specializationId}</li>
            <li><b>License:</b> {user.doctor.licenseNumber}</li>
            <li><b>Experience:</b> {user.doctor.experience} yrs</li>
            <li><b>Consultation Fee:</b> ₹{user.doctor.consultationFee}</li>
            <li><b>Created At:</b> {new Date(user.doctor.createdAt).toLocaleString()}</li>
            <li><b>Updated At:</b> {new Date(user.doctor.updatedAt).toLocaleString()}</li>
            <li><b>Deleted At:</b> {user.doctor.deletedAt || "N/A"}</li>
            <li>
              <b>Active:</b>{" "}
              <span className={user.doctor.isActive ? "text-green-600" : "text-red-600"}>
                {user.doctor.isActive ? "Yes" : "No"}
              </span>
            </li>
          </ul>
        </div>

        {/* Action */}
        <button
          onClick={toggleStatus}
          className={`w-full py-4 rounded-full text-lg font-semibold shadow-md transition-all ${
            user.isActive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {user.isActive ? "🚫 Deactivate Doctor" : "✅ Activate Doctor"}
        </button>
      </div>
    </div>
  );
};

export default ViewDoctor;
