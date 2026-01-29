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
      console.log("Doctor state:", state.doctor);
    } else {
      // Optionally fetch doctor data here if state is empty
      // Example: fetchDoctorById(id).then(setUser)
      setLoading(false);
    }
  }, [state]);

  const toggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      const statusr = await updateUserStatus(user.id, { status: newStatus });
      
        setUser((prev) =>
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

  if (loading) return <div className="text-center py-10">Loading user data...</div>;
  if (!user) return <div className="text-center py-10">No user data available.</div>;

  return (
    <div className="max-w-3xl mx-auto my-10 bg-white shadow-lg rounded-xl p-8 space-y-6">
      <h1 className="text-3xl font-bold text-blue-800">{user.displayName}</h1>
      <p className="text-gray-500">Role: {user.roleId}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold text-lg">User Info</h2>
          <ul className="text-gray-700 space-y-1">
            <li><b>ID:</b> {user.id}</li>
            <li><b>Email:</b> {user.email}</li>
            <li><b>Phone:</b> {user.phoneNumber}</li>
            <li><b>Email Verified:</b> {user.isEmailVerified ? "Yes" : "No"}</li>
            <li><b>Phone Verified:</b> {user.isPhoneVerified ? "Yes" : "No"}</li>
            <li><b>DOB:</b> {new Date(user.dateOfBirth).toLocaleDateString()}</li>
            <li><b>Gender:</b> {user.gender}</li>
            <li><b>Status:</b> 
              <span className={`font-semibold ml-1 ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                {user.status}
              </span>
            </li>
            <li><b>Last Login:</b> {new Date(user.lastLoginAt).toLocaleString()}</li>
            <li><b>Language:</b> {user.language}</li>
            <li><b>First Time:</b> {user.firsttime ? "Yes" : "No"}</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg">Address</h2>
          <ul className="text-gray-700 space-y-1">
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

      <div>
        <h2 className="font-semibold text-lg">Doctor Info</h2>
        <ul className="text-gray-700 space-y-1">
          <li><b>ID:</b> {user.doctor.id}</li>
          <li><b>Specialization:</b> {user.doctor.specializationId}</li>
          <li><b>License:</b> {user.doctor.licenseNumber}</li>
          <li><b>Experience:</b> {user.doctor.experience} yrs</li>
          <li><b>Fee:</b> ₹{user.doctor.consultationFee}</li>
          <li><b>Created At:</b> {new Date(user.doctor.createdAt).toLocaleString()}</li>
          <li><b>Updated At:</b> {new Date(user.doctor.updatedAt).toLocaleString()}</li>
          <li><b>Deleted At:</b> {user.doctor.deletedAt || "N/A"}</li>
          <li><b>Is Active:</b> {user.doctor.isActive ? "Yes" : "No"}</li>
        </ul>
      </div>

      <button
        onClick={toggleStatus}
        className={`w-full py-2 rounded-lg text-white font-semibold ${user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {user.isActive ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
};

export default ViewDoctor;
