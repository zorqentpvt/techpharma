import { Appointment } from "./medapi";

const BASE_URL = "http://localhost:8080";

export interface Medicine {
  id: string;
  name: string;
  contents: string;
  description: string;
  stock: number;
  price: number;
  pharmacy: {
    id: string;
    name: string;
    lat?: number;
    lng?: number;
  };
  image?: string;
  prescriptionRequired: boolean;
}

export const searchMedicine = async (
  query: string,
  coords: { latitude: number; longitude: number } | null
) => {
  const token = localStorage.getItem("token");
  let url = `${BASE_URL}/api/user/search-medicines?query=${query}`;
  if (coords) {
    url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const searchDoctor = async (
  query: string,
  coords: { latitude: number; longitude: number } | null
) => {
  const token = localStorage.getItem("token");
  let url = `${BASE_URL}/api/user/search-doctors?query=${query}`;
  if (coords) {
    url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const fetchUserOrders = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const cartdata = async (userId: string) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const removecart = async (medicineId: string) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/remove-from-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ medicine_id: medicineId }),
  });
  return res.json();
};

export const docAppointments = async (doctorId: string): Promise<{ success: boolean; data?: Appointment[]; message?: string }> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/doctor/${doctorId}/appointments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const getActivePharmacies = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/pharmacies`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const getPharmacyDetails = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/pharmacies/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const addToCart = async (medicineId: string, quantity: number) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/user/add-to-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ medicine_id: medicineId, quantity }),
  });
  return res.json();
};