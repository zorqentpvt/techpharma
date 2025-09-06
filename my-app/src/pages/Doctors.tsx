// pages/Doctors.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors, Doctor } from "../api/medapi";

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return navigate("/");
    const parsed = JSON.parse(user);
    if (parsed.role !== "normal") return navigate("/"); // restrict access
    loadDoctors();
  }, [navigate]);

  const loadDoctors = async () => {
    const data = await getDoctors();
    setDoctors(data);
  };

  const handleAppointment = (doctorId: string) => {
    navigate(`/appointment/${doctorId}`);
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">All Doctors 👨‍⚕️</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-white rounded-xl shadow flex flex-col gap-2"
            >
              <p>
                <strong>Name:</strong> {doc.name}
              </p>
              <p>
                <strong>Specialty:</strong> {doc.specialty}
              </p>
              <button
                onClick={() => handleAppointment(doc.id)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Take Appointment
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No doctors found.</p>
        )}
      </div>
    </div>
  );
}
