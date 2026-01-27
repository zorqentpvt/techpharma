import { FC, useEffect, useState } from "react";
import { FaUserMd } from "react-icons/fa";
import { getUsersByRole } from "../api/adminapi";

interface DoctorUser {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  status: string;
  doctor?: {
    specializationId: string;
    licenseNumber: string;
    experience: number;
  };
}

const DoctorPage: FC = () => {
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getUsersByRole("doctor");
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white rounded-2xl shadow-lg p-6">

      {/* Header */}
      <h2 className="text-2xl font-bold text-[#002E6E] flex items-center gap-2 mb-2">
        <FaUserMd /> Doctor Management
      </h2>

      <p className="text-gray-600 mb-6">
        Manage doctors, approvals, and profiles.
      </p>

      {/* Loading */}
      {loading && (
        <div className="text-center text-gray-500">
          Loading doctors...
        </div>
      )}

      {/* Empty */}
      {!loading && doctors.length === 0 && (
        <div className="text-center text-gray-400">
          No doctors found
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="border rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg text-gray-800">
              {doc.displayName}
            </h3>

            <p className="text-sm text-gray-500">
              {doc.email}
            </p>

            <p className="text-sm text-gray-500">
              {doc.phoneNumber}
            </p>

            <p className="mt-2 text-sm">
              <span className="font-medium">Specialization:</span>{" "}
              {doc.doctor?.specializationId || "N/A"}
            </p>

            <p className="text-sm">
              <span className="font-medium">License:</span>{" "}
              {doc.doctor?.licenseNumber || "N/A"}
            </p>

            <p className="text-sm">
              <span className="font-medium">Experience:</span>{" "}
              {doc.doctor?.experience ?? 0} yrs
            </p>

            {/* Footer */}
            <div className="mt-4 flex justify-between items-center">
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  doc.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {doc.status}
              </span>

              <button
                className="bg-[#002E6E] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#001f4d]"
                onClick={() => {
                  console.log("View doctor:", doc.id);
                }}
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorPage;
