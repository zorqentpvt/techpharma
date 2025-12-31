import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  FaUserCircle,
  FaHome,
  FaPills,
  FaUserMd,
  FaCalendarAlt,
  FaComments,
  FaStore,
  FaClipboardList,
  FaClipboardCheck,
  FaShoppingCart,
  FaSignOutAlt,
} from "react-icons/fa";
import { ChevronLeft, Menu } from "lucide-react";
import React from "react";
import Home from "./Home";
import { fetchUserOrders } from "../api/medapir";
import { fetchprofit } from "../api/pharmastoreapi";

const getUserFromStorage = () => {
  const stored = localStorage.getItem("user");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error("Failed to parse user from localStorage:", err);
    return null;
  }
};

const tabIcons = {
  home: FaHome,
  medicine: FaPills,
  doctor: FaUserMd,
  schedule: FaCalendarAlt,
  consult: FaComments,
  chatbot: FaComments,
  store: FaStore,
  orders: FaClipboardList,
  appointments: FaClipboardCheck,
  cart: FaShoppingCart,
  profile: FaUserCircle,
  logout: FaSignOutAlt,
  pay: FaShoppingCart,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getUserFromStorage());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);


useEffect(() => {
  const loadData = async () => {
    console.log("Fetching user data...", user.role);

    if (user?.role === "pharmacy") {
      const profit = await fetchprofit();
      console.log("Profit Data:", profit);
    } else if (user?.role === "normal") {
      const myorder = await fetchUserOrders();
      console.log("My Orders Data:", myorder);
    }
  };

  loadData();
}, [user]);



  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  if (!user) return null;

  const tabs = [
    { key: "home", label: "Home", path: "/dashboard", roles: ["normal", "doctor", "pharmacy"] },
    { key: "medicine", label: "Medicine", path: "/dashboard/medicine", roles: ["normal"] },
    { key: "doctor", label: "Doctors", path: "/dashboard/doctor", roles: ["normal"] },
    { key: "schedule", label: "Schedule", path: "/dashboard/schedule", roles: ["doctor"] },
    { key: "consult", label: "Consultings", path: "/dashboard/consult", roles: ["normal", "doctor"] },
    { key: "chatbot", label: "Chatbot", path: "/dashboard/chatbot", roles: ["normal"] },
    { key: "store", label: "Store", path: "/dashboard/store", roles: ["pharmacy"] },
    { key: "orders", label: "Orders", path: "/dashboard/orders", roles: ["pharmacy"] },
    { key: "logout", label: "Logout", path: "/logout", roles: ["normal", "doctor", "pharmacy"] },
  ];

  const renderNavLinks = () =>
    tabs
      .filter((tab) => tab.roles.includes(user.role))
      .map((tab) => {
        const Icon = tabIcons[tab.key];
        const isActive = location.pathname === tab.path;

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === "logout") handleLogout();
              else navigate(tab.path);
              setMobileMenuOpen(false);
            }}
            className={`relative flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-300
              ${isActive ? "bg-[#002E6E] text-white shadow-lg" : "text-gray-700 hover:bg-[#0043A4] hover:text-white"} 
              ${collapsed ? "justify-center p-3" : ""}`}
          >
            <Icon size={collapsed ? 28 : 20} />
            {!collapsed && <span>{tab.label}</span>}
          </button>
        );
      });

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-gradient-to-r from-gray-50 via-blue-100 to-blue-50 relative overflow-hidden">
      {/* Mobile Navbar */}
      <header className="lg:hidden flex items-center justify-between bg-white shadow-md px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={26} className="text-[#002E6E]" />
          </button>
          <h1 className="text-xl font-bold text-[#002E6E]">Dashboard</h1>
        </div>
        <FaUserCircle size={30} className="text-[#002E6E]" onClick={() => navigate("/dashboard/profile")} />
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed z-30 top-0 left-0 h-screen bg-white shadow-2xl p-4 rounded-tr-3xl lg:rounded-br-3xl transition-transform duration-300
          ${collapsed ? "w-24" : "w-64"} 
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:static lg:translate-x-0 lg:flex lg:flex-col flex flex-col`}
      >
        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center justify-center mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600 hover:text-blue-600 transition transform hover:scale-110"
          >
            {collapsed ? <Menu size={28} /> : <ChevronLeft size={28} />}
          </button>
        </div>

        {/* Profile */}
        <div
          className={`flex items-center gap-3 p-3 mb-6 cursor-pointer rounded-xl hover:bg-blue-50 transition ${collapsed ? "justify-center" : ""}`}
          onClick={() => {
            navigate("/dashboard/profile");
            setMobileMenuOpen(false);
          }}
        >
          <FaUserCircle size={40} className="text-[#002E6E]" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-700">{user.name || "User"}</span>
              <span className="text-sm text-gray-500 capitalize">{user.role}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-4 overflow-y-auto">{renderNavLinks()}</nav>
      </aside>

      {/* Overlay (mobile only) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6 z-10 relative overflow-y-auto">
        
          {location.pathname === "/dashboard" ? <Home /> : <Outlet />}
       
      </main>
    </div>
  );
}