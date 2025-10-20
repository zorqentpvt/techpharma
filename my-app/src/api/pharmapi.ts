// pharmapi.ts
import api from './api';

// Define a type for the medicine data
export interface MedicineData {
  medname: string;
  content: string;
  quantity: number;
  price: number;
  description?: string;
  image?: File | string; // File for uploads, string if already hosted
}

// Add a new medicine
export const addMedicine = async (medicine: MedicineData) => {
    const payload: Record<string, any> = {
      name: medicine.medname,
      content: medicine.content,
      quantity: medicine.quantity,
      price: medicine.price,
      description:medicine.description,
      prescriptionRequired:medicine.prescriptionRequired,
    };
  
    if (medicine.description) {
      payload.description = medicine.description;
    }
  
    if (medicine.image) {
      // If the image is a File, you need to convert it to Base64 or handle upload separately.
      if (medicine.image instanceof File) {
        const base64Image = await fileToBase64(medicine.image);
        payload.image = base64Image;
      } else {
        payload.image = medicine.image; // if it's already a URL
      }
    }
  
    console.log("🟦 Payload to send:", payload);
  
    const response = await api.post('api/pharmacy/add-medicine', payload);
    return response.data;
  };
  
  // ✅ Helper: convert File to Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  

// Update an existing medicine by ID
export const updateMedicine = async (id: string, medicine: Partial<MedicineData>) => {
  const formData = new FormData();

  if (medicine.medname) formData.append('medname', medicine.medname);
  if (medicine.content) formData.append('content', medicine.content);
  if (medicine.quantity !== undefined) formData.append('quantity', medicine.quantity.toString());
  if (medicine.price !== undefined) formData.append('price', medicine.price.toString());
  if (medicine.description) formData.append('description', medicine.description);

  if (medicine.image) {
    if (medicine.image instanceof File) {
      formData.append('image', medicine.image);
    } else {
      formData.append('image', medicine.image);
    }
  }

  const response = await api.put(`/medicines/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

// Delete a medicine by ID
export const deleteMedicine = async (id: string) => {
  const response = await api.delete(`/medicines/${id}`);
  return response.data;
};
