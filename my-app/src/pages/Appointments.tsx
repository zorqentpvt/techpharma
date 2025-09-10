import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  getAppointments,
  scheduleAppointment,
  Appointment,
} from "../api/medapi";

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return navigate("/");
    const parsed = JSON.parse(user);
    if (parsed.role !== "doctor") return navigate("/"); // restrict access
    loadAppointments(parsed.username);
  }, [navigate]);

  const loadAppointments = async (doctorUsername: string) => {
    const data = await getAppointments(doctorUsername);
    setAppointments(data);
  };

  const handleSchedule = async (id: string) => {
    await scheduleAppointment(id);
    alert("✅ Appointment scheduled");
    // reload list
    const user = JSON.parse(localStorage.getItem("user")!);
    loadAppointments(user.username);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Appointments1111 📅</h1>

      {appointments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-4 bg-white rounded-xl shadow flex flex-col gap-2"
            >
              <p>
                <strong>Patient:</strong> {appt.patient}
              </p>
              <p>
                <strong>Reason:</strong> {appt.reason}
              </p>
              <p>
                <strong>Status:</strong> {appt.status}
              </p>
              {appt.status !== "scheduled" && (
                <Button onClick={() => handleSchedule(appt.id)}>
                  Schedule ✅
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No appointments yet.</p>
      )}
    </div>
  );
}
