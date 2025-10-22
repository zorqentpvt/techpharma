// docApi.ts
import { data } from "react-router-dom";
import api from "./api"; // your Axios instance

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patient: string; // patient name
  reason?: string; // optional reason for appointment
  selectedSlots: Slot[]; // slots booked by the patient
  mode: "online" | "offline"; // type of appointment
  status: "pending" | "confirmed" | "cancelled"; // status of the appointment
  createdAt?: string;
  updatedAt?: string;
}

export interface Slot {
  date: string;
  time: string;
}

export interface Consultation {
  id: string;
  name: string;
  time: string;
  date: string;
  status: "confirmed" | "cancelled" | "consulted";
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  mode?: "online" | "offline";
  reason?: string;
}

export interface ConsultationsResponse {
  upcoming: Consultation[];
  history: Consultation[];
}

export interface BookAppointmentPayload {
  doctorId: string;
  reason: string;
  mode: "online" | "offline";
  selectedSlots: Slot[];
}

export interface ScheduleAppointmentPayload {
  patientID:string;
  doctorId: string;
  date: string;
  slots: string[]; // e.g., ["09:00", "10:00"]
}

// FETCH CONSULTATIONS (for consultation page)
export async function fetchConsultations(): Promise<ApiResponse<ConsultationsResponse>> {
  console.log("API Call: fetchConsultations");

  try {
    const response = {
      success: true,
      message: "Consultations fetched successfully",
      data: {
        upcoming: [
          {
            id: "1",
            name: "John Doe",
            time: "16:00",        // 4:00 PM -> 16:00
            date: "2025-10-22",   // example today
            status: "confirmed",
            mode: "online",
            reason: "General Checkup"
          },
          {
            id: "2",
            name: "Sarah Lee",
            time: "10:30",
            date: "2025-10-23",   // example tomorrow
            status: "cancelled",
            mode: "offline",
            reason: "Dermatology Consultation"
          },
          {
            id: "3",
            name: "Michael Smith",
            time: "14:15",
            date: "2025-10-23",
            status: "confirmed",
            mode: "online",
            reason: "Follow-up"
          },
          {
            id: "4",
            name: "Aisha Khan",
            time: "11:00",
            date: "2025-10-24",
            status: "cancelled",
            mode: "offline",
            reason: "Routine Blood Test"
          },
          {
            id: "5",
            name: "David Johnson",
            time: "15:45",
            date: "2025-10-25",
            status: "confirmed",
            mode: "online",
            reason: "Physiotherapy"
          }
        ],
        history: [
          {
            id: "6",
            name: "Emily Davis",
            time: "15:00",
            date: "2025-10-10",
            status: "consulted",
            diagnosis: "Migraine",
            prescription: "Sumatriptan 50mg",
            notes: "Follow up in 1 week."
          },
          {
            id: "7",
            name: "Robert Brown",
            time: "13:15",
            date: "2025-10-12",
            status: "consulted",
            diagnosis: "Hypertension",
            prescription: "Amlodipine 5mg",
            notes: "Monitor BP daily."
          },
          {
            id: "8",
            name: "Linda Wilson",
            time: "10:00",
            date: "2025-10-15",
            status: "consulted",
            diagnosis: "Seasonal Flu",
            prescription: "Oseltamivir 75mg",
            notes: "Rest and hydrate."
          },
          {
            id: "9",
            name: "James Taylor",
            time: "14:30",
            date: "2025-10-17",
            status: "consulted",
            diagnosis: "Back Pain",
            prescription: "Ibuprofen 400mg",
            notes: "Physiotherapy recommended."
          },
          {
            id: "10",
            name: "Sophia Martinez",
            time: "11:45",
            date: "2025-10-19",
            status: "cancelled",
            diagnosis: "Allergy",
            prescription: "Cetirizine 10mg",
            notes: "Avoid allergens and follow up in 2 weeks."
          }
        ]
      }
    };

    // Simulate API call
    // await api.get("api/consultations");
    console.log("API Response (fetchConsultations):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error (fetchConsultations):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}


// BOOK APPOINTMENT (patient side)
export async function bookAppointment(payload: BookAppointmentPayload): Promise<ApiResponse> {
  console.log("API Payload (bookAppointment):", payload);

  try {
    const response = await api.post("api/user/book-appointment", payload);
    console.log("API Response (bookAppointment):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error (bookAppointment):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

// SCHEDULE APPOINTMENT (doctor side)
export async function scheduleAppointment(payload: ScheduleAppointmentPayload): Promise<ApiResponse> {
  console.log("API Payload (scheduleAppointment):", payload);

  try {
    const response = await api.post("api/doctor/schedule-appointment", payload);
    console.log("API Response (scheduleAppointment):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error (scheduleAppointment):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

// GET DOCTOR'S SCHEDULE (view upcoming appointments)
export async function getDoctorSchedule(): Promise<ApiResponse> {
  console.log("API Payload (getDoctorSchedule):");

  try {
    const response = await api.get(`api/doctor/schedule`);
    console.log("API Response (getDoctorSchedule):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error (getDoctorSchedule):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

// CANCEL APPOINTMENT (user or doctor)
export async function cancelAppointment(appointmentId: string): Promise<ApiResponse> {
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