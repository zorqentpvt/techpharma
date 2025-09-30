// pages/Doctors.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors, Doctor } from "../api/medapi";
import { Search, X } from "lucide-react";
import PatientAppointment, { AppointmentSlot } from "../components/PatientAppointment";
import React from "react";

function DoctorCard({ doctor, onAppointment }: { doctor: Doctor; onAppointment: (id: string) => void }) {
  return (
    <div className="p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{doctor.name}</h2>
        <p className="text-sm text-gray-600">{doctor.specialty}</p>
      </div>
      <button
        onClick={() => onAppointment(doctor.id)}
        className="w-full mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow hover:from-blue-600 hover:to-indigo-600 transform hover:scale-[1.02] transition"
      >
        Take Appointment
      </button>
    </div>
  );
}

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return navigate("/");
    const parsed = JSON.parse(user);
    if (parsed.role !== "normal") return navigate("/");

    const fetchDoctors = async () => {
      try {
        const data = await getDoctors();
        setDoctors(data);
      } catch (err) {
        setError("⚠️ Failed to load doctors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

  const handleAppointment = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
  };

  const filteredDoctors = useMemo(
    () =>
      doctors.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [doctors, searchTerm]
  );

  // --- Mock booked slots ---
  const mockBookedSlots: AppointmentSlot[] = [
    { date: "2025-10-01", time: "09:00" },
    { date: "2025-10-02", time: "15:00" },
    { date: "2025-10-03", time: "10:00" },
  ];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">🩺 Find Your Doctor</h1>

      {/* Search Bar */}
      <div className="flex items-center max-w-xl mx-auto mb-10 relative">
        <Search className="absolute left-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          aria-label="Search doctors"
          placeholder="Search by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-center text-gray-500">Loading doctors...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Doctors Grid or Appointment */}
      {!loading && !error && (
        <>
          {selectedDoctorId ? (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setSelectedDoctorId(null)}
                className="mb-4 text-blue-500 hover:underline"
              >
                ← Back to doctors
              </button>

              <PatientAppointment
                doctorId={selectedDoctorId}
                patientId="mock-patient-id"
                bookedSlots={mockBookedSlots}
                onSubmit={(data) => {
                  console.log("Submitted appointment:", data);
                  alert("Appointment request submitted!");
                  setSelectedDoctorId(null);
                }}
              />
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <DoctorCard key={doc.id} doctor={doc} onAppointment={handleAppointment} />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 text-lg">No doctors found.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
