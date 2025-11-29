// pyapi.ts
import api from "./api";

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

export interface CreateOrderPayload {
  amount: number;
  currency: string;
  description: string;
  cartId: string | null;
  notes: Record<string, any>;
}

/**
 * Create Razorpay order
 */
export async function createOrder(orderData: CreateOrderPayload): Promise<ApiResponse<OrderData>> {
  const token = localStorage.getItem("token");
  console.log("JWT Token:", token);

  try {
    const response = await api.post<ApiResponse<OrderData>>("/api/payment/create-order", orderData, { headers: { Authorization: `Bearer ${token}` } });
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
