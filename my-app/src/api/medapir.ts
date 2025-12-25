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
export async function searchMedicine(searchQuery: string, coordinates: { lat: number; long: number }) {
  const payload = {
    searchQuery,
    coordinates,  // ✅ nested object
  };

  console.log("API Payload (searchMedicine):", payload);

  try {
    const response = await api.post("api/user/medicines", payload);
    console.log("API Response (searchMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (searchMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}



// SEARCH DOCTOR
export async function searchDoctor(query: string, coordinates: { lat: number; long: number }) {
  const payload = {
    query,
    coordinates,  // ✅ same structure
  };

  console.log("API Payload (searchDoctor):", payload);

  try {
    const response = await api.post("api/user/doctors", payload);
    console.log("API Response (searchDoctor):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (searchDoctor):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}


// Corrected async function
export async function docAppointments(id: string) {
  console.log("API Payload (docAppointments):", id);

  try {

    const response = await api.get(`api/user/confirmed-appointment-slots`, { docId: id });
      console.log("API Response (docAppointments) already booked:", response.data);
    return response.data; // expected to have { success, message, data }
  } catch (error: any) {
    console.log("API Error (docAppointments):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function cartdata(id: string) {
  console.log("API Payload (cartdata):", id);

  try {
    const response = await api.get(`api/user/view-cart`,  { userId: id });
    console.log("API Response (cartdata):", response.data);
    return response.data; // expected { success, message, data }
  } catch (error: any) {
    console.log("API Error (cartdata):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
export async function addtocart(medicine_id: string) {
  console.log("API Payload (cartdata):quantity:1", medicine_id);

  try {
    const response = await api.post(`api/user/add-cart`,  { medicine_id,quantity:1});
    console.log("API Response (cartdata):", response.data);
    return response; // expected { success, message, data }
  } catch (error: any) {
    console.log("API Error (cartdata):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
export async function removecart(medicineId: string) {
  // Basic validation
  if (!medicineId) {
    return { success: false, message: "Medicine ID is required" };
  }

  // Payload must match Go struct exactly
  const payload = { medicine_id: medicineId };
  console.log("API Payload (removedata):", payload);

  try {
    const response = await api.delete(`api/user/remove-cart`, {
      data: payload,
      headers: { "Content-Type": "application/json" }, // ensure JSON is sent
    });

    console.log("API Response (removedata):", response.data);
    return response.data; // expected { success, message, data }

  } catch (error: any) {
    console.error("API Error (removedata):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}