// docApi.ts
import api from "./api"; // your Axios instance

// BOOK APPOINTMENT
export async function bookAppointment(payload: {
    doctorId: string;
    reason: string;
    mode: "online" | "offline";
    selectedSlots: { date: string; time: string }[];
  }) {
    console.log("API Payload (bookAppointment):", payload);
  
    try {
      const response = await api.post("api/user/book-appointment", payload);
      console.log("API Response (bookAppointment):", response.data);
      return response.data; // expected { success, message, data }
    } catch (error: any) {
      console.error("API Error (bookAppointment):", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }
  


// SCHEDULE APPOINTMENT (Doctor sets available time slots)
export async function scheduleAppointment(payload: {
  doctorId: string;
  date: string;
  slots: string[]; // e.g., ["09:00", "10:00", "11:00"]
}) {
  console.log("API Payload (scheduleAppointment):", payload);

  try {
    const response = await api.post("api/doctor/schedule-appointment", payload);
    console.log("API Response (scheduleAppointment):", response.data);
    return response.data; // expected { success, message, data }
  } catch (error: any) {
    console.error("API Error (scheduleAppointment):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}


// GET DOCTOR'S SCHEDULE (view upcoming appointments)
export async function getDoctorSchedule(doctorId: string) {
  console.log("API Payload (getDoctorSchedule):", doctorId);

  try {
    const response = await api.get(`api/doctor/${doctorId}/schedule`);
    console.log("API Response (getDoctorSchedule):", response.data);
    return response.data; // expected { success, message, data }
  } catch (error: any) {
    console.error("API Error (getDoctorSchedule):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}


// CANCEL APPOINTMENT (for user or doctor)
export async function cancelAppointment(appointmentId: string) {
  if (!appointmentId) {
    return { success: false, message: "Appointment ID is required" };
  }

  console.log("API Payload (cancelAppointment):", appointmentId);

  try {
    const response = await api.delete(`api/user/cancel-appointment`, {
      data: { appointment_id: appointmentId },
      headers: { "Content-Type": "application/json" },
    });
    console.log("API Response (cancelAppointment):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error (cancelAppointment):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}
