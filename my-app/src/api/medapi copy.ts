// searchApi.ts
import api from "./api"; // your Axios instance

interface MedicineSearchParams {
  query: string;       // search term for name/content
  location?: string;   // optional for sorting
  limit?: number;      // optional limit
  offset?: number;     // optional offset/pagination
}

interface DoctorSearchParams {
  query: string;       // search term for name/specialization
  location?: string;   // optional for sorting
  limit?: number;
  offset?: number;
}

// SEARCH MEDICINE
export async function searchMedicine(params: MedicineSearchParams) {
  console.log("API Payload (searchMedicine):", params);

  try {
    const response = await api.get("/medicine/search", { params });
    console.log("API Response (searchMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (searchMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// SEARCH DOCTOR
export async function searchDoctor(params: DoctorSearchParams) {
  console.log("API Payload (searchDoctor):", params);

  try {
    const response = await api.get("/doctors/search", { params });
    console.log("API Response (searchDoctor):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (searchDoctor):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
