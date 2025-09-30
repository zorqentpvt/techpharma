import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock user data (similar to your structure)
const getUserFromStorage = () => {
  // For demo purposes, returning a pharmacy user
  return { username: "Central Pharmacy", role: "pharmacy" };
};

// Order status type
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

// Order interface
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  medicines: { name: string; quantity: number }[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  pharmacy: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Rajesh Kumar",
    customerPhone: "+91 98765 43210",
    medicines: [
      { name: "Paracetamol 500mg", quantity: 2 },
      { name: "Cough Syrup", quantity: 1 },
    ],
    totalAmount: 250,
    status: "pending",
    orderDate: "2025-09-29T10:30:00",
    pharmacy: "Central Pharmacy",
  },
  {
    id: "ORD-002",
    customerName: "Priya Sharma",
    customerPhone: "+91 98765 43211",
    medicines: [{ name: "Amoxicillin 250mg", quantity: 1 }],
    totalAmount: 180,
    status: "confirmed",
    orderDate: "2025-09-29T09:15:00",
    pharmacy: "Central Pharmacy",
  },
  {
    id: "ORD-003",
    customerName: "Amit Patel",
    customerPhone: "+91 98765 43212",
    medicines: [
      { name: "Vitamin D3", quantity: 1 },
      { name: "Calcium Tablets", quantity: 1 },
    ],
    totalAmount: 450,
    status: "preparing",
    orderDate: "2025-09-29T08:45:00",
    pharmacy: "Central Pharmacy",
  },
  {
    id: "ORD-004",
    customerName: "Sneha Reddy",
    customerPhone: "+91 98765 43213",
    medicines: [{ name: "Ibuprofen 400mg", quantity: 3 }],
    totalAmount: 320,
    status: "ready",
    orderDate: "2025-09-28T16:20:00",
    pharmacy: "Central Pharmacy",
  },
  {
    id: "ORD-005",
    customerName: "Vikram Singh",
    customerPhone: "+91 98765 43214",
    medicines: [
      { name: "Aspirin 75mg", quantity: 2 },
      { name: "Antacid Tablets", quantity: 1 },
    ],
    totalAmount: 290,
    status: "completed",
    orderDate: "2025-09-28T14:10:00",
    pharmacy: "Central Pharmacy",
  },
];

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; next?: OrderStatus }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    next: "confirmed",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    next: "preparing",
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-100 text-purple-800",
    next: "ready",
  },
  ready: {
    label: "Ready for Pickup",
    color: "bg-green-100 text-green-800",
    next: "completed",
  },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function Orders() {
  const navigate = useNavigate();
  const [user] = useState(getUserFromStorage());
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    if (!user || user.role !== "pharmacy") {
      // navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search);

    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Order Management
          </h1>
          <div className="text-sm text-gray-600">{user?.username}</div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                "all",
                "pending",
                "confirmed",
                "preparing",
                "ready",
                "completed",
              ] as (OrderStatus | "all")[]
            ).map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setFilterStatus(statusKey)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filterStatus === statusKey
                    ? statusKey === "pending"
                      ? "bg-yellow-600 text-white"
                      : statusKey === "confirmed"
                      ? "bg-blue-600 text-white"
                      : statusKey === "preparing"
                      ? "bg-purple-600 text-white"
                      : statusKey === "ready"
                      ? "bg-green-600 text-white"
                      : statusKey === "completed"
                      ? "bg-gray-600 text-white"
                      : "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {statusKey === "all"
                  ? `All Orders (${statusCounts.all})`
                  : `${statusConfig[statusKey].label} (${
                      statusCounts[statusKey as keyof typeof statusCounts]
                    })`}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              className="w-full border border-gray-300 px-4 py-2 pl-10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.medicines.map((med, idx) => (
                          <div key={idx} className="text-xs">
                            {med.name} × {med.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}
                      >
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.keys(statusConfig).map((statusKey) => (
                          <option key={statusKey} value={statusKey}>
                            {statusConfig[statusKey as OrderStatus].label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </div>
        )}
      </div>
    </div>
  );
}
