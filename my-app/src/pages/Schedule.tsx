import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AppointmentCard from "../components/AppointmentCard";
import { getDoctorSchedule, Appointment, Slot } from "../api/docApi";

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot & { mode: "online" | "offline" }>({
    date: "",
    time: "",
    mode: "online",
  });
  const [popup, setPopup] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return navigate("/");
    const user = JSON.parse(userStr);
    if (user.role !== "doctor") return navigate("/");
    loadAppointments();
  }, [navigate]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDoctorSchedule();
      setAppointments(res.data || []);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-700 text-center">📅 My Appointments</h1>

      {loading && <p className="text-center text-gray-500">Loading appointments...</p>}
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {!loading &&
          appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              onReload={loadAppointments}
              setPopup={setPopup}
            />
          ))}

        {!loading && appointments.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">No appointments yet.</p>
        )}
      </div>

      {/* Popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm"
          >
            {popup}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
