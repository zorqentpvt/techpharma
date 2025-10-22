// pyapi.ts
import api from "./api";

export interface OrderData {
  orderId: string;
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

/**
 * Create Razorpay order
 */
export async function createOrder(orderData: any): Promise<ApiResponse<OrderData>> {
  const token = localStorage.getItem("token");
  console.log("JWT Token:", token);

  try {
    const response = await api.post<ApiResponse<OrderData>>("/api/payment/create-order", orderData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create order");
  }
}

/**
 * Verify Razorpay payment
 */
export async function verifyPayment(verificationData: any): Promise<ApiResponse<any>> {
  const token = localStorage.getItem("token");
  console.log("JWT Token:", token);

  try {
    const response = await api.post<ApiResponse<any>>("/api/payment/verify", verificationData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Verification failed");
  }
}
