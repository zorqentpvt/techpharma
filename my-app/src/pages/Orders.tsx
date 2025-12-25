import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOrders, updateOrderStatus } from "../api/pharmastoreapi";

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
  | "completed"
  | "cancelled";

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

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparing", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Ready for Pickup", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

/* ---------------- COMPONENT ---------------- */
export default function Orders() {
  const navigate = useNavigate();
  const [user] = useState(getUserFromStorage());

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    const loadOrders = async () => {
      const res = await fetchOrders();
      if (res?.success) setOrders(res.data);
    };
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

  /* ---------------- UPDATE API ---------------- */
  const handleUpdate = async (order: Order) => {
    setUpdatingId(order.id);

    // API only supports these
    const apiStatus =
      order.status === "completed"
        ? "completed"
        : order.status === "cancelled"
        ? "cancelled"
        : "pending";

    const res = await updateOrderStatus(order.id, apiStatus);

    if (!res?.success) {
      alert(res?.message || "Failed to update order");
    }

    setUpdatingId(null);
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
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search);

    const matchStatus =
      filterStatus === "all" || order.status === filterStatus;

    return matchSearch && matchStatus;
  });

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Order Management
          </h1>
          <span className="text-sm text-gray-600">
            {user.username}
          </span>
        </div>

        {/* SEARCH */}
        <input
          className="w-full mb-4 border px-4 py-2 rounded-md text-sm"
          placeholder="Search by order ID, name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* TABLE */}
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="min-w-[900px] w-full divide-y">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Medicines</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Update</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {order.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {order.medicines.map((m, i) => (
                        <div key={i}>
                          {m.name} × {m.quantity}
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-sm">
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
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {Object.keys(statusConfig).map((s) => (
                          <option key={s} value={s}>
                            {statusConfig[s as OrderStatus].label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUpdate(order)}
                        disabled={updatingId === order.id}
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingId === order.id
                          ? "Updating..."
                          : "Update"}
                      </button>
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
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredOrders.length} orders
          </div>
        )}
      </div>
    </div>
  );
}
