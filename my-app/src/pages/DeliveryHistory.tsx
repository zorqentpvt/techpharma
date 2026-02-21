import React, { useEffect, useState } from "react";
import { fetchOrders } from "../api/pharmastoreapi";
import { FaHistory, FaUser, FaPhone, FaMapMarkerAlt, FaBox, FaSearch, FaMotorcycle, FaTimes, FaEye } from "react-icons/fa";

const BASE_URL = "http://localhost:8080";

// Utility to correctly resolve image URLs
const resolveImageUrl = (img: string | undefined | null): string => {
  if (!img) return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  if (img.startsWith("data:")) return img;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};

interface DeliveryAgentInfo {
  name: string;
  phone: string;
  avatar: string;
  vehicleNumber: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  status: string;
  totalAmount: number;
  medicines: { name: string; quantity: number }[];
  orderDate: string;
  deliveryAgent?: DeliveryAgentInfo;
}

export default function DeliveryHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchOrders();
        if (res?.success) {
          // Filter orders that have a delivery agent assigned
          const history = res.data.filter((o: any) => o.deliveryAgent);
          setOrders(history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

  const filteredOrders = orders.filter((order) => {
    const matchesDate = filterDate ? new Date(order.orderDate).toISOString().split('T')[0] === filterDate : true;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.deliveryAgent?.name?.toLowerCase() || "").includes(term) ||
      (order.orderNumber?.toLowerCase() || "").includes(term) ||
      (order.deliveryAgent?.vehicleNumber?.toLowerCase() || "").includes(term);
    
    return matchesDate && matchesSearch;
  });

  // Group orders by agent
  const groupedOrders = Object.values(
    filteredOrders.reduce((acc, order) => {
      if (!order.deliveryAgent) return acc;
      const key = order.deliveryAgent.phone; // Use phone as unique key for agent
      if (!acc[key]) {
        acc[key] = {
          agent: order.deliveryAgent,
          orders: [],
        };
      }
      acc[key].orders.push(order);
      return acc;
    }, {} as Record<string, { agent: DeliveryAgentInfo; orders: Order[] }>)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-[#002E6E]">
            <FaHistory size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002E6E]">Delivery History</h1>
            <p className="text-gray-500">Track all assigned deliveries and their status</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Agent Name, Order #, or Vehicle Number..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {groupedOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">No delivery history found matching your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedOrders.map((group) => (
              <div key={group.agent.phone} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
                {/* Agent Header */}
                <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex items-center gap-4">
                  <img 
                    src={resolveImageUrl(group.agent.avatar)} 
                    alt={group.agent.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-gray-800">{group.agent.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaPhone size={10} />
                      {group.agent.phone}
                    </div>
                    {group.agent.vehicleNumber && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <FaMotorcycle size={10} />
                        {group.agent.vehicleNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                <div className="p-4 flex-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Assigned Orders ({group.orders.length})</h4>
                  <div className="space-y-3">
                    {group.orders.map((order) => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-100 cursor-pointer transition group bg-gray-50/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800 text-sm">#{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                          <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Details <FaEye size={10} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#002E6E] px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Order #{selectedOrder.orderNumber}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white transition">
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Customer Details</p>
                  <div className="flex items-center gap-3 text-gray-700 mb-2">
                    <FaUser className="text-gray-400" />
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 mb-2">
                    <FaPhone className="text-gray-400" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-700">
                    <FaMapMarkerAlt className="text-gray-400 mt-1 shrink-0" />
                    <span className="text-sm leading-relaxed">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Order Items</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    {selectedOrder.medicines.map((med, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{med.name}</span>
                        <span className="font-medium text-gray-900">x{med.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-bold text-gray-800 text-lg">
                      <span>Total Amount</span>
                      <span className="text-[#002E6E]">₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase ${
                    selectedOrder.status === 'completed' || selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    Status: {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}