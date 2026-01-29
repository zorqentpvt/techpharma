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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/* ================= GET USERS BY ROLE ================= */

export async function getUsersByRole(
  role: Role
): Promise<ApiResponse<User[]>> {

  console.log("API Call: getUsersByRole", role);

  try {
    const response = await api.get<User[]>("api/admin/users", {
      params: { role },
    });

    console.log("API Response (getUsersByRole):", response);

    return response.data;
  } catch (error: any) {
    console.error(
      "API Error (getUsersByRole):",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

/* ================= GET USER BY ID ================= */

export async function getUserById(
  userId: string
): Promise<ApiResponse<User>> {

  console.log("API Call: getUserById", userId);

  try {
    const response = await api.get<User>(`api/admin/users/${userId}`);

    console.log("API Response (getUserById):", response.data);

    return {
      success: true,
      message: "User fetched successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error(
      "API Error (getUserById):",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

/* ================= UPDATE USER STATUS ================= */

export interface UpdateStatusPayload {
  status: "active" | "inactive";
}

export async function updateUserStatus(
  userId: string,
  payload: UpdateStatusPayload
): Promise<ApiResponse> {

  console.log("API Call: updateUserStatus", userId, payload);

  try {
    const response = await api.put(
      `api/admin/users/${userId}/status`,
      payload
    );

    console.log("API Response (updateUserStatus):", response.data);

    return response.data; // backend already returns { success, message }
  } catch (error: any) {
    console.error(
      "API Error (updateUserStatus):",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}
