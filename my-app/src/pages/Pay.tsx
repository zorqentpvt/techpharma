import React, { useEffect, useState } from "react";
import {
  createOrder,
  verifyPayment,
  OrderData,
  RazorpayResponse,
} from "../api/pyapi";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment() {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cartId, setCartId] = useState<string | null>(null);
  const [medicineId, setMedicineId] = useState<string | undefined>();
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  const [status, setStatus] = useState<{ type: string; message: string }>({
    type: "",
    message: "",
  });
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* Load data */
  useEffect(() => {
    console.log("🔄 Loading user and transaction data from localStorage");
    try {
      const userRaw = localStorage.getItem("userdata");
      const trxRaw = localStorage.getItem("transaction");

      console.log("📦 Raw user data:", userRaw);
      console.log("📦 Raw transaction data:", trxRaw);

      if (userRaw) {
        const u = JSON.parse(userRaw);
        console.log("✅ Parsed user data:", u);
        setCustomerName(u.displayName || `${u.firstName} ${u.lastName}`);
        setEmail(u.email || "");
        setPhone(u.phoneNumber || "");
      } else {
        console.warn("⚠️ No user data found in localStorage");
      }

      if (trxRaw) {
        const t = JSON.parse(trxRaw);
        console.log("✅ Parsed transaction data:", t);
        setAmount(t.price || 0);
        setDescription(t.description || t.name || "Payment");
        setCartId(t.cartId || null);
        setMedicineId(t.medicineId || t.id);
        setPrescriptionRequired(!!t.prescriptionRequired);
      } else {
        console.warn("⚠️ No transaction data found in localStorage");
      }
    } catch (e) {
      console.error("❌ Error loading data from localStorage:", e);
      showStatus("Error loading payment data", "error");
    }
  }, []);

  /* Load Razorpay SDK */
  useEffect(() => {
    console.log("🔄 Loading Razorpay SDK");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => {
      console.log("✅ Razorpay SDK loaded successfully");
    };
    
    script.onerror = (error) => {
      console.error("❌ Failed to load Razorpay SDK:", error);
      showStatus("Failed to load payment system", "error");
    };
    
    document.body.appendChild(script);

    return () => {
      console.log("🧹 Cleaning up Razorpay SDK script");
    };
  }, []);

  const showStatus = (message: string, type: "info" | "error" | "success") => {
    console.log(`📢 Status update [${type.toUpperCase()}]:`, message);
    setStatus({ message, type });
  };

  const initializeRazorpay = (order: OrderData) => {
    console.log("🚀 Initializing Razorpay with order:", order);
    
    if (!window.Razorpay) {
      console.error("❌ Razorpay SDK not loaded");
      showStatus("Payment system not ready. Please refresh.", "error");
      setLoading(false);
      return;
    }

    const options = {
      key: order.razorpayKeyId,
      amount: order.amount * 100,
      currency: order.currency,
      name: "MyApp Payments",
      description,
      order_id: order.razorpayOrderId,
      prefill: { name: customerName, email, contact: phone },
      handler: async (res: RazorpayResponse) => {
        console.log("✅ Razorpay payment response received:", res);
        try {
          showStatus("Verifying payment...", "info");
          
          const verifyPayload = {
            orderId: order.orderId,
            razorpayOrderId: res.razorpay_order_id,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
          };
          
          console.log("🔐 Verifying payment with payload:", verifyPayload);
          const verify = await verifyPayment(verifyPayload);
          console.log("📥 Verification response:", verify);

          if (verify.success) {
            console.log("✅ Payment verification successful:", verify.data);
            showStatus("Payment successful", "success");
            setDetails(verify.data);
          } else {
            console.error("❌ Payment verification failed:", verify);
            showStatus("Verification failed", "error");
          }
        } catch (e: any) {
          console.error("❌ Error during payment verification:", e);
          console.error("Error stack:", e.stack);
          showStatus(e.message || "Verification error occurred", "error");
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          console.warn("⚠️ Payment modal dismissed by user");
          showStatus("Payment cancelled", "error");
          setLoading(false);
        },
      },
      theme: { color: "#002E6E" },
    };

    console.log("🎨 Razorpay options configured:", {
      ...options,
      key: options.key ? "***" + options.key.slice(-4) : "missing",
    });

    try {
      const razorpayInstance = new window.Razorpay(options);
      console.log("✅ Razorpay instance created, opening modal");
      razorpayInstance.open();
    } catch (e) {
      console.error("❌ Error creating Razorpay instance:", e);
      showStatus("Failed to open payment modal", "error");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Form submitted");
  
    if (prescriptionRequired && !prescriptionFile) {
      console.warn("⚠️ Prescription required but not provided");
      showStatus("Prescription required", "error");
      return;
    }
  
    setLoading(true);
    setDetails(null);
  
    try {
      // Create the payload object - pass amount as number
      const orderPayload: any = {
        amount: amount, // Number, not string
        currency: "INR",
        description: description,
        quantity: 1,
        prescriptionRequired: prescriptionRequired,
      };

      // Add optional fields only if they have values
      if (cartId) {
        orderPayload.cartId = cartId;
      }
      
      if (medicineId) {
        orderPayload.medicineId = medicineId;
      }

      if (prescriptionRequired && prescriptionFile) {
        orderPayload.prescription = prescriptionFile;
      }
  
      console.log("📤 Creating order with payload:");
      console.log("  - Amount:", amount, typeof amount);
      console.log("  - Description:", description);
      console.log("  - Cart ID:", cartId);
      console.log("  - Medicine ID:", medicineId);
      console.log("  - Prescription Required:", prescriptionRequired);
  
      if (prescriptionRequired && prescriptionFile) {
        console.log("📎 Attaching prescription file:", {
          name: prescriptionFile.name,
          size: prescriptionFile.size,
          type: prescriptionFile.type,
        });
      }
  
      showStatus("Creating order...", "info");
      const res = await createOrder(orderPayload);
      console.log("📥 Create order response:", res);
  
      if (!res.success) {
        console.error("❌ Order creation failed:", res);
        throw new Error(res.message || "Order creation failed");
      }
  
      console.log("✅ Order created successfully:", res.data);
      showStatus("Opening Razorpay...", "info");
      initializeRazorpay(res.data);
    } catch (e: any) {
      console.error("❌ Error in handleSubmit:", e);
      console.error("Error stack:", e.stack);
      showStatus(e.message || "An error occurred", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-[#002E6E] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-xl font-bold text-center mb-4">
          Razorpay Payment
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <input value={amount} readOnly className="w-full border p-2" />
          <input value={description} readOnly className="w-full border p-2" />
          <input value={customerName} readOnly className="w-full border p-2" />
          <input value={email} readOnly className="w-full border p-2" />
          <input value={phone} readOnly className="w-full border p-2" />

          {prescriptionRequired && (
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                console.log("📁 File selected:", file ? {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                } : "none");
                setPrescriptionFile(file);
              }}
              required
              className="w-full border p-2"
            />
          )}

          <button
            disabled={loading}
            className="w-full bg-[#002E6E] text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>

        {status.message && (
          <div
            className={`mt-3 p-3 rounded text-sm ${
              status.type === "success"
                ? "bg-green-100 text-green-800"
                : status.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {status.message}
          </div>
        )}

        {details && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-1">
            <div><strong>Order:</strong> {details.orderId}</div>
            <div><strong>Payment:</strong> {details.razorpayPaymentId}</div>
            <div><strong>Status:</strong> {details.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}