import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  getAppointments,
  scheduleAppointment,
  Appointment,
} from "../api/medapi";
import { appointments as mockAppointments } from "../mock/appointments";

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load appointments on mount and check user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return navigate("/");
    const user = JSON.parse(userStr);
    if (user.role !== "doctor") return navigate("/"); // restrict access
    loadAppointments(user.username);
  }, [navigate]);

  const loadAppointments = async (doctorUsername: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getAppointments(doctorUsername)) || mockAppointments;
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (appointmentId: string) => {
    try {
      await scheduleAppointment(appointmentId);
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.username) loadAppointments(user.username);
    } catch (err) {
      console.error("Failed to schedule appointment:", err);
      setError("Failed to schedule appointment.");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">
        📅 Doctor’s Schedule
      </h1>

      {loading && <p className="text-gray-500">Loading appointments...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && appointments.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition flex flex-col gap-3"
            >
              <h3 className="font-semibold text-lg text-blue-800">
                👤 Patient: {appt.patient}
              </h3>
              <p className="text-gray-700">📝 Reason: {appt.reason}</p>
              <p
                className={`font-medium ${
                  appt.status === "scheduled"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                📌 Status: {appt.status}
              </p>

              {appt.status !== "scheduled" && (
                <Button
                  onClick={() => handleSchedule(appt.id)}
                  variant="primary"
                >
                  Schedule Now ✅
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <p className="text-gray-500 text-center">No appointments yet.</p>
      )}
    </div>
  );
}
