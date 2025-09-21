export interface Appointment {
  id: string;
  providerId: string;
  customer: string;
  status: string;
  start: string;
  end: string;
}




export const appointments: Appointment[] = [
  {
    id: "a1",
    providerId: "p1",
    customer: "Jane Smith",
    status: "Confirmed",
    start: "08:00",
    end: "09:00",
  },
  {
    id: "a2",
    providerId: "p2",
    customer: "John Doe",
    status: "Checked in",
    start: "09:00",
    end: "10:00",
  },
];