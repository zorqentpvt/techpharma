import { FC, useEffect, useState } from "react";
import { FaUserMd } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getUsersByRole("doctor");
      console.log(res.data)
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8">
    <div className="max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
        <h2 className="text-4xl font-bold text-[#0f4c81] flex items-center gap-3">
          <FaUserMd className="text-5xl" />
          Doctor Management
        </h2>
        <p className="text-lg text-gray-600 mt-2">
          Manage doctor profiles, approvals, and activity status
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-xl text-gray-500 py-20">
          Loading doctors...
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && doctors.length === 0 && (
        <div className="text-center text-xl text-gray-400 py-20">
          No doctors found
        </div>
      )}

      {/* DOCTOR CARDS */}
      {!loading && doctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8 flex flex-col justify-between"
            >
              {/* TOP */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {doc.displayName}
                </h3>

                <p className="text-base text-gray-500 mt-1">
                  {doc.email}
                </p>

                <p className="text-base text-gray-500">
                  {doc.phoneNumber}
                </p>

                <div className="mt-6 space-y-2 text-lg">
                  <p>
                    <span className="font-semibold">Specialization:</span>{" "}
                    {doc.doctor?.specializationId || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">License:</span>{" "}
                    {doc.doctor?.licenseNumber || "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold">Experience:</span>{" "}
                    {doc.doctor?.experience ?? 0} years
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-8">
                <span
                  className={`inline-block text-sm font-semibold px-4 py-1 rounded-full mb-4
                    ${
                      doc.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {doc.status.toUpperCase()}
                </span>

                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/admin/doctor/view/${doc.id}`,
                      { state: { doctor: doc } }
                    )
                  }
                  className="w-full bg-[#0f4c81] text-white text-lg py-3 rounded-2xl font-bold hover:bg-[#0c3d68] transition"
                >
                  View Doctor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};

export default DoctorPage;
