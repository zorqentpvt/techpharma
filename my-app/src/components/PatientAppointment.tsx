// components/PatientAppointment.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, eachDayOfInterval, setHours, setMinutes } from "date-fns";
import Button from "./Button";

export interface AppointmentSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

interface PatientAppointmentProps {
  doctorId: string;
  patientId: string;
  bookedSlots?: AppointmentSlot[]; // already taken
  onSubmit?: (data: {
    doctorId: string;
    patientId: string;
    reason: string;
    mode: "online" | "offline";
    selectedSlots: AppointmentSlot[];
  }) => void;
}

export default function PatientAppointment({
  doctorId,
  patientId,
  bookedSlots = [],
  onSubmit,
}: PatientAppointmentProps) {
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"online" | "offline">("offline");
  const [selectedSlots, setSelectedSlots] = useState<AppointmentSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate slots for 1 month starting 2 days after today
  const generateSlots = (): AppointmentSlot[] => {
    const start = addDays(new Date(), 2);
    const end = addDays(new Date(), 32);
    const days = eachDayOfInterval({ start, end });
    const slots: AppointmentSlot[] = [];

    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        const date = format(day, "yyyy-MM-dd");
        const time = `${hour.toString().padStart(2, "0")}:00`;
        slots.push({ date, time });
      }
    });

    return slots;
  };

  const allSlots = generateSlots();

  const toggleSlot = (slot: AppointmentSlot) => {
    const exists = selectedSlots.some(s => s.date === slot.date && s.time === slot.time);
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => s.date !== slot.date || s.time !== slot.time));
    } else if (selectedSlots.length < 5) {
      setSelectedSlots(prev => [...prev, slot]);
    }
  };

  const isBooked = (slot: AppointmentSlot) =>
    bookedSlots.some(s => s.date === slot.date && s.time === slot.time);

  const handleSubmit = () => {
    if (!reason) return alert("Please enter a reason.");
    if (selectedSlots.length === 0) return alert("Select at least one slot.");
    onSubmit?.({ doctorId, patientId, reason, mode, selectedSlots });
  };

  const slotsForSelectedDate = selectedDate
    ? allSlots.filter(s => s.date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  const selectNextSlot = () => {
    for (const slot of allSlots) {
      if (!isBooked(slot) && !selectedSlots.some(s => s.date === slot.date && s.time === slot.time)) {
        toggleSlot(slot);
        setSelectedDate(new Date(slot.date));
        break;
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="Reason for appointment"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Mode</label>
        <select
          value={mode}
          onChange={e => setMode(e.target.value as "online" | "offline")}
          className="w-full p-2 border rounded-lg"
        >
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Select Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date) => setSelectedDate(date)}
          minDate={addDays(new Date(), 2)}
          maxDate={addDays(new Date(), 32)}
          className="w-full p-2 border rounded-lg"
          dateFormat="EEEE, MMM d, yyyy"
          placeholderText="Pick a date"
        />
      </div>

      {selectedDate && (
        <div className="mb-4 p-3 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">{format(selectedDate, "EEEE, MMM d, yyyy")}</h3>
          <div className="flex flex-wrap gap-2">
            {slotsForSelectedDate.map(slot => {
              const booked = isBooked(slot);
              const selected = selectedSlots.some(s => s.date === slot.date && s.time === slot.time);
              return (
                <button
                  key={slot.time}
                  disabled={booked}
                  onClick={() => !booked && toggleSlot(slot)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    booked
                      ? "bg-red-400 text-white cursor-not-allowed"
                      : selected
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-gray-100 border-gray-300 hover:bg-blue-100"
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={selectNextSlot}
        className="mt-2 mb-4 px-6 py-2 bg-green-500 text-white rounded-xl shadow hover:bg-green-600 transition"
      >
        Select Next Slot
      </Button>

      <Button
        onClick={handleSubmit}
        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow hover:from-blue-600 hover:to-indigo-600 transition"
      >
        Submit Appointment
      </Button>
    </div>
  );
}
