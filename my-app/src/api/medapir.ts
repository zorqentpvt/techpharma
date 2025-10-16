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
    const response = {
      "success": true,
      "message": "Medicines fetched successfully.",
      "data": [
        { "id": "1", "name": "Paracetamol 500mg", "pharmacy": "HealthPlus Pharmacy", "stock": 25, "contents": "Paracetamol tablets for fever and pain relief.", "price": 5.99 },
        { "id": "2", "name": "Amoxicillin 250mg", "pharmacy": "City Care Pharmacy", "stock": 10, "contents": "Antibiotic capsules for bacterial infections.", "price": 12.5 },
        { "id": "3", "name": "Ibuprofen 200mg", "pharmacy": "MediLine Pharmacy", "stock": 100, "contents": "Pain reliever and anti-inflammatory tablets.", "price": 8.99 },
        { "id": "4", "name": "Cetirizine 10mg", "pharmacy": "HealthPlus Pharmacy", "stock": 50, "contents": "Antihistamine for allergy relief.", "price": 6.5 },
        { "id": "5", "name": "Metformin 500mg", "pharmacy": "City Care Pharmacy", "stock": 30, "contents": "Used for managing type 2 diabetes.", "price": 9.99 },
        { "id": "6", "name": "Omeprazole 20mg", "pharmacy": "MediLine Pharmacy", "stock": 40, "contents": "For treating acid reflux and stomach ulcers.", "price": 11.5 },
        { "id": "7", "name": "Loratadine 10mg", "pharmacy": "HealthPlus Pharmacy", "stock": 60, "contents": "Non-drowsy antihistamine for allergy relief.", "price": 7.25 },
        { "id": "8", "name": "Azithromycin 250mg", "pharmacy": "City Care Pharmacy", "stock": 15, "contents": "Antibiotic used for bacterial infections.", "price": 13.0 },
        { "id": "9", "name": "Vitamin C 500mg", "pharmacy": "MediLine Pharmacy", "stock": 80, "contents": "Supports immune system and general health.", "price": 4.99 },
        { "id": "10", "name": "Aspirin 81mg", "pharmacy": "HealthPlus Pharmacy", "stock": 70, "contents": "Low-dose aspirin for heart health.", "price": 6.0 },
        { "id": "11", "name": "Hydrochlorothiazide 25mg", "pharmacy": "City Care Pharmacy", "stock": 35, "contents": "Diuretic for high blood pressure.", "price": 8.25 },
        { "id": "12", "name": "Simvastatin 20mg", "pharmacy": "MediLine Pharmacy", "stock": 45, "contents": "Used to control cholesterol levels.", "price": 9.5 },
        { "id": "13", "name": "Furosemide 40mg", "pharmacy": "HealthPlus Pharmacy", "stock": 20, "contents": "Diuretic for fluid retention.", "price": 7.0 },
        { "id": "14", "name": "Prednisone 10mg", "pharmacy": "City Care Pharmacy", "stock": 15, "contents": "Corticosteroid for inflammation.", "price": 11.75 },
        { "id": "15", "name": "Clindamycin 300mg", "pharmacy": "MediLine Pharmacy", "stock": 30, "contents": "Antibiotic for bacterial infections.", "price": 13.25 },
        { "id": "16", "name": "Doxycycline 100mg", "pharmacy": "HealthPlus Pharmacy", "stock": 50, "contents": "Broad-spectrum antibiotic.", "price": 12.0 }
      ]
    };
    
    
    
    //const response = await api.get("/medicines/search", { params });
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
    const response = {
      success: true,
      message: "Doctors fetched successfully.",
      data: [
        {
          id: "doc-001",
          name: "Dr. Sarah Thompson",
          specialty: "Cardiologist",
          address: "123 Health St, New York, NY",
          photo: "https://randomuser.me/api/portraits/women/65.jpg",
          lat: 40.7128,
          lng: -74.0060,
         
        },
        {
          id: "doc-002",
          name: "Dr. Michael Lee",
          specialty: "Dermatologist",
          address: "456 Skin Ave, Brooklyn, NY",
          photo: "https://randomuser.me/api/portraits/men/45.jpg",
          lat: 40.6782,
          lng: -73.9442,
        
        },
        {
          id: "doc-003",
          name: "Dr. Priya Patel",
          specialty: "Pediatrician",
          address: "789 Care Blvd, Queens, NY",
          photo: "https://randomuser.me/api/portraits/women/32.jpg",
          lat: 40.7282,
          lng: -73.7949,
        
        },
        {
          id: "doc-004",
          name: "Dr. James Robinson",
          specialty: "Orthopedic Surgeon",
          address: "55 Joint St, Manhattan, NY",
          photo: "https://randomuser.me/api/portraits/men/72.jpg",
          lat: 40.7831,
          lng: -73.9712,
         
        },
        {
          id: "doc-005",
          name: "Dr. Maria Gonzales",
          specialty: "Psychiatrist",
          address: "789 Mind Rd, Bronx, NY",
          photo: "https://randomuser.me/api/portraits/women/41.jpg",
          lat: 40.8448,
          lng: -73.8648,
         
        },
        {
          id: "doc-006",
          name: "Dr. Ahmed Khan",
          specialty: "General Physician",
          address: "123 Health Plaza, Staten Island, NY",
          photo: "https://randomuser.me/api/portraits/men/23.jpg",
          lat: 40.5795,
          lng: -74.1502,
        
        }
      ]
    };
    
    
    //const response = await api.get("/doctors/search", { params });
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
