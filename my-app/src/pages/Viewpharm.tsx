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
  isFreeMedicineEnabled?: boolean;
  gstNumber?: string;
  category?: string;
  governmentRegistrationNumber?: string;
  janAushadhiId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  userId?: string;
};

type Address = {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

type User = {
  fileUrl?: string | null;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  gender?: string;
  address?: Address;
  status: string;
  roleId?: string;
  pharmacy?: Pharmacy | null;
  isActive: boolean;
  firsttime?: boolean;
};

/* ================= COMPONENT ================= */
const BASE_URL = "http://localhost:8080"; // backend host for files

const ViewPharm: React.FC = () => {
  const { state } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.pharmacy) {
      setUser(state.pharmacy);
    }
    setLoading(false);
  }, [state]);

  const toggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      await updateUserStatus(user.id, { status: newStatus });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              isActive: newStatus === "active",
              pharmacy: prev.pharmacy
                ? { ...prev.pharmacy, isActive: newStatus === "active" }
                : null,
            }
          : prev
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const toggleFreeMedicine = async () => {
    if (!user?.pharmacy) return;
    const newStatus = !user.pharmacy.isFreeMedicineEnabled;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/admin/pharmacies/${user.pharmacy.id}/free-medicine`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setUser((prev) =>
          prev && prev.pharmacy
            ? { ...prev, pharmacy: { ...prev.pharmacy, isFreeMedicineEnabled: newStatus } }
            : prev
        );
      } else {
        alert(data.message || "Failed to update free medicine status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const fileSrc = user?.fileUrl ? `${BASE_URL}/${user.fileUrl}` : null;

  if (loading) return <div className="text-center py-10">Loading user data...</div>;
  if (!user) return <div className="text-center py-10">No user data available.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-[#0f4c81] mb-2">
             Pharmacy User Details
          </h1>
          <p className="text-lg text-gray-600">
            Detailed information about the pharmacy and associated user
          </p>
        </div>

        {/* USER INFO */}
        <div className="bg-white rounded-3xl shadow-md p-8">
          <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">👤 User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Display Name:</span> {user.displayName || "N/A"}</p>
            <p><span className="font-semibold">First Name:</span> {user.firstName || "N/A"}</p>
            <p><span className="font-semibold">Last Name:</span> {user.lastName || "N/A"}</p>
            <p><span className="font-semibold">Email:</span> {user.email || "N/A"}</p>
            <p><span className="font-semibold">Phone:</span> {user.phoneNumber || "N/A"}</p>
            <p><span className="font-semibold">Gender:</span> {user.gender || "N/A"}</p>
            <p><span className="font-semibold">Role ID:</span> {user.roleId || "N/A"}</p>
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
          <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">Address Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <p><span className="font-semibold">Address:</span> {user.address?.address || "N/A"}</p>
            <p><span className="font-semibold">City:</span> {user.address?.city || "N/A"}</p>
            <p><span className="font-semibold">State:</span> {user.address?.state || "N/A"}</p>
            <p><span className="font-semibold">Postal Code:</span> {user.address?.postalCode || "N/A"}</p>
            <p><span className="font-semibold">Country:</span> {user.address?.country || "N/A"}</p>
            <p><span className="font-semibold">Latitude:</span> {user.address?.latitude ?? "N/A"}</p>
            <p><span className="font-semibold">Longitude:</span> {user.address?.longitude ?? "N/A"}</p>
          </div>
        </div>

        {/* PHARMACY INFO */}
        <div className="bg-white rounded-3xl shadow-md p-8">
          <h2 className="text-3xl font-semibold text-[#0f4c81] mb-6">Pharmacy Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            {user.pharmacy
              ? <>
                  <p><span className="font-semibold">Name:</span> {user.pharmacy.name}</p>
                  <p><span className="font-semibold">Email:</span> {user.pharmacy.email}</p>
                  <p><span className="font-semibold">Phone:</span> {user.pharmacy.phoneNumber}</p>
                  <p><span className="font-semibold">License No:</span> {user.pharmacy.licenseNumber}</p>
                  <p><span className="font-semibold">GST No:</span> {user.pharmacy.gstNumber || "N/A"}</p>
                  <p><span className="font-semibold">Category:</span> <span className="capitalize">{user.pharmacy.category?.replace(/_/g, " ") || "N/A"}</span></p>
                  <p><span className="font-semibold">Address:</span> {user.pharmacy.address}</p>
                  <p><span className="font-semibold">City:</span> {user.pharmacy.city || "N/A"}</p>
                  <p><span className="font-semibold">State:</span> {user.pharmacy.state || "N/A"}</p>
                  <p><span className="font-semibold">Postal Code:</span> {user.pharmacy.postalCode || "N/A"}</p>
                  <p><span className="font-semibold">Country:</span> {user.pharmacy.country || "N/A"}</p>
                  {user.pharmacy.governmentRegistrationNumber && (
                    <p><span className="font-semibold">Govt Reg No:</span> {user.pharmacy.governmentRegistrationNumber}</p>
                  )}
                  {user.pharmacy.janAushadhiId && (
                    <p><span className="font-semibold">Jan Aushadhi ID:</span> {user.pharmacy.janAushadhiId}</p>
                  )}
                </>
              : <p className="text-gray-500 col-span-2">No pharmacy data available.</p>
            }

            <div className="flex flex-col gap-4 col-span-1 md:col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <span className="font-bold text-gray-700">Account Active Status</span>
                <button
                  onClick={toggleStatus}
                  className={`relative w-20 h-10 rounded-full transition-colors duration-300 ${
                    user.isActive ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      user.isActive ? "translate-x-10" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {user.pharmacy && (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                  <span className="font-bold text-gray-700">Free Medicine Program</span>
                  <button
                    onClick={toggleFreeMedicine}
                    className={`relative w-20 h-10 rounded-full transition-colors duration-300 ${
                      user.pharmacy.isFreeMedicineEnabled ? "bg-green-600" : "bg-gray-400"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        user.pharmacy.isFreeMedicineEnabled ? "translate-x-10" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
          <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">📄 Documents</h2>
          {fileSrc ? (
            <div className="w-full h-[600px] border rounded-xl overflow-hidden">
              <iframe src={fileSrc} title="Pharmacy Document" className="w-full h-full" />
            </div>
          ) : (
            <p className="text-gray-500 text-lg text-center">No document attached.</p>
          )}
        </div>


      </div>
    </div>
  );
};

export default ViewPharm;
