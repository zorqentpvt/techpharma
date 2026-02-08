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

export async function createOrder(
  orderData: CreateOrderPayload
): Promise<ApiResponse<OrderData>> {
  const token = localStorage.getItem("token");

  const formData = new FormData();

  // REQUIRED
  formData.append("amount", String(orderData.amount));
  formData.append("currency", orderData.currency || "INR");

  // OPTIONAL
  if (orderData.description)
    formData.append("description", orderData.description);

  if (orderData.cartId)
    formData.append("cartId", orderData.cartId);

  if (orderData.medicineId)
    formData.append("medicineId", orderData.medicineId);

  if (orderData.quantity !== undefined)
    formData.append("quantity", String(orderData.quantity));

  if (orderData.prescriptionRequired !== undefined)
    formData.append(
      "prescriptionRequired",
      String(orderData.prescriptionRequired)
    );

  // FILE (must be File)
  if (orderData.prescription instanceof File) {
    formData.append("prescription", orderData.prescription);
  }

  try {
    const response = await api.post<ApiResponse<OrderData>>(
      "/api/payment/create-order",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to create order"
    );
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