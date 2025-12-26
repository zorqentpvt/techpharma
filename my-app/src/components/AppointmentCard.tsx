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

// Extend Slot interface to include slotId
interface SlotWithId extends Slot {
  slotId?: string;
  appointmentId?: string;
}

export default function AppointmentCard({ appt, selectedSlot, setSelectedSlot, onReload, setPopup }: Props) {
  const [manualVisible, setManualVisible] = useState(false);
  const [manualSlot, setManualSlot] = useState<Slot & { mode: "online" | "offline" }>({
    date: "",
    time: "",
    mode: "online",
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);

  // Debug: Log appointment structure
  console.log("Appointment data:", appt);
  console.log("Patient ID check:", {
    patientId: appt.patientId,
    patientID: appt.patientID,
    id: appt.id
  });

  const handleSlotClick = (slot: SlotWithId, index: number) => {
    setSelectedSlot({ ...slot, mode: appt.mode });
    setSelectedSlotIndex(index);
    // Store the slot ID for scheduling
    if (slot.slotId) {
      setSelectedSlotId(slot.slotId);
    }
    console.log("Slot clicked:", slot);
    console.log("Slot ID:", slot.slotId);
  };

  const handleConfirmSlot = async () => {
    // Validate slot selection
    if (selectedSlotIndex === -1) {
      setPopup("Please select a slot first.");
      return;
    }

    if (!selectedSlot.date || !selectedSlot.time) {
      setPopup("Please select a valid date and time.");
      return;
    }

    // For manual slots, we might need different handling
    if (manualVisible) {
      setPopup("Manual slot scheduling is not yet implemented. Please select from available slots.");
      return;
    }

    // Validate slotID for API call
    if (!selectedSlotId) {
      setPopup("Slot ID is missing. Please contact support.");
      console.error("Selected slot:", selectedSlot);
      console.error("Appointment slots:", appt.selectedSlots);
      return;
    }

    // Get patientID - try both field names
    const patientID = appt.patientID || appt.patientId;
    
    if (!patientID) {
      setPopup("Patient ID is missing. Please contact support.");
      console.error("Appointment object:", appt);
      return;
    }

    try {
      // ✅ Correct payload format as per your API requirements
      const payload = {
        patientID: patientID,        // Use patientID from appointment
        appointmentID: appt.id,      // Use appointment id
        slotID: selectedSlotId,      // Use the selected slot's id
      };

      console.log("Scheduling appointment with payload:", payload);
      console.log("Selected slot details:", selectedSlot);
      console.log("Selected slot ID:", selectedSlotId);
      
      const res: ApiResponse = await scheduleAppointment(payload);
      
      if (res.success) {
        setPopup(`✅ Scheduled patient on ${selectedSlot.date} ${selectedSlot.time} (${selectedSlot.mode})`);
        setTimeout(() => setPopup(null), 3000);
        onReload();
        setSelectedSlot({ date: "", time: "", mode: "online" });
        setManualSlot({ date: "", time: "", mode: "online" });
        setManualVisible(false);
        setSelectedSlotId("");
      } else {
        setPopup(res.message || "Failed to schedule appointment.");
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      setPopup("Failed to schedule appointment.");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
      const res: ApiResponse = await cancelAppointment(appt.id);
      if (res.success) {
        setPopup("✅ Appointment cancelled successfully");
        setTimeout(() => setPopup(null), 3000);
        onReload();
      } else {
        setPopup(res.message || "Failed to cancel appointment.");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
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

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            appt.status === "confirmed"
              ? "bg-green-100 text-green-700"
              : appt.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
        </span>
        <span className="ml-2 text-xs text-gray-500">
          {appt.mode === "online" ? "🎥 Online" : "🏥 In-Person"}
        </span>
      </div>

      {/* Slots */}
      <p className="text-sm text-gray-600 mb-1">Available Slots:</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {appt.selectedSlots?.map((slot: SlotWithId, idx: number) => (
          <button
            key={idx}
            onClick={() => handleSlotClick(slot, idx)}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSlotIndex === idx
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
      {!manualVisible && appt.status === "pending" && (
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
      {appt.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleConfirmSlot}
            disabled={selectedSlotIndex === -1}
            className="px-3 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}

      {appt.status === "confirmed" && (
        <div className="mt-3">
          <button
            onClick={handleCancel}
            className="w-full px-3 py-1 text-sm rounded-full border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          >
            Cancel Appointment
          </button>
        </div>
      )}

      {/* Timestamp */}
      {appt.createdAt && (
        <p className="text-xs text-gray-400 mt-3">
          Requested: {new Date(appt.createdAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}