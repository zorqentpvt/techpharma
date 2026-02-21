import React, { useEffect, useState } from "react";
import { FaBox, FaCheck, FaMapMarkerAlt, FaPhone, FaUser, FaTruck, FaTimes } from "react-icons/fa";

const BASE_URL = "http://localhost:8080";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  totalAmount: number;
  medicines: { name: string; quantity: number }[];
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

export default function AgentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const mappedOrders = data.data.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown",
          customerPhone: order.user?.phoneNumber || "N/A",
          deliveryAddress: order.deliveryAddress,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          latitude: order.user?.address?.latitude,
          longitude: order.user?.address?.longitude,
          medicines: order.orderItems?.map((item: any) => ({
            name: item.medicine?.name || "Unknown Item",
            quantity: item.quantity,
          })) || [],
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/delivery/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openMap = (order: Order) => {
    if (order.latitude && order.longitude) {
      setSelectedAddress(`${order.latitude},${order.longitude}`);
    } else {
      setSelectedAddress(order.deliveryAddress);
    }
    setShowMapModal(true);
  };

  if (loading) return <div className="p-6 text-center">Loading deliveries...</div>;

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? ["ready for pickup", "ready_for_pickup", "out_for_delivery", "assigned"].includes(order.status)
        : order.status === filterStatus;

    const matchesDate = filterDate
      ? new Date(order.createdAt).toISOString().split("T")[0] === filterDate
      : true;

    return matchesStatus && matchesDate;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-[#002E6E] mb-6 flex items-center gap-2">
        <FaTruck /> My Deliveries
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <select
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="active">Active (Undelivered)</option>
          <option value="all">All Orders</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="completed">Delivered</option>
        </select>
        <input
          type="date"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800">#{order.orderNumber}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} • ID: {order.id.slice(0, 8)}...
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {order.status === 'completed' ? 'DELIVERED' : order.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3 text-gray-600">
                <FaUser className="mt-1 text-gray-400 shrink-0" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <FaPhone className="mt-1 text-gray-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <FaMapMarkerAlt className="mt-1 text-gray-400 shrink-0" />
                <div>
                  <span className="text-sm leading-tight block">{order.deliveryAddress}</span>
                  <button 
                    onClick={() => openMap(order)}
                    className="text-blue-600 text-xs font-bold hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    View on Map
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <FaBox /> Items
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  {order.medicines && order.medicines.map((m, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate pr-2">{m.name}</span>
                      <span className="font-medium">x{m.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t">
              {["ready for pickup", "ready_for_pickup", "assigned"].includes(order.status) ? (
                <button
                  onClick={() => updateStatus(order.id, 'out_for_delivery')}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Pick Up & Start Delivery
                </button>
              ) : order.status === 'out_for_delivery' ? (
                <button
                  onClick={() => updateStatus(order.id, 'completed')}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <FaCheck /> Mark as Delivered
                </button>
              ) : (
                <div className="text-center text-gray-500 text-sm font-medium py-2">
                  Delivered
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-200">
            <FaBox size={40} />
          </div>
          <p className="text-gray-500 text-lg">No orders found matching filters.</p>
        </div>
      )}

      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">
            <div className="bg-[#002E6E] px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaMapMarkerAlt /> Delivery Location
              </h2>
              <button 
                onClick={() => setShowMapModal(false)} 
                className="text-white/80 hover:text-white transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
                title="Customer Location"
              ></iframe>
            </div>
            
            <div className="p-4 bg-white border-t flex justify-between items-center shrink-0">
              <p className="text-sm text-gray-500 truncate max-w-[60%] hidden sm:block">{selectedAddress}</p>
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Close
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaTruck /> Start Navigation
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}