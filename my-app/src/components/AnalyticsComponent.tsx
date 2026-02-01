import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type AnalyticsProps = {
  totalOrders: number;
  totalRevenue: number;
  currency?: string;
};

const AnalyticsComponent: React.FC<AnalyticsProps> = ({
  totalOrders,
  totalRevenue,
  currency = "USD",
}) => {

  // Build chart data dynamically
  const data = useMemo(() => ({
    labels: ["Total Orders", "Total Revenue"],
    datasets: [
      {
        label: "Totals",
        data: [totalOrders, totalRevenue],
        backgroundColor: ["#2563eb", "#22c55e"], // blue and green
      },
    ],
  }), [totalOrders, totalRevenue]);

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="flex flex-col bg-white shadow-md rounded-xl">
      <header className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-800">Analytics Overview</h2>
      </header>

      <div className="px-4 py-3 grid grid-cols-2 gap-6">
        <div>
          <p className="text-3xl font-bold">{totalOrders}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>
        <div>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalRevenue)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Bar data={data} options={options} height={140} />
      </div>
    </div>
  );
};

export default AnalyticsComponent;
