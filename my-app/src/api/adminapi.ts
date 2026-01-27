import api from "./api";

/* ================= TYPES ================= */

export type Role = "normal" | "doctor" | "pharmacy";

export interface Doctor {
  id: string;
  specializationId: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  isActive: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  roleId: Role;
  status: "active" | "inactive";
  isActive: boolean;
  firsttime: boolean;
  doctor?: Doctor;
  pharmacy?: Pharmacy;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/* ================= GET USERS BY ROLE ================= */

export async function getUsersByRole(
  role: Role
): Promise<ApiResponse<User[]>> {
  const token = localStorage.getItem("token");
  const endpoint = `/api/admin/users?role=${role}`;

  console.log("➡️ GET", endpoint);

  try {
    const response = await api.get<ApiResponse<User[]>>(
      "/api/admin/users",
      {
        params: { role },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ RESPONSE", endpoint, response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ ERROR", endpoint,
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to fetch users"
    );
  }
}

/* ================= GET USER BY ID ================= */

export async function getUserById(
  userId: string
): Promise<ApiResponse<User>> {
  const token = localStorage.getItem("token");
  const endpoint = `/api/admin/users/${userId}`;

  console.log("➡️ GET", endpoint);

  try {
    const response = await api.get<ApiResponse<User>>(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ RESPONSE", endpoint, response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ ERROR", endpoint,
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to fetch user"
    );
  }
}

/* ================= UPDATE USER STATUS ================= */

export interface UpdateStatusPayload {
  status: "active" | "inactive";
}

export interface UpdateStatusResponse {
  userId: string;
  message: string;
}

export async function updateUserStatus(
  userId: string,
  payload: UpdateStatusPayload
): Promise<UpdateStatusResponse> {
  const token = localStorage.getItem("token");
  const endpoint = `/api/admin/users/${userId}/status`;

  console.log("➡️ PUT", endpoint, payload);

  try {
    const response = await api.put<UpdateStatusResponse>(
      endpoint,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ RESPONSE", endpoint, response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ ERROR", endpoint,
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to update status"
    );
  }
}
