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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6 font-sans">
      <h1 className="text-2xl font-bold text-gray-800">Pharmacy User Details</h1>

      <section className="p-4 bg-gray-50 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-3">User Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p><span className="font-medium">ID:</span> {user.id}</p>
          <p><span className="font-medium">Name:</span> {user.displayName}</p>
          <p><span className="font-medium">First Name:</span> {user.firstName}</p>
          <p><span className="font-medium">Last Name:</span> {user.lastName}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Phone:</span> {user.phoneNumber}</p>
          <p><span className="font-medium">Gender:</span> {user.gender}</p>
          <p><span className="font-medium">Status:</span> {user.status}</p>
          <p><span className="font-medium">Role:</span> {user.roleId}</p>
          <p><span className="font-medium">Active:</span> {user.isActive ? "Yes" : "No"}</p>
          <p><span className="font-medium">First Time:</span> {user.firsttime ? "Yes" : "No"}</p>
        </div>
      </section>

      <section className="p-4 bg-gray-50 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Address Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p><span className="font-medium">Address:</span> {user.address.address}</p>
          <p><span className="font-medium">City:</span> {user.address.city}</p>
          <p><span className="font-medium">State:</span> {user.address.state}</p>
          <p><span className="font-medium">Postal Code:</span> {user.address.postalCode}</p>
          <p><span className="font-medium">Country:</span> {user.address.country}</p>
          <p><span className="font-medium">Latitude:</span> {user.address.latitude}</p>
          <p><span className="font-medium">Longitude:</span> {user.address.longitude}</p>
        </div>
      </section>

      <section className="p-4 bg-gray-50 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Pharmacy Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(user.pharmacy).map(([key, value]) => (
            <p key={key}><span className="font-medium">{key}:</span> {String(value)}</p>
          ))}
        </div>
      </section>

      <button
        onClick={toggleStatus}
        className={`w-full py-2 rounded-lg text-white font-semibold ${user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {user.isActive ? "Deactivate" : "Activate"}
      </button>
    
    </div>
  );
};

export default ViewPharm;
