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
