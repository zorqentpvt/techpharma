import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  getAppointments,
  scheduleAppointment,
  Appointment,
} from "../api/medapi";
import { CalendarGridY } from "react-appointment-ui";
import { appointments as appointmentY } from "../mock/appointments";

interface Provider {
  id: string;
  name: string;
}

const providers: Provider[] = [
  { id: "p1", name: "Dr. Smith" },
  { id: "p2", name: "Dr. Johnson" },
];


export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return navigate("/");
    const parsed = JSON.parse(user);
    if (parsed.role !== "doctor") return navigate("/"); // restrict access
    loadAppointments(parsed.username);
  }, [navigate]);

  const loadAppointments = async (doctorUsername: string) => {
    setLoading(true);
    const data = await getAppointments(doctorUsername);
    setAppointments(data);
    setLoading(false);
  };



  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">
        📅 Doctor’s Appointments
      </h1>  
      <CalendarGridY providers={providers} appts={appointmentY} />
    </div>
  );
}
