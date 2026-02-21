import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// MUI Components
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

// Custom Components
import AnalyticsComponent from "../components/AnalyticsComponent";
import MedicineReminder from "../components/MedicineReminder";

// API Functions
import { getUserStats } from "../api/adminapi";
import { fetchUserOrders } from "../api/medapir";
import { fetchprofit } from "../api/pharmastoreapi";
import { fetchConsultations, getdocstat } from "../api/docApi";

// ==================== TYPES ====================
interface User {
  username: string;
  role: "admin" | "doctor" | "pharmacy" | "normal";
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  repeatDays: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderItems: Array<{
    medicine: {
      name: string;
    };
  }>;
  payment: {
    amount: number;
  };
}

interface AdminStats {
  activeDoctors: number;
  inactiveDoctors: number;
  activePharmacies: number;
  inactivePharmacies: number;
  totalUsers: number;
}

interface Appointment {
  id: string;
  patientName: string;
  startTime: string;
}

// ==================== CONSTANTS ====================
const HEALTH_TIPS = [
  "Stay hydrated! Drink at least 8 glasses of water a day.",
  "Get at least 7–8 hours of sleep for better recovery.",
  "Take short breaks when working or studying to rest your eyes.",
  "Eat more fruits and vegetables for essential nutrients.",
  "Exercise at least 30 minutes a day to stay active.",
];

const ROLE_BACKGROUNDS: Record<string, string> = {
  admin: "/images/admin.jpg",
  doctor: "/images/doc.jpg",
  pharmacy: "/images/pharma1.png",
  normal: "/images/user.png",
};

const TIP_CHANGE_INTERVAL = 4000; // 4 seconds
const INITIAL_VISIBLE_ORDERS = 1;
const LOAD_MORE_COUNT = 3;

// ==================== HELPER FUNCTIONS ====================
const getStoredReminders = (): Reminder[] => {
  const stored = localStorage.getItem("reminders");
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((r: any) => ({
      id: r.id,
      title: r.title || "",
      date: r.date || "",
      time: r.time || "",
      repeatDays: Array.isArray(r.repeatDays) ? r.repeatDays : [],
    }));
  } catch (error) {
    console.error("Error parsing reminders:", error);
    return [];
  }
};

const getStoredUser = (): User => {
  const stored = localStorage.getItem("user");
  try {
    return stored ? JSON.parse(stored) : { username: "", role: "normal" };
  } catch (error) {
    console.error("Error parsing user:", error);
    return { username: "", role: "normal" };
  }
};

// ==================== MAIN COMPONENT ====================
export default function Home() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // ===== Admin State =====
  const [adminStats, setAdminStats] = useState<AdminStats>({
    activeDoctors: 0,
    inactiveDoctors: 0,
    activePharmacies: 0,
    inactivePharmacies: 0,
    totalUsers: 0,
  });

  // ===== Pharmacy State =====
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // ===== Doctor State =====
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);

  // ===== Normal User State =====
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [visibleOrderCount, setVisibleOrderCount] = useState(INITIAL_VISIBLE_ORDERS);

  // ===== UI State =====
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showHealthTips, setShowHealthTips] = useState(true);
  const [showWellness, setShowWellness] = useState(false);

  // ===== Reminders State =====
  const [reminders, setReminders] = useState<Reminder[]>(getStoredReminders);

  // ==================== EFFECTS ====================

  // Health Tips Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, TIP_CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Load Role-Specific Data
  useEffect(() => {
    if (!user?.role) return;

    const loadData = async () => {
      try {
        switch (user.role) {
          case "admin":
            await loadAdminData();
            break;
          case "pharmacy":
            await loadPharmacyData();
            break;
          case "doctor":
            await loadDoctorData();
            break;
          case "normal":
            await loadUserData();
            break;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();
  }, [user?.role]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadAdminData = async () => {
    try {
      const stats = await getUserStats();
      setAdminStats(stats);
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    }
  };

  const loadPharmacyData = async () => {
    try {
      const profitData = await fetchprofit();
      setTotalRevenue(profitData.data.totalRevenue || 0);
      setTotalOrders(profitData.data.totalOrders || 0);
    } catch (error) {
      console.error("Failed to load pharmacy data:", error);
    }
  };

  const loadDoctorData = async () => {
    try {
      const docStats = await getdocstat();
      const {
        upcomingAppointments = [],
        totalPatientsCount = 0,
        todayAppointmentsCount = 0,
      } = docStats.data;

      setUpcomingAppointments(upcomingAppointments);
      setTotalPatients(totalPatientsCount);
      setTodayAppointments(todayAppointmentsCount);
    } catch (error) {
      console.error("Failed to load doctor data:", error);
    }
  };

  const loadUserData = async () => {
    try {
      const ordersData = await fetchUserOrders();
      const sorted = [...ordersData.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUserOrders(sorted);
      setVisibleOrderCount(INITIAL_VISIBLE_ORDERS);
    } catch (error) {
      console.error("Failed to load user orders:", error);
    }
  };

  // ==================== EVENT HANDLERS ====================

  const handleViewMoreOrders = useCallback(() => {
    setVisibleOrderCount((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  // ==================== RENDER FUNCTIONS ====================

  const renderPharmacyDashboard = () => (
    <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-6 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-[#084377] mb-4">
        Business Analytics
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-[#084377]">{totalOrders}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      <AnalyticsComponent
        totalOrders={totalOrders}
        totalRevenue={totalRevenue}
        currency="INR"
      />
    </div>
  );

  const renderDoctorDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Upcoming Appointments */}
      <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">
          Upcoming Appointments
        </h2>
        {upcomingAppointments.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <li key={appointment.id} className="py-3 flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  {appointment.patientName}
                </span>
                <span className="text-gray-500 text-sm">
                  {new Date(appointment.startTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No upcoming appointments</p>
        )}
      </div>

      {/* Patient Overview */}
      <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold text-[#0f4c81] mb-4">
          Patient Overview
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="text-gray-700">Total Patients</span>
            <span className="font-semibold text-[#0f4c81] text-lg">
              {totalPatients}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-gray-700">Today's Appointments</span>
            <span className="font-semibold text-green-600 text-lg">
              {todayAppointments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNormalUserDashboard = () => {
    const visibleOrders = userOrders.slice(0, visibleOrderCount);
    const hasMoreOrders = visibleOrderCount < userOrders.length;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Health Tips */}
        {showHealthTips && (
          <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#0f4c81] mb-3 flex items-center gap-2">
                  💡 Daily Health Tip
                </h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-gray-700 leading-relaxed text-lg"
                  >
                    {HEALTH_TIPS[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm text-gray-500 mt-3">
                  Source: World Health Organization
                </p>
              </div>
              <img
                src="https://cdn-icons-png.flaticon.com/512/2966/2966481.png"
                alt="Health tip icon"
                className="w-24 h-24 object-contain"
              />
            </div>
          </div>
        )}

        {/* Orders Section */}
        {userOrders.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <h2 className="text-2xl font-bold text-[#0f4c81] mb-6 flex items-center gap-2">
              📦 Your Orders
            </h2>
            
            <div className="space-y-4">
              {visibleOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {order.orderItems[0]?.medicine.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold text-[#0f4c81]">
                      ₹{order.payment.amount}
                    </p>
                    <p className="text-xs text-gray-500">{order.orderNumber}</p>
                    <button
                      onClick={() => navigate(`/dashboard/track/${order.id}`)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition font-medium"
                    >
                      Track Order
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMoreOrders && (
              <button
                onClick={handleViewMoreOrders}
                className="mt-6 w-full py-3 text-[#0f4c81] font-semibold hover:bg-blue-50 rounded-lg transition-colors"
              >
                View More Orders →
              </button>
            )}
          </div>
        )}

        {/* Wellness Goals (Optional) */}
        {showWellness && (
          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-[#0f4c81]/10 text-[#0f4c81] w-12 h-12 flex items-center justify-center rounded-full text-2xl">
                  🧘
                </div>
                <div>
                  <h3 className="font-bold text-[#0f4c81] text-xl">Wellness Goals</h3>
                  <p className="text-gray-600 mt-1">Goal: Walk 6,000 steps daily</p>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: "72%" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">4,320/6,000</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="text-[#0f4c81] font-semibold hover:underline">
                Update Goals →
              </button>
            </div>
          </div>
        )}

        {/* Medicine Reminder */}
        <MedicineReminder />
      </div>
    );
  };

  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-blue-50/50 rounded-2xl p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-3xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-[#0f4c81] flex items-center gap-2">
            🎯 Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            System-wide user and service statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active Doctors */}
          <StatCard
            icon="✅"
            label="Active Doctors"
            value={adminStats.activeDoctors}
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />

          {/* Inactive Doctors */}
          <StatCard
            icon="⏸️"
            label="Inactive Doctors"
            value={adminStats.inactiveDoctors}
            bgColor="bg-red-100"
            iconColor="text-red-600"
          />

          {/* Active Pharmacies */}
          <StatCard
            icon="✅"
            label="Active Pharmacies"
            value={adminStats.activePharmacies}
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />

          {/* Inactive Pharmacies */}
          <StatCard
            icon="⏸️"
            label="Inactive Pharmacies"
            value={adminStats.inactivePharmacies}
            bgColor="bg-red-100"
            iconColor="text-red-600"
          />

          {/* Total Users */}
          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8 flex items-center gap-4 border-2 border-[#0f4c81] sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] text-2xl">
              👥
            </div>
            <div>
              <h3 className="text-gray-600 font-medium">Total Users</h3>
              <p className="text-3xl font-bold text-[#0f4c81]">
                {adminStats.totalUsers}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Banner */}
      <div className="w-full aspect-[3.5/0.8] overflow-hidden shadow-md">
        <img
          src={ROLE_BACKGROUNDS[user.role] || ROLE_BACKGROUNDS.normal}
          alt={`${user.role} dashboard banner`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto pt-6 pb-10 px-6">
        {user.role === "pharmacy" && renderPharmacyDashboard()}
        {user.role === "doctor" && renderDoctorDashboard()}
        {user.role === "normal" && renderNormalUserDashboard()}
        {user.role === "admin" && renderAdminDashboard()}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, bgColor, iconColor }) => (
  <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all p-8 flex items-center gap-4">
    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${bgColor} ${iconColor} text-xl`}>
      {icon}
    </div>
    <div>
      <h3 className="text-gray-600 font-medium">{label}</h3>
      <p className="text-3xl font-bold text-[#0f4c81]">{value}</p>
    </div>
  </div>
);