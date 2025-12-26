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
  doctorId?: string;
  patientId?: string;
  patientID?: string; // Alternative field name
  patient: string; // patient name
  patientProfile?: string; // patient profile image
  reason?: string; // optional reason for appointment
  selectedSlots: Slot[]; // slots booked by the patient
  mode: "online" | "offline"; // type of appointment
  status: "pending" | "confirmed" | "cancelled"; // status of the appointment
  createdAt?: string;
  updatedAt?: string;
}

export interface Slot {
  slotId?: string; // Slot ID for scheduling (matches backend field name)
  appointmentId?: string; // Appointment ID associated with slot
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
  patientID: string;
  appointmentID: string;
  slotID: string;
}

// FETCH CONSULTATIONS (for consultation page)
export async function fetchConsultations(): Promise<ApiResponse<ConsultationsResponse>> {
  console.log("API Call: fetchConsultations");

  try {    
    // The backend handler returns the data directly, which Axios places in `response.data`.
    const response = await api.get<ConsultationsResponse>("api/doctor/consultations");
    console.log("API Response (fetchConsultations):", response.data);
    
    // We wrap the data in the standard ApiResponse format for consistency in the frontend.
    return {
      success: true,
      message: "Consultations fetched successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("API Error (fetchConsultations):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

// FETCH PATIENT CONSULTATIONS (for patient page)
export async function fetchPatientConsultations(): Promise<ApiResponse<ConsultationsResponse>> {
  console.log("API Call: fetchPatientConsultations");

  try {
    // The backend handler will get patientID from the token
    const response = await api.get<ConsultationsResponse>("api/user/consultations");
    console.log("API Response (fetchPatientConsultations):", response.data);
    
    return {
      success: true,
      message: "Consultations fetched successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("API Error (fetchPatientConsultations):", error.response?.data || error.message);
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
    const response = await api.delete(`api/doctor/cancel-appointment`, {
      data: { appointmentId: appointmentId }, // Changed to camelCase to match parameter
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