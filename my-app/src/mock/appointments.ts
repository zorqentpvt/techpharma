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
    status: "checked in",
    start: "08:00",
    end: "09:00",
  },
  {
    id: "a1",
    providerId: "p1",
    customer: "mammooty",
    status: "Confirmed",
    start: "10:00",
    end: "11:00",
  },
  {
    id: "a1",
    providerId: "p1",
    customer: "sunny",
    status: "Cancelled",
    start: "04:00",
    end: "05:00",
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