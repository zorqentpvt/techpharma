// pharmacyApi.ts
import api from "./api"; // import your Axios instance

interface MedicinePayload {
  id?: string; // optional for add
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

// FETCH ALL MEDICINES
export async function fetchMedicines() {
  try {
    const response = await api.get("api/pharmacy/list-medicine");
    console.log("API Response (fetchMedicines):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (fetchMedicines):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}


// ADD MEDICINE
export async function addMedicine(payload: MedicinePayload) {
  console.log("API Payload (addMedicine):", payload);
  try {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as any);
    });

    const response = await api.post("api/pharmacy/add-medicine", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("API Response (addMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (addMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}


// UPDATE MEDICINE
// UPDATE MEDICINE
export async function updateMedicine(id: string, payload: Partial<MedicinePayload>) {
  console.log("API Payload (updateMedicine):", { id, ...payload });
  try {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as any);
    });

    const response = await api.put(`api/pharmacy/update-medicine/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("API Response (updateMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (updateMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// DELETE MEDICINE
export async function deleteMedicine(id: string) {
  console.log("API Payload (deleteMedicine):", { id });
  try {
    const response = await api.delete(`api/pharmacy/delete-medicine/${id}`);
    console.log("API Response (deleteMedicine):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (deleteMedicine):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// UPDATE ORDER STATUS
export async function updateOrderStatus(orderId: string, status: "pending" | "completed" | "cancelled") {
  console.log("API Payload (updateOrderStatus):", { orderId, status });
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    console.log("API Response (updateOrderStatus):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Error (updateOrderStatus):", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
