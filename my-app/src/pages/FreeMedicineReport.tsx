import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOrders } from "../api/pharmastoreapi";
import { Printer, FileText } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  medicines: { id: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  orderDate: string;
  isFreeMedicineOrder: boolean;
  eligibilityVerification?: {
    schemeType: string;
    documentType: string;
    documentNumber: string;
  };
}

export default function FreeMedicineReport() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      if (res?.success) {
        // Filter for completed free medicine orders
        const completedFreeOrders = res.data.filter(
          (o: any) => 
            o.isFreeMedicineOrder && 
            (o.status === "completed" || o.status === "delivered")
        );
        setOrders(completedFreeOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("userdata");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (!parsed.pharmacy?.isFreeMedicineEnabled) {
        alert("Not authorized for Government Reports");
        navigate("/dashboard");
        return;
      }
    }
    loadData();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (!o.orderDate.startsWith(monthFilter)) {
      return false;
    }
    return true;
  });

  const totalRefundAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Government Refund Report - ${monthFilter}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1, h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          .amount { text-align: right; }
          .footer { margin-top: 30px; text-align: right; font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <h1>Free Medicine Scheme - Monthly Refund Report</h1>
        <h2>Period: ${monthFilter}</h2>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order ID</th>
              <th>Patient Name</th>
              <th>Scheme / Doc No.</th>
              <th>Items</th>
              <th class="amount">Claim Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(o => `
              <tr>
                <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                <td>${o.orderNumber}</td>
                <td>${o.customerName}</td>
                <td>
                  ${o.eligibilityVerification?.schemeType.replace(/_/g, " ") || "N/A"}<br/>
                  <small>${o.eligibilityVerification?.documentNumber || ""}</small>
                </td>
                <td>${o.medicines.map(m => `${m.name} x${m.quantity} (₹${(m.price * m.quantity).toFixed(2)})`).join(", ")}</td>
                <td class="amount">${o.totalAmount.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          Total Refund Claim: ₹${totalRefundAmount.toFixed(2)}
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#002E6E] flex items-center gap-2">
              <FileText /> Government Refund Reports
            </h1>
            <p className="text-gray-500">Generate reports for completed free medicine orders</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 bg-[#002E6E] text-white px-4 py-2 rounded-lg hover:bg-[#0043A4] disabled:opacity-50"
          >
            <Printer size={18} /> Print Report
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label htmlFor="month-filter" className="font-medium text-gray-700">Select Month:</label>
              <input
                id="month-filter"
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{filteredOrders.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Refund Claim</p>
              <p className="text-2xl font-bold text-green-600">₹{totalRefundAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Order Date</th>
                <th className="p-4 font-semibold">Order #</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Scheme Details</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading data...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No completed free orders found for this month.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-blue-600">{order.orderNumber}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-400">
                        {order.medicines.map(m => `${m.name} x${m.quantity} (₹${(m.price * m.quantity).toFixed(2)})`).join(", ")}
                      </div>
                    </td>
                    <td className="p-4">
                      {order.eligibilityVerification ? (
                        <div>
                          <div className="text-sm capitalize">{order.eligibilityVerification.schemeType.replace(/_/g, " ")}</div>
                          <div className="text-xs text-gray-500 font-mono">{order.eligibilityVerification.documentNumber}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-green-700">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}