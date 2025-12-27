// pyapi.ts
import api from "./api";
// pyapi.ts - Updated interfaces and functions

export interface OrderData {
  orderId: string;
  cartId: string;
  userId: string;
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  notes?: Record<string, any>;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ✅ Updated to include medicineId and quantity
export interface CreateOrderPayload {
  amount: number;
  currency: string;
  description: string;
  cartId: string | null;
  medicineId?: string; // Added
  quantity?: number;    // Added
  notes: Record<string, any>;
}

/**
 * Create Razorpay order
 */
export async function createOrder(
  orderData: CreateOrderPayload
): Promise<ApiResponse<OrderData>> {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post<ApiResponse<OrderData>>(
      "/api/payment/create-order",
      orderData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Create order request:", orderData);
    console.log("Create order SUCCESS:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Create order FAILED:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Failed to create order");
  }
}

export async function verifyPayment(
  verificationData: any
): Promise<ApiResponse<any>> {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post<ApiResponse<any>>(
      "/api/payment/verify",
      verificationData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Verify payment SUCCESS:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Verify payment FAILED:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Verification failed");
  }
}