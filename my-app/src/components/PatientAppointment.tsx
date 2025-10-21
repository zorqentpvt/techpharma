// components/PatientAppointment.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, eachDayOfInterval } from "date-fns";
import Button from "./Button";
import { bookAppointment } from "../api/docApi"; // ✅ import your API function

export interface AppointmentSlot {
  date: string; 
  time: string; 
}

interface PatientAppointmentProps {
  doctorId: string;
  bookedSlots?: AppointmentSlot[];
}

export default function PatientAppointment({ doctorId, bookedSlots = [] }: PatientAppointmentProps) {
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"online" | "offline">("offline");
  const [selectedSlots, setSelectedSlots] = useState<AppointmentSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!reason) return alert("Please enter a reason.");
    if (selectedSlots.length === 0) return alert("Select at least one slot.");

    const payload = { doctorId, reason, mode, selectedSlots };
    console.log("Submitting appointment:", payload);

    try {
      setLoading(true);
      const response = await bookAppointment(payload); // ✅ Call backend API
      console.log("Book appointment response:", response);

      if (response?.success) {
        alert("Appointment booked successfully!");
        setSelectedSlots([]);
        setReason("");
        setSelectedDate(null);
      } else {
        alert(response?.message || "Failed to book appointment.");
      }
    } catch (error: any) {
      alert("Error booking appointment: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
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
    <div className="p-6 bg-gray-50 rounded-xl shadow-md max-w-3xl space-x-3 mx-auto">
      <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full p-2 border-blue-400 border rounded-lg"
          placeholder="Reason for appointment"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Mode</label>
        <select
          value={mode}
          onChange={e => setMode(e.target.value as "online" | "offline")}
          className="w-full p-2 border-blue-400 border focus:border-blue-600 focus:border-2 rounded-lg"
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
          className="w-full p-2 border border-blue-400 rounded-lg"
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

      {selectedSlots.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg shadow-inner">
          <h3 className="font-semibold mb-2 text-blue-700">Selected Slots:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSlots.map((slot, index) => (
              <span
                key={index}
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {format(new Date(slot.date), "MMM d, yyyy")} — {slot.time}
                <button
                  onClick={() =>
                    setSelectedSlots(prev =>
                      prev.filter(s => !(s.date === slot.date && s.time === slot.time))
                    )
                  }
                  className="ml-1 text-white hover:text-red-200"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className={`mt-4 px-6 py-3 rounded-xl shadow transition ${
          loading
            ? "bg-gray-400 text-white cursor-wait"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
        }`}
      >
        {loading ? "Booking..." : "Submit Appointment"}
      </Button>
    </div>
  );
}
