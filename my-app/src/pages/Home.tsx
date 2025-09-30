import { useNavigate } from "react-router-dom";
import AnalyticsComponent from "../components/AnalyticsComponent";
import React from "react";

interface User {
  username: string;
  role: string;
}

export default function Home() {
  const navigate = useNavigate();
  const user: User = JSON.parse(localStorage.getItem("user") || "{}");
  console.log(user);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
          Welcome, {user.username}
        </h1>
      </header>

      {/* Analytics for pharmacy users */}
      {user.role === "pharmacy" && (
        <div className="p-6">
          <AnalyticsComponent
            totalOrders={1250}
            totalRevenue={48000}
            currency="USD"
            labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
            orderTrend={[100, 200, 150, 250, 300, 400]}
            revenueTrend={[500, 800, 600, 1000, 1200, 1400]}
          />
        </div>
      )}

      {/* Cart Button */}


    </div>
  );
}
