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
    const response = await api.post("/medicines/search", payload);
    console.log("API Response (searchMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (searchMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}



// SEARCH DOCTOR
export async function searchDoctor(searchQuery: string, coordinates: { lat: number; long: number }) {
  const payload = {
    searchQuery,
    coordinates,  // ✅ same structure
  };

  console.log("API Payload (searchDoctor):", payload);

  try {
    const response = await api.post("/doctors/search", payload);
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

    const response ={
      "success": true,
      "message": "Appointments fetched successfully",
      "data": [
        { "date": "2025-10-19", "time": "08:00" },
        { "date": "2025-10-19", "time": "09:00" },
        { "date": "2025-10-19", "time": "10:00" },
        { "date": "2025-10-19", "time": "11:00" },
        { "date": "2025-10-19", "time": "12:00" },
        { "date": "2025-10-19", "time": "13:00" },
        { "date": "2025-10-19", "time": "14:00" },
        { "date": "2025-10-20", "time": "08:00" },
        { "date": "2025-10-20", "time": "09:00" },
        { "date": "2025-10-20", "time": "10:00" },
        { "date": "2025-10-20", "time": "11:00" },
        { "date": "2025-10-20", "time": "12:00" },
        { "date": "2025-10-20", "time": "13:00" },
        { "date": "2025-10-20", "time": "14:00" },
        { "date": "2025-10-20", "time": "15:00" },
        { "date": "2025-10-21", "time": "08:00" },
        { "date": "2025-10-21", "time": "09:00" },
        { "date": "2025-10-21", "time": "10:00" },
        { "date": "2025-10-21", "time": "11:00" },
        { "date": "2025-10-21", "time": "12:00" },
        { "date": "2025-10-21", "time": "13:00" },
        { "date": "2025-10-21", "time": "14:00" },
        { "date": "2025-10-21", "time": "15:00" },
        { "date": "2025-10-21", "time": "16:00" },
        { "date": "2025-10-21", "time": "17:00" }
      ]
    }
    //const response = await api.get(`/doctors/${id}/appointments`);
    console.log("API Response (docAppointments):", response.data);
    return response.data; // expected to have { success, message, data }
  } catch (error: any) {
    console.log("API Error (docAppointments):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function cartdata(id: string) {
  console.log("API Payload (cartdata):", id);

  try {
    const response = {
      success: true,
      message: "Cart fetched successfully",
      data: {
        products: [
          {
            id: 1,
            name: "Panadols",
            description: "Paracetamol",
            price: 10,
            image: "https://via.placeholder.com/200x142.png?text=Product+01",
            quantity: 12,
          },
          {
            id: 2,
            name: "Ozempic",
            description: "Semaglutide injection",
            price: 30,
            image: "https://via.placeholder.com/200x142.png?text=Product+02",
            quantity: 12,
          },
          {
            id: 3,
            name: "Cipro",
            description: "Ciprofloxacin (oral)",
            price: 27,
            image: "https://via.placeholder.com/200x142.png?text=Product+03",
            quantity: 12,
          },
        ],
        shipping: 0,
        taxes: 5,
        totalcost: 12000,
      },
    }
    //const response = await api.get(`/view-cart`,  { userId: id });
    console.log("API Response (cartdata):", response.data);
    return response; // expected { success, message, data }
  } catch (error: any) {
    console.log("API Error (cartdata):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
