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
    // If no consultation yet, return an empty template
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
