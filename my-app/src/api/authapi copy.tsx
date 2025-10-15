// api.ts
import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://your-api.com", // Replace with your real API URL
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
    const response = await api.post("/auth/signin", payload);
    console.log("API Response (signin):", response.data);

    // Save token & user info in localStorage if returned
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error: any) {
    console.log("API Response (signin) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// SIGNUP
export async function signup(payload: { username: string; email: string; password: string; role?: string }) {
  console.log("API Payload (signup):", payload);

  try {
    const response = await api.post("/auth/signup", payload);
    console.log("API Response (signup):", response.data);
    return response.data;
  } catch (error: any) {
    console.log("API Response (signup) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// --- PROFILE APIs ---

// Update Profile
export async function updateProfile(payload: { username?: string; email?: string; password?: string }) {
  console.log("API Payload (updateProfile):", payload);

  try {
    const response = await api.put("/user/profile", payload);
    console.log("API Response (updateProfile):", response.data);

    // Update user info in localStorage
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error: any) {
    console.log("API Response (updateProfile) Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// --- HELPER FUNCTIONS ---

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
