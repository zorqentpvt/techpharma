import { medicines, Medicine } from "../mock/medicines";
import { users } from "../mock/users"; // Import users to get doctors

// ------------------ Helpers ------------------
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ------------------ Medicines ------------------
/**
 * Search for medicines by name or pharmacy.
 */
export async function searchMedicine(query: string): Promise<Medicine[]> {
  await delay(300);
  const q = query.toLowerCase();
  return medicines.filter(
    m =>
      m.name.toLowerCase().includes(q) ||
      m.pharmacy.toLowerCase().includes(q)
  );
}

/**
 * Add a new medicine to the inventory
 */
export async function addMedicine(newMedicine: Medicine): Promise<void> {
  await delay(300);
  const exists = medicines.some(
    m => m.name.toLowerCase() === newMedicine.name.toLowerCase()
  );
  if (exists) {
    throw new Error(`Medicine with name "${newMedicine.name}" already exists.`);
  }
  medicines.push({ ...newMedicine, id: Date.now().toString() });
}

/**
 * Update an existing medicine
 */
export async function updateMedicine(
  id: string,
  updated: Partial<Medicine>
): Promise<void> {
  await delay(300);
  const index = medicines.findIndex(m => m.id === id);
  if (index === -1) {
    throw new Error(`Medicine with id "${id}" not found.`);
  }
  medicines[index] = { ...medicines[index], ...updated };
}

/**
 * Get all medicines
 */
export async function getAllMedicines(): Promise<Medicine[]> {
  await delay(300);
  return [...medicines]; // return copy
}

// ------------------ Appointments ------------------
export interface Appointment {
  id: string;
  doctor: string;
  patient: string;
  reason: string;
  status: "pending" | "scheduled";
}

let appointments: Appointment[] = [
  {
    id: "a1",
    doctor: "drsmith",
    patient: "John Doe",
    reason: "Headache",
    status: "pending",
  },
  {
    id: "a2",
    doctor: "drsmith",
    patient: "Jane Smith",
    reason: "Fever",
    status: "scheduled",
  },
];

/**
 * Get appointments for a specific doctor
 */
export async function getAppointments(
  doctorUsername: string
): Promise<Appointment[]> {
  await delay(300);
  return appointments.filter(a => a.doctor === doctorUsername);
}

/**
 * Schedule (update status) an appointment
 */
export async function scheduleAppointment(id: string): Promise<void> {
  await delay(300);
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error(`Appointment with id "${id}" not found.`);
  }
  appointments[index].status = "scheduled";
}

// ------------------ Doctors ------------------
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

// Mock specialties mapping for doctors
const specialties: Record<string, string> = {
  drsmith: "Cardiology",
  drjohn: "Pediatrics",
};

/**
 * Get all doctors from users with role 'doctor'
 */
export async function getDoctors(): Promise<Doctor[]> {
  await delay(300);
  return users
    .filter(user => user.role === "doctor")
    .map(user => ({
      id: user.username,
      name: user.username.charAt(0).toUpperCase() + user.username.slice(1),
      specialty: specialties[user.username] || "General",
    }));
}

// ------------------ Consultations ------------------
export interface Consultation {
  id: string;
  appointmentId: string;
  doctor: string;
  patient: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

let consultations: Consultation[] = [];

/**
 * Get consultation details for a given appointment
 */
export async function getConsultation(
  appointmentId: string
): Promise<Consultation> {
  await delay(300);
  const c = consultations.find(c => c.appointmentId === appointmentId);
  if (!c) {
    // If no consultation exists yet, bootstrap it from appointment
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found");
    return {
      id: Date.now().toString(),
      appointmentId,
      doctor: appt.doctor,
      patient: appt.patient,
      symptoms: "",
      diagnosis: "",
      prescription: "",
      notes: "",
    };
  }
  return c;
}

/**
 * Update or create a consultation
 */
export async function updateConsultation(
  appointmentId: string,
  updated: Partial<Consultation>
): Promise<void> {
  await delay(300);
  const index = consultations.findIndex(c => c.appointmentId === appointmentId);
  if (index === -1) {
    // create new consultation
    consultations.push({
      id: Date.now().toString(),
      appointmentId,
      doctor: updated.doctor || "unknown",
      patient: updated.patient || "unknown",
      symptoms: updated.symptoms || "",
      diagnosis: updated.diagnosis || "",
      prescription: updated.prescription || "",
      notes: updated.notes || "",
    });
  } else {
    consultations[index] = { ...consultations[index], ...updated };
  }
}

// ------------------ Reports ------------------
export interface ReportData {
  id: string;
  patient: string;
  diagnosis: string;
  prescription: string;
  date: string;
}

let reports: ReportData[] = [
  {
    id: "r1",
    patient: "John Doe",
    diagnosis: "Migraine",
    prescription: "Painkillers",
    date: "2025-10-01",
  },
];

/**
 * Get all reports
 */
export async function getReports(): Promise<ReportData[]> {
  await delay(300);
  return [...reports];
}

/**
 * Add a new report
 */
export async function addReport(report: ReportData): Promise<void> {
  await delay(300);
  reports.push({ ...report, id: Date.now().toString() });
}
