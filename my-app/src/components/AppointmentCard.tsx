import { useState } from "react";
import { motion } from "framer-motion";
import { Slot, Appointment, ApiResponse, scheduleAppointment, cancelAppointment } from "../api/docApi";

interface Props {
  appt: Appointment;
  selectedSlot: Slot & { mode: "online" | "offline" };
  setSelectedSlot: (slot: Slot & { mode: "online" | "offline" }) => void;
  onReload: () => void;
  setPopup: (msg: string | null) => void;
}

export default function AppointmentCard({ appt, selectedSlot, setSelectedSlot, onReload, setPopup }: Props) {
  const [manualVisible, setManualVisible] = useState(false);
  const [manualSlot, setManualSlot] = useState<Slot & { mode: "online" | "offline" }>({
    date: "",
    time: "",
    mode: "online",
  });

  const handleConfirmSlot = async (slot: Slot & { mode: "online" | "offline" }) => {
    if (!slot.date || !slot.time) {
      setPopup("Please select or input a valid date and time.");
      return;
    }
    try {
      const res: ApiResponse = await scheduleAppointment({
        patientID: appt.id,
        slots: [slot],
      });
      if (res.success) {
        setPopup(`✅ Scheduled patient on ${slot.date} ${slot.time} (${slot.mode})`);
        setTimeout(() => setPopup(null), 3000);
        onReload();
        setSelectedSlot({ date: "", time: "", mode: "online" });
        setManualSlot({ date: "", time: "", mode: "online" });
        setManualVisible(false);
      } else {
        setPopup(res.message || "Failed to schedule appointment.");
      }
    } catch {
      setPopup("Failed to schedule appointment.");
    }
  };

  const handleCancel = async () => {
    try {
      const res: ApiResponse = await cancelAppointment(appt.id);
      if (res.success) onReload();
      else setPopup(res.message || "Failed to cancel appointment.");
    } catch {
      setPopup("Failed to cancel appointment.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow p-4 flex flex-col"
    >
      {/* Patient info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={appt.patientProfile || "/default-profile.png"}
          alt={appt.patient}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h2 className="font-semibold text-blue-800">{appt.patient}</h2>
          {appt.reason && <p className="text-gray-500 text-sm">{appt.reason}</p>}
        </div>
      </div>

      {/* Slots */}
      <p className="text-sm text-gray-600 mb-1">Available Slots:</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {appt.selectedSlots?.map((slot: Slot, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedSlot({ ...slot, mode: appt.mode })}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSlot.date === slot.date && selectedSlot.time === slot.time
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-blue-100 text-gray-700"
            }`}
          >
            {slot.date} {slot.time}
          </button>
        ))}
      </div>

      {/* Manual Input */}
      {manualVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-wrap gap-1 mt-2 items-center"
        >
          <input
            type="date"
            className="border p-1 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
            value={manualSlot.date}
            onChange={(e) => setManualSlot({ ...manualSlot, date: e.target.value })}
          />
          <input
            type="time"
            className="border p-1 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
            value={manualSlot.time}
            onChange={(e) => setManualSlot({ ...manualSlot, time: e.target.value })}
          />
          <button
            onClick={() =>
              setManualSlot({
                ...manualSlot,
                mode: manualSlot.mode === "online" ? "offline" : "online",
              })
            }
            className="px-2 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-100"
          >
            {manualSlot.mode}
          </button>
        </motion.div>
      )}
      {!manualVisible && (
        <div className="mt-2">
          <button
            onClick={() => setManualVisible(true)}
            className="px-2 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-100"
          >
            ➕ Manual
          </button>
        </div>
      )}

      {/* Confirm / Cancel */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleConfirmSlot(manualVisible ? manualSlot : selectedSlot)}
          className="px-3 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
