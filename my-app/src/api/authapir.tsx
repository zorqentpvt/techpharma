// api.ts
import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:8080", // Replace with your real API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// --- AUTH APIs ---

// SIGNIN
export async function signin(payload: { username: string; password: string }) {
  console.log("API Payload (signin):", payload);

  try {
    const response = await api.post("api/auth/login", payload);
    console.log("API Response (signin):", response.data);

    // Save access token separately
    if (response.data.data?.accessToken) {
      localStorage.setItem("token", response.data.data.accessToken);
    }

    // Save user data separately
    if (response.data.data?.user) {
      localStorage.setItem("userdata", JSON.stringify(response.data.data.user));
    }

    return response.data;
  } catch (error: any) {
    console.log("API Response (signin) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}


// SIGNUP
// In api.ts - SIGNUP function
export async function signup(payload: any) {
  console.log("API Payload (signup):", payload);

  try {
    const formData = new FormData();
    
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        // Handle File objects (like certi)
        if (payload[key] instanceof File) {
          formData.append(key, payload[key]);
        } 
        // Handle other values
        else if (typeof payload[key] === 'object') {
          formData.append(key, JSON.stringify(payload[key]));
        }
        else {
          formData.append(key, payload[key].toString());
        }
      }
    });

    const response = await api.post("api/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    console.log("API Response (signup):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Response (signup) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}
// --- PROFILE APIs ---

// Update Profile
export async function updateProfile(payload: any) {
  console.log("API Payload (updateProfile):", payload);

  try {
    const response = await api.put("api/profile", payload);
    console.log("API Response (updateProfile):", response.data);

    // Update user info in localStorage
    if (response.data.user) {
      localStorage.setItem("userData", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error: any) {
    console.log("API Response (updateProfile) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}


// --- HELPER FUNCTIONS ---


export interface Role {
  id: string;
  name: string;
}

interface RolesApiResponse {
  success: boolean;
  message: string;
  data: Role[];
}

export async function fetchRoles(): Promise<Role[]> {
  try {
    const response = await api.get<RolesApiResponse>("api/auth/roles");
    console.log(response);

    if (!response || !response.data || !response.data.data) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    // Return the roles array, not the whole response object
    return response.data.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}



// Get stored user role
export function getUserRole(): string | null {
  const user = localStorage.getItem("user");
  if (!user) return null;

  try {
    const parsedUser = JSON.parse(user);
    return parsedUser.role || null;
  } catch (err) {
    console.error("Failed to parse user from localStorage", err);
    return null;
  }
}

// Logout helper (optional)
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export default api;
