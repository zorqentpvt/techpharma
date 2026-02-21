import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderItemResponse {
  medicineName: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

interface TrackOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  deliveryAddress: string;
  items: OrderItemResponse[];
}

const BASE_URL = "http://localhost:8080";

export default function TrackOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<TrackOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/auth/track/${orderId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || "Failed to load order details");
        }
      } catch (err) {
        setError("An error occurred while fetching order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error}</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Order not found</div>;

  const steps = ["pending", "confirmed", "preparing", "ready for pickup", "out_for_delivery", "delivered"];
  
  let normalizedStatus = order.status.toLowerCase();
  if (normalizedStatus === "completed") normalizedStatus = "delivered";

  const currentStepIndex = steps.indexOf(normalizedStatus);
  const isCancelled = normalizedStatus === "cancelled";

  const getStatusIcon = (step: string, index: number) => {
    if (isCancelled) return <XCircle className="w-6 h-6 text-red-500" />;
    if (index <= currentStepIndex) return <CheckCircle className="w-6 h-6 text-green-500" />;
    return <Clock className="w-6 h-6 text-gray-300" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition gap-1"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Orders
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
              <p className="text-gray-500 text-sm">Placed on {new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-medium capitalize ${isCancelled ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {normalizedStatus}
            </div>
          </div>

          <div className="p-8 bg-gray-50/50">
             {isCancelled ? (
                 <div className="text-center py-4 text-red-600 font-semibold bg-red-50 rounded-lg border border-red-100">
                     This order has been cancelled.
                 </div>
             ) : (
                <div className="relative flex justify-between items-center w-full mt-4 mb-8">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 z-0 transform -translate-y-1/2"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-green-500 z-0 transform -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
                    ></div>

                    {steps.map((step, index) => (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                            <div className={`bg-white p-2 rounded-full border-2 ${index <= currentStepIndex ? 'border-green-500' : 'border-gray-200'}`}>
                                {getStatusIcon(step, index)}
                            </div>
                            <span className={`absolute top-12 text-xs font-medium capitalize whitespace-nowrap ${index <= currentStepIndex ? 'text-gray-800' : 'text-gray-400'}`}>
                                {step.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                </div>
             )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 p-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" /> Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {item.imageUrl ? (
                        <img src={item.imageUrl.startsWith("http") ? item.imageUrl : `${BASE_URL}${item.imageUrl}`} alt={item.medicineName} className="w-16 h-16 object-cover rounded-lg bg-white" />
                    ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.medicineName}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-blue-600" /> Delivery Details
                </h2>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
                  <p className="font-medium text-gray-900 mb-1">Shipping Address</p>
                  {order.deliveryAddress}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Payment Summary</h2>
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-blue-600 text-lg">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}