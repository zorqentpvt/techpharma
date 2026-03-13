import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { updateUserStatus } from "../api/adminapi";
import { ExternalLink, Copy, ShieldCheck, AlertCircle } from "lucide-react";

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
  stateMedicalCouncil?: string;
  yearOfPassing?: number;
  isVerified?: boolean;
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
  fileUrl?: string | null;
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
  dateOfBirth?: string | null;
  gender?: string | null;
  contactInfo?: ContactInfo;
  address?: Address;
  status: string;
  lastLoginAt?: string | null;
  language?: string;
  preferences?: Record<string, any>;
  roleId: string;
  doctor?: Doctor | null;
  isActive: boolean;
  firsttime?: boolean;
};

type NMCDoctorDetails = {
  doctorId: number;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  parentName: string;
  birthDateStr: string;
  doctorDegree: string;
  university: string;
  yearOfPassing: string;
  registrationNo: string;
  regDate: string;
  smcName: string;
  address: string;
  yearInfo: number;
  uprnNo: string | null;
  removedStatus: boolean;
};

const BASE_URL = "http://localhost:8080";

const ViewDoctor: React.FC = () => {
  const [verificationResult, setVerificationResult] = useState<{
    matchStatus: string;
    registryData: any;
    localData: any;
    reason?: string;
    nmcDoctorId?: number;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [nmcDoctorId, setNmcDoctorId] = useState<number | null>(null);
  const [registryDetails, setRegistryDetails] = useState<NMCDoctorDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { state } = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.doctor) {
      setUser(state.doctor);
    }
    setLoading(false);
  }, [state]);

  useEffect(() => {
    if (user?.doctor?.isVerified && !verificationResult && !verifying) {
      handleVerify();
    }
  }, [user?.doctor?.isVerified]);

  useEffect(() => {
    if (user?.doctor?.isVerified && verificationResult?.matchStatus === "MATCHED" && nmcDoctorId && !registryDetails && !loadingDetails) {
      handleViewRegistryDetails();
    }
  }, [verificationResult, nmcDoctorId, user?.doctor?.isVerified]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("License number copied to clipboard!");
  };

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
              doctor: prev.doctor
                ? { ...prev.doctor, isActive: newStatus === "active" }
                : null,
            }
          : prev
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setVerifying(true);
    setVerificationResult(null);
    setRegistryDetails(null);
    setNmcDoctorId(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/admin/doctor/${user.id}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult(data.data);
        if (data.data.nmcDoctorId) {
          setNmcDoctorId(data.data.nmcDoctorId);
        }
      } else {
        alert("Verification failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying doctor");
    } finally {
      setVerifying(false);
    }
  };

  const handleViewRegistryDetails = async () => {
    if (!nmcDoctorId || !user) return;
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
  const res = await fetch(
  `${BASE_URL}/api/admin/doctor/${user.id}/registry-details?nmcDoctorId=${nmcDoctorId}&regNo=${verificationResult?.localData?.registrationNumber}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
      const data = await res.json();
      if (data.success) {
        setRegistryDetails(data.data);
      } else {
        alert("Failed to fetch registry details: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching registry details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const markAsVerified = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to mark this doctor as verified?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/admin/doctor/${user.id}/verify-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? ({ ...prev, doctor: prev.doctor ? { ...prev.doctor, isVerified: true } : null }) : null);
        alert("Identity marked as verified.");
      } else {
        alert("Failed to mark as verified: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating verification status");
    }
  };

  const fileSrc = user?.fileUrl ? `${BASE_URL}/${user.fileUrl}` : null;

  if (loading)
    return (
      <div className="text-center py-10 text-lg text-gray-500">
        Loading user data...
      </div>
    );

  if (!user)
    return (
      <div className="text-center py-10 text-lg text-gray-500">
        No user data available.
      </div>
    );

  return (
    <div className="min-h-screen bg-blue-50 rounded-2xl py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#0f4c81] flex items-center gap-3">
              {user.displayName}
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

          <div className="flex flex-col items-end gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Account Access</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={toggleStatus}
                className={`relative w-14 h-7 flex items-center rounded-full transition-colors duration-300 ${
                  user.isActive ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    user.isActive ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* User + Address */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">👤 User Info</h2>
            <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
              <li><b>ID:</b> {user.id}</li>
              <li><b>Email:</b> {user.email}</li>
              <li><b>Phone:</b> {user.phoneNumber}</li>
              <li><b>Email Verified:</b> {user.isEmailVerified ? "Yes" : "No"}</li>
              <li><b>Phone Verified:</b> {user.isPhoneVerified ? "Yes" : "No"}</li>
              <li>
                <b>DOB:</b>{" "}
                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A"}
              </li>
              <li><b>Gender:</b> {user.gender || "N/A"}</li>
              <li>
                <b>Last Login:</b>{" "}
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "N/A"}
              </li>
              <li><b>Language:</b> {user.language || "N/A"}</li>
              <li><b>First Time:</b> {user.firsttime ? "Yes" : "No"}</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">📍 Address</h2>
            <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
              <li><b>Address:</b> {user.address?.address || "N/A"}</li>
              <li><b>City:</b> {user.address?.city || "N/A"}</li>
              <li><b>State:</b> {user.address?.state || "N/A"}</li>
              <li><b>Country:</b> {user.address?.country || "N/A"}</li>
              <li><b>Postal Code:</b> {user.address?.postalCode || "N/A"}</li>
              <li><b>Latitude:</b> {user.address?.latitude ?? "N/A"}</li>
              <li><b>Longitude:</b> {user.address?.longitude ?? "N/A"}</li>
            </ul>
          </div>
        </div>

        {/* Doctor Info */}
        {user.doctor ? (
          <>
            <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">🩺 Doctor Info</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
                <li><b>ID:</b> <span className="text-sm text-gray-500">{user.doctor.id}</span></li>
                <li><b>Specialization:</b> {user.doctor.specializationId}</li>
                <li><b>License:</b> {user.doctor.licenseNumber}</li>
                <li><b>Experience:</b> {user.doctor.experience} yrs</li>
                <li><b>Consultation Fee:</b> ₹{user.doctor.consultationFee}</li>
              </ul>
              <ul className="text-gray-700 space-y-3 text-lg leading-relaxed">
                <li><b>State Council:</b> {user.doctor.stateMedicalCouncil || "N/A"}</li>
                <li><b>Year of Passing:</b> {user.doctor.yearOfPassing || "N/A"}</li>
                <li><b>Created At:</b> <span className="text-base">{new Date(user.doctor.createdAt).toLocaleString()}</span></li>
                <li>
                  <b>Active:</b>{" "}
                  <span className={user.doctor.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {user.doctor.isActive ? "Yes" : "No"}
                  </span>
                </li>
                <li>
                  <b>Identity Verified:</b>{" "}
                  <span className={user.doctor.isVerified ? "text-green-600 font-bold" : "text-gray-600 font-bold"}>
                    {user.doctor.isVerified ? "Yes" : "No"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

            {/* Verification Section */}
            <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
              <h2 className="text-2xl font-bold text-[#0f4c81] mb-6 flex items-center gap-2">
                <ShieldCheck className="w-7 h-7" /> Verification Status
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex items-center gap-2 bg-[#0f4c81] text-white px-4 py-2 rounded-lg hover:bg-[#0c3d68] transition text-sm font-medium shadow-sm disabled:opacity-70"
                >
                  {verifying ? "Verifying..." : "Verify with Registry (Cross Match)"}
                  <ShieldCheck size={16} />
                </button>
                <button
                  onClick={() => copyToClipboard(user.doctor?.licenseNumber || "")}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
                >
                  Copy License <Copy size={16} />
                </button>
                {verificationResult?.matchStatus === "MATCHED" && !user.doctor.isVerified && (
                  <button onClick={markAsVerified} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm">
                    Mark as Verified
                    <ShieldCheck size={16} />
                  </button>
                )}
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border ${
                    verificationResult.matchStatus === "MATCHED"
                      ? "bg-green-50 border-green-200"
                      : verificationResult.matchStatus === "PENDING_MANUAL_REVIEW"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {verificationResult.matchStatus === "MATCHED" ? (
                        <ShieldCheck className="text-green-600" />
                      ) : (
                        <AlertCircle
                          className={
                            verificationResult.matchStatus === "PENDING_MANUAL_REVIEW"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        />
                      )}
                      <h4
                        className={`font-bold ${
                          verificationResult.matchStatus === "MATCHED"
                            ? "text-green-800"
                            : verificationResult.matchStatus === "PENDING_MANUAL_REVIEW"
                            ? "text-yellow-800"
                            : "text-red-800"
                        }`}
                      >
                        {verificationResult.matchStatus === "MATCHED"
                          ? "Identity Verified"
                          : verificationResult.matchStatus === "PENDING_MANUAL_REVIEW"
                          ? "Pending Manual Review"
                          : "Data Mismatch Detected"}
                      </h4>
                    </div>

                    {/* View IMR Details button — only on MATCHED */}
                    {verificationResult.matchStatus === "MATCHED" && nmcDoctorId && (
                      <button
                        onClick={handleViewRegistryDetails}
                        disabled={loadingDetails}
                        className="flex items-center gap-2 bg-[#0f4c81] text-white px-3 py-1.5 rounded-lg hover:bg-[#0c3d68] transition text-xs font-medium shadow-sm disabled:opacity-70"
                      >
                        {loadingDetails ? "Loading..." : "View IMR Details"}
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>

                  {/* Reason (for PENDING) */}
                  {verificationResult.matchStatus === "PENDING_MANUAL_REVIEW" &&
                    verificationResult.reason && (
                      <p className="text-xs text-yellow-700 mb-3 bg-yellow-100 px-3 py-2 rounded-lg">
                        {verificationResult.reason}
                      </p>
                    )}

                  {/* Local vs Registry comparison */}
                  {verificationResult.matchStatus !== "PENDING_MANUAL_REVIEW" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-500 uppercase text-xs mb-1">
                          Local Data
                        </p>
                        <p><strong>Name:</strong> {verificationResult.localData.name}</p>
                        <p><strong>Reg No:</strong> {verificationResult.localData.registrationNumber}</p>
                        <p><strong>Council:</strong> {verificationResult.localData.stateMedicalCouncil}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 uppercase text-xs mb-1">
                          Registry Data
                        </p>
                        <p
                          className={
                            !verificationResult.localData.name
                              ?.toLowerCase()
                              .includes(verificationResult.registryData.name?.toLowerCase())
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          <strong>Name:</strong> {verificationResult.registryData.name}
                        </p>
                        <p
                          className={
                            verificationResult.localData.registrationNumber !==
                            verificationResult.registryData.registrationNumber
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          <strong>Reg No:</strong> {verificationResult.registryData.registrationNumber}
                        </p>
                        <p><strong>Council:</strong> {verificationResult.registryData.stateMedicalCouncil}</p>
                      </div>
                    </div>
                  )}

                  {/* Full IMR Details Panel */}
                  {registryDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        IMR Registry Details
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                        <p>
                          <strong>Full Name:</strong>{" "}
                          {[
                            registryDetails.firstName,
                            registryDetails.middleName,
                            registryDetails.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                        <p>
                          <strong>Father/Husband:</strong>{" "}
                          {registryDetails.parentName || "N/A"}
                        </p>
                        <p>
                          <strong>Date of Birth:</strong>{" "}
                          {registryDetails.birthDateStr || "N/A"}
                        </p>
                        <p>
                          <strong>Registration No:</strong>{" "}
                          {registryDetails.registrationNo}
                        </p>
                        <p>
                          <strong>Date of Registration:</strong>{" "}
                          {registryDetails.regDate || "N/A"}
                        </p>
                        <p>
                          <strong>Year of Info:</strong> {registryDetails.yearInfo}
                        </p>
                        <p>
                          <strong>State Medical Council:</strong>{" "}
                          {registryDetails.smcName}
                        </p>
                        <p>
                          <strong>Degree:</strong>{" "}
                          {registryDetails.doctorDegree || "N/A"}
                        </p>
                        <p>
                          <strong>University:</strong>{" "}
                          {registryDetails.university || "N/A"}
                        </p>
                        <p>
                          <strong>Year of Passing:</strong>{" "}
                          {registryDetails.yearOfPassing || "N/A"}
                        </p>
                        <p>
                          <strong>UPRN No:</strong>{" "}
                          {registryDetails.uprnNo || "N/A"}
                        </p>
                        <p>
                          <strong>Removed from Registry:</strong>{" "}
                          <span
                            className={
                              registryDetails.removedStatus
                                ? "text-red-600 font-bold"
                                : "text-green-600"
                            }
                          >
                            {registryDetails.removedStatus ? "Yes" : "No"}
                          </span>
                        </p>
                        <p className="col-span-2">
                          <strong>Address:</strong>{" "}
                          {registryDetails.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No doctor data available.</p>
        )}

        {/* Documents */}
        <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
          <h2 className="text-2xl font-bold text-[#0f4c81] mb-6">📄 Documents</h2>
          {fileSrc ? (
            <div className="w-full h-[600px] border rounded-xl overflow-hidden">
              <iframe
                src={fileSrc}
                title="Doctor Document"
                className="w-full h-full"
              />
            </div>
          ) : (
            <p className="text-gray-500 text-lg text-center">
              No document attached.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ViewDoctor;