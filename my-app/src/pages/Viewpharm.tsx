import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { updateUserStatus } from "../api/adminapi";

/* ================= TYPES ================= */
type Pharmacy = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  userId?: string;
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

type User = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  address: Address;
  status: string;
  roleId: string;
  pharmacy: Pharmacy;
  isActive: boolean;
  firsttime?: boolean;
};

/* ================= COMPONENT ================= */
const ViewPharm: React.FC = () => {
  const { state } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.pharmacy) {
      setUser(state.pharmacy);
      setLoading(false);
      console.log("pharmacy state:", state.doctor);
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
      const response = await updateUserStatus(user.id, { status: newStatus });

      
        setUser((prev) =>
          prev && {
            ...prev,
            status: newStatus,
            isActive: newStatus === "active",
            pharmacy: { ...prev.pharmacy, isActive: newStatus === "active" },
          }
        );
    
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (loading) return <div className="text-center py-10">Loading user data...</div>;
  if (!user) return <div className="text-center py-10">No user data available.</div>;

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8">
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-[#0f4c81] mb-2">
          🏥 Pharmacy User Details
        </h1>
        <p className="text-lg text-gray-600">
          Detailed information about the pharmacy and associated user
        </p>
      </div>

      {/* USER INFO */}
      <div className="bg-white rounded-3xl shadow-md p-8">
        <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">
          👤 User Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <p><span className="font-semibold">ID:</span> {user.id}</p>
          <p><span className="font-semibold">Display Name:</span> {user.displayName}</p>
          <p><span className="font-semibold">First Name:</span> {user.firstName}</p>
          <p><span className="font-semibold">Last Name:</span> {user.lastName}</p>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">Phone:</span> {user.phoneNumber}</p>
          <p><span className="font-semibold">Gender:</span> {user.gender}</p>
          <p><span className="font-semibold">Role ID:</span> {user.roleId}</p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span className={user.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {user.status}
            </span>
          </p>
          <p><span className="font-semibold">First Time:</span> {user.firsttime ? "Yes" : "No"}</p>
        </div>
      </div>

      {/* ADDRESS INFO */}
      <div className="bg-white rounded-3xl shadow-md p-8">
        <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">
          📍 Address Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <p><span className="font-semibold">Address:</span> {user.address.address}</p>
          <p><span className="font-semibold">City:</span> {user.address.city}</p>
          <p><span className="font-semibold">State:</span> {user.address.state}</p>
          <p><span className="font-semibold">Postal Code:</span> {user.address.postalCode}</p>
          <p><span className="font-semibold">Country:</span> {user.address.country}</p>
          <p><span className="font-semibold">Latitude:</span> {user.address.latitude}</p>
          <p><span className="font-semibold">Longitude:</span> {user.address.longitude}</p>
        </div>
      </div>

      {/* PHARMACY INFO */}
      <div className="bg-white rounded-3xl shadow-md p-8">
        <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">
          💊 Pharmacy Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          {Object.entries(user.pharmacy).map(([key, value]) => (
            <p key={key}>
              <span className="font-semibold capitalize">
                {key.replace(/([A-Z])/g, " $1")}:
              </span>{" "}
              {String(value)}
            </p>
          ))}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="bg-white rounded-3xl shadow-md p-8">
        <button
          onClick={toggleStatus}
          className={`w-full py-4 text-xl rounded-2xl font-bold text-white transition-all duration-300
            ${user.isActive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {user.isActive ? "🚫 Deactivate Pharmacy" : "✅ Activate Pharmacy"}
        </button>
      </div>

    </div>
  </div>
);
};

export default ViewPharm;
