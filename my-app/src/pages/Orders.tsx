import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOrders, updateOrderStatus } from "../api/pharmastoreapi";
import { Eye, X, Printer, Truck } from "lucide-react";

/* ---------------- USER ---------------- */

const getUserFromStorage = () => {
  return { username: "Central Pharmacy", role: "pharmacy" };
};

/* ---------------- TYPES ---------------- */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

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
  prescriptionURL?: string;
  medicines: { name: string; quantity: number }[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  pharmacy: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  deliveryAgent?: DeliveryAgentInfo;
}

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparing", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Ready for Pickup", color: "bg-green-100 text-green-800" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Delivered", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

/* ---------------- MAP UI STATUS → API STATUS ---------------- */
const STATUS_TO_API: Record<OrderStatus, string> = {
  pending: "pending",
  confirmed: "confirmed",
  preparing: "preparing",
  ready: "ready for pickup",
  out_for_delivery: "out_for_delivery",
  completed: "completed",
  cancelled: "cancelled",
};
const BASE_URL = "http://localhost:8080";

/* ---------------- COMPONENT ---------------- */
export default function Orders() {
  const navigate = useNavigate();
  const [user] = useState(getUserFromStorage());

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<OrderStatus | "all">("all");
  const [filterDate, setFilterDate] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  /* ---------------- FETCH ORDERS ---------------- */
  const loadOrders = async () => {
    const res = await fetchOrders();
    if (res?.success) {
      const mappedOrders = res.data.map((order: any) => ({
        ...order,
        status: order.status === "ready for pickup" ? "ready" : order.status,
      }));
      setOrders(mappedOrders);
      return mappedOrders;
    }
    return [];
  };

  useEffect(() => {
    loadOrders();
  }, []);
  
  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!user || user.role !== "pharmacy") {
      // navigate("/dashboard");
    }
  }, [user, navigate]);

  /* ---------------- LOCAL STATUS CHANGE ---------------- */
  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status } : o
      )
    );
  };

  const fetchAgents = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/pharmacy/delivery-agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      const onlineAgents = data.data.filter((agent: any) => agent.status === "online");
      setAgents(onlineAgents);
    }
  };

  /* ---------------- UPDATE API ---------------- */
  const handleUpdate = async (order: Order) => {
    setUpdatingId(order.id);

    const apiStatus = STATUS_TO_API[order.status];

    const res = await updateOrderStatus(apiStatus, order.id);

    if (!res?.success) {
      alert(res?.message || "Failed to update order");
    } else if (order.status === "ready") {
      setSelectedOrder(order);
      await fetchAgents();
      setShowAssignModal(true);
    }

    setUpdatingId(null);
  };

  const handleAssign = async (agentId: string) => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/pharmacy/orders/${selectedOrder.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        alert("Order assigned successfully");
        setShowAssignModal(false);
        const updatedOrders = await loadOrders();
        const updatedSelected = updatedOrders.find((o: any) => o.id === selectedOrder.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to remove the assigned agent?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/pharmacy/orders/${selectedOrder.id}/assign`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Agent removed successfully");
        const updatedOrders = await loadOrders();
        const updatedSelected = updatedOrders.find((o: any) => o.id === selectedOrder.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to remove agent");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ---------------- FILTER ---------------- */
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      (order.orderNumber || order.id).toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search);

    const matchStatus =
      filterStatus === "all" || order.status === filterStatus;

    const matchDate =
      !filterDate ||
      new Date(order.orderDate).toISOString().split("T")[0] === filterDate;

    return matchSearch && matchStatus && matchDate;
  });

  /* ---------------- PRINT HANDLER ---------------- */
  const handlePrint = () => {
    if (!selectedOrder) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the invoice");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedOrder.orderNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #002E6E; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #002E6E; }
            .invoice-title { font-size: 20px; color: #666; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .section-title { font-size: 14px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 10px; }
            .info p { margin: 5px 0; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f8f9fa; border-bottom: 2px solid #dee2e6; color: #495057; }
            td { padding: 12px; border-bottom: 1px solid #dee2e6; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-row { font-size: 18px; font-weight: bold; color: #002E6E; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TechPharma</div>
            <div class="invoice-title">INVOICE / DELIVERY SLIP</div>
          </div>

          <div class="grid">
            <div class="info">
              <div class="section-title">Pharmacy</div>
              <p><strong>${selectedOrder.pharmacy}</strong></p>
              <p>${selectedOrder.pharmacyAddress || ""}</p>
              <p>Phone: ${selectedOrder.pharmacyPhone || ""}</p>
            </div>
            <div class="info">
              <div class="section-title">Order Info</div>
              <p><strong>Order #:</strong> ${selectedOrder.orderNumber}</p>
              <p><strong>Date:</strong> ${new Date(selectedOrder.orderDate).toLocaleString()}</p>
              <p><strong>Status:</strong> ${selectedOrder.status.toUpperCase()}</p>
              <p><strong>Payment:</strong> ${selectedOrder.paymentMethod || "N/A"}</p>
            </div>
            <div class="info">
              <div class="section-title">Customer & Delivery</div>
              <p><strong>Name:</strong> ${selectedOrder.customerName}</p>
              <p><strong>Phone:</strong> ${selectedOrder.customerPhone}</p>
              <p><strong>Address:</strong><br/>${selectedOrder.deliveryAddress || "N/A"}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: right; width: 100px;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.medicines.map((m) => `
                <tr>
                  <td>${m.name}</td>
                  <td style="text-align: right;">${m.quantity}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">Total Amount: ₹${selectedOrder.totalAmount}</div>
          </div>

          <div class="footer">
            <p>Thank you for choosing TechPharma!</p>
            <p>This is a computer generated invoice.</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-[#F5FAFF] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2 items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F4FA8]">
            Order Management
          </h1>

          <span className="bg-white px-4 py-2 rounded-xl shadow text-sm font-medium text-[#0F4FA8]">
            {user.username}
          </span>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <input
            className="w-full border px-4 py-3 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-[#00B9F1] outline-none"
            placeholder="Search by order #, name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="w-full border px-4 py-3 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-[#00B9F1] outline-none bg-white"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as OrderStatus | "all")
            }
          >
            <option value="all">All Statuses</option>
            {Object.keys(statusConfig).map((s) => (
              <option key={s} value={s}>
                {statusConfig[s as OrderStatus].label}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            className="w-full border px-4 py-3 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-[#00B9F1] outline-none bg-white"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          <table className="min-w-[900px] w-full divide-y">
            <thead className="bg-[#002E6E] text-white text-sm">
              <tr>
                <th className="px-4 py-4 text-left">Order #</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">Medicines</th>
                <th className="px-4 py-4 text-left">Amount</th>
                <th className="px-4 py-4 text-left">Date</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-right">Update</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#F0F9FF] transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[#0F4FA8]">
                      {order.orderNumber}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {order.prescriptionURL ? (
                        <div className="mb-2">
                          <a
                            href={`${BASE_URL}/${order.prescriptionURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#00B9F1] hover:text-[#009AD6] font-medium"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            View Prescription
                          </a>
                        </div>
                      ) : null}
                      {order.medicines.map((m, i) => (
                        <div key={i}>
                          {m.name} × {m.quantity}
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-[#0F4FA8]">
                      ₹{order.totalAmount}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {formatDate(order.orderDate)}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#00B9F1] outline-none"
                      >
                        {Object.keys(statusConfig).map((s) => (
                          <option key={s} value={s}>
                            {statusConfig[s as OrderStatus].label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-500 hover:text-[#00B9F1] hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleUpdate(order)}
                          disabled={updatingId === order.id}
                          className="px-4 py-2 text-sm rounded-lg bg-[#00B9F1] text-white hover:bg-[#009AD6] shadow disabled:opacity-50"
                        >
                          {updatingId === order.id
                            ? "Updating..."
                            : "Update"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-sm text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 font-medium">
            Showing {filteredOrders.length} orders
          </div>
        )}

        {/* ORDER DETAILS MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-[#002E6E] px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Order Details #{selectedOrder.orderNumber}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrint}
                    className="text-white/80 hover:text-white transition flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
                    title="Print Invoice"
                  >
                    <Printer size={18} />
                    <span className="text-sm font-medium">Print</span>
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Assign Button or Agent Info */}
                {selectedOrder.deliveryAgent ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full text-[#002E6E]">
                        <Truck size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#002E6E]">Delivery Agent Assigned</h4>
                        <p className="text-sm text-gray-700 font-medium">{selectedOrder.deliveryAgent.name}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>📞 {selectedOrder.deliveryAgent.phone}</span>
                          <span>🛵 {selectedOrder.deliveryAgent.vehicleNumber}</span>
                        </div>
                        
                        {selectedOrder.status !== "out_for_delivery" && selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                          <button
                            onClick={handleUnassign}
                            className="mt-3 text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                          >
                            Remove Agent
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        fetchAgents();
                        setShowAssignModal(true);
                      }}
                      className="flex items-center gap-2 bg-[#002E6E] text-white px-4 py-2 rounded-lg hover:bg-[#0043A4]"
                    >
                      <Truck size={18} /> Assign Delivery Agent
                    </button>
                  </div>
                )}

                {/* Customer Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer</h3>
                    <p className="text-lg font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-gray-600">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Order Info</h3>
                    <p className="text-gray-900"><span className="font-medium">Date:</span> {formatDate(selectedOrder.orderDate)}</p>
                    <p className="text-gray-900"><span className="font-medium">Status:</span> <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[selectedOrder.status].color}`}>{statusConfig[selectedOrder.status].label}</span></p>
                  </div>
                </div>

                {/* Delivery & Payment */}
                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedOrder.deliveryAddress || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Details</h3>
                    <p className="text-gray-700 text-sm"><span className="font-medium">Method:</span> {selectedOrder.paymentMethod || "N/A"}</p>
                    <p className="text-gray-700 text-sm"><span className="font-medium">Total:</span> <span className="text-[#0F4FA8] font-bold text-lg">₹{selectedOrder.totalAmount}</span></p>
                  </div>
                </div>

                {/* Medicines */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items Ordered</h3>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                          <th className="px-4 py-3">Medicine</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedOrder.medicines.map((m, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-gray-900">{m.name}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{m.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGN AGENT MODAL */}
        {showAssignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Select Delivery Agent</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {agents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No online agents available</p>
                ) : (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssign(agent.id)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded border flex justify-between"
                    >
                      <span className="font-medium">{agent.user.firstName} {agent.user.lastName}</span>
                      <span className="text-sm text-gray-500">{agent.status}</span>
                    </button>
                  ))
                )}
              </div>
              <button onClick={() => setShowAssignModal(false)} className="mt-4 w-full py-2 text-gray-500">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}