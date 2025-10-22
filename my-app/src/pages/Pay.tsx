import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderData {
  orderId: string;
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  notes?: Record<string, any>;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function RazorpayPayment() {
  // Update this with your API & token
  const API_BASE_URL = "http://localhost:8080/api";
  const JWT_TOKEN = "YOUR_JWT_TOKEN_HERE";

  const [amount, setAmount] = useState<number>(100);
  const [description, setDescription] = useState("Test Payment");
  const [customerName, setCustomerName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+919876543210");
  const [status, setStatus] = useState<{ type: string; message: string }>({
    type: "",
    message: "",
  });
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const showStatus = (message: string, type: "info" | "error" | "success") => {
    setStatus({ type, message });
  };

  async function createOrder(orderData: any): Promise<ApiResponse<OrderData>> {
    const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create order");
    return data;
  }

  async function verifyPayment(verificationData: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/payment/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(verificationData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Verification failed");
    return data;
  }

  const initializeRazorpay = (orderData: OrderData) => {
    if (!window.Razorpay) {
      showStatus("❌ Razorpay SDK not loaded", "error");
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount * 100,
      currency: orderData.currency,
      name: "MyApp Payments",
      description,
      order_id: orderData.razorpayOrderId,
      handler: async (response: RazorpayResponse) => {
        try {
          showStatus("Verifying payment...", "info");
          const verificationData = {
            orderId: orderData.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          };
          const result = await verifyPayment(verificationData);
          if (result.success) {
            showStatus("✅ Payment Successful!", "success");
            setDetails(result.data);
          } else {
            showStatus("❌ Payment verification failed", "error");
          }
        } catch (err: any) {
          showStatus(`❌ Error: ${err.message}`, "error");
        } finally {
          setLoading(false);
        }
      },
      prefill: { name: customerName, email, contact: phone },
      notes: { customerName, email, phone },
      theme: { color: "#4f46e5" },
      modal: {
        ondismiss: () => {
          showStatus("Payment cancelled by user", "error");
          setLoading(false);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDetails(null);
    try {
      showStatus("Creating order...", "info");
      const orderPayload = {
        amount,
        currency: "INR",
        description,
        notes: { customerName, email, phone },
      };
      const response = await createOrder(orderPayload);
      if (response.success) {
        showStatus("Opening Razorpay...", "info");
        initializeRazorpay(response.data);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (err: any) {
      showStatus(`❌ ${err.message}`, "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-full flex items-center justify-center bg-[#002E6E] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          💳 Razorpay Payment
        </h1>
        <p className="text-gray-500 text-sm mb-6 text-center">
          A simple standalone Razorpay payment form
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full border rounded-md px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="font-semibold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="font-semibold">Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="font-semibold">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002E6E] text-white py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
        </form>

        {status.message && (
          <div
            className={`mt-4 p-3 text-sm rounded-md ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : status.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {status.message}
          </div>
        )}

        {details && (
          <div className="mt-4 bg-gray-50 rounded-md p-3 text-sm">
            <strong className="text-indigo-600">Payment Details:</strong>
            <div>Order ID: {details.orderId}</div>
            <div>Razorpay Order ID: {details.razorpayOrderId}</div>
            <div>Payment ID: {details.razorpayPaymentId}</div>
            <div>Amount: ₹{details.amount}</div>
            <div>Status: {details.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}
