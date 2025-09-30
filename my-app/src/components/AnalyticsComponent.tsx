import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type AnalyticsProps = {
  totalOrders: number;
  totalRevenue: number;
  currency?: string;
  labels?: string[];
  orderTrend?: number[];
  revenueTrend?: number[];
};

const AnalyticsComponent: React.FC<AnalyticsProps> = ({
  totalOrders,
  totalRevenue,
  currency = "USD",
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  orderTrend = [100, 200, 150, 250, 300, 400],
  revenueTrend = [500, 800, 600, 1000, 1200, 1400],
}) => {
  const data = {
    labels,
    datasets: [
      {
        label: "Orders",
        data: orderTrend,
        borderColor: "#6366f1", // indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Revenue",
        data: revenueTrend,
        borderColor: "#22c55e", // green-500
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" as const },
    },
  };

  return (
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-md rounded-xl">
      <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">
          Analytics Overview
        </h2>
      </header>

      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Total Orders */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {totalOrders}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Orders
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
              }).format(totalRevenue)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Earned Revenue
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pb-5">
        <Line data={data} options={options} height={300} />
      </div>
    </div>
  );
};

export default AnalyticsComponent;
