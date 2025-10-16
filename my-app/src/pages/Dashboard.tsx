import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Store from "./Store";
import Appointments from "./Appointments";
import Home from "./Home";
import Doctors from "./Doctors";
import Schedule from "./Schedule";
import Orders from "./Orders";
import Medicines from "./Medicines";
import Consultings from "./Consultings";
import Cart from "./Cart";
import ChatbotInterface from "./ChatbotInterface";
import ProfilePage from "./Profile";
import {
  FaUserCircle,
  FaBars,
  FaChevronLeft,
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
import React from "react";
import { ChevronLeft, Menu } from "lucide-react";

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
  Medicine: FaPills,
  doctor: FaUserMd,
  schedule: FaCalendarAlt,
  consultings: FaComments,
  chatbot: FaComments,
  store: FaStore,
  "Order management": FaClipboardList,
  appointments: FaClipboardCheck,
  cart: FaShoppingCart,
  Profile: FaUserCircle,
  logout: FaSignOutAlt,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromStorage());
  const [activeTab, setActiveTab] = useState("home");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  if (!user) return null;

  const tabs = [
    { key: "home", label: "Home", roles: ["normal", "doctor", "pharmacy"] },
    { key: "Medicine", label: "Medicine", roles: ["normal"] },
    { key: "doctor", label: "Doctors", roles: ["normal"] },
    { key: "schedule", label: "Schedule", roles: ["doctor"] },
    { key: "consultings", label: "Consultings", roles: ["doctor", "normal"] },
    { key: "chatbot", label: "Chatbot", roles: ["normal"] },
    { key: "store", label: "Store", roles: ["pharmacy"] },
    { key: "Order management", label: "Order management", roles: ["pharmacy"] },
    { key: "appointments", label: "Appointments", roles: ["doctor"] },
    { key: "logout", label: "logout", roles: ["normal", "doctor", "pharmacy"] },
    { key: "cart", label: "cart", roles: [] },

  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return <ProfilePage />;
        case "cart":
          return <Cart/>;
      case "home":
        return <Home />;
      case "doctor":
        return user.role === "normal" ? <Doctors /> : <div>Access Denied</div>;
      case "chatbot":
        return user.role === "normal" ? <ChatbotInterface /> : <div>Access Denied</div>;
      case "Medicine":
        return user.role === "normal" ? <Medicines setActiveTab={setActiveTab} /> : <div>Access Denied</div>;
      case "store":
        return user.role === "pharmacy" ? <Store /> : <div>Access Denied</div>;
      case "consultings":
        return ["doctor", "normal"].includes(user.role) ? <Consultings /> : <div>🚫 Access Denied</div>;
      case "appointments":
        return user.role === "doctor" ? <Appointments /> : <div>Access Denied</div>;
      case "schedule":
        return user.role === "doctor" ? <Schedule /> : <div>Access Denied</div>;
      case "Order management":
        return user.role === "pharmacy" ? <Orders /> : <div>Access Denied</div>;
      case "logout":
        handleLogout();
        return null;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-gray-50 via-blue-100 to-blue-50">
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white shadow-2xl p-4 rounded-tr-3xl rounded-br-3xl transition-all duration-300
        ${collapsed ? "w-28" : "w-68"}`}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600 hover:text-blue-600 transition transform hover:scale-110"
          >
            {collapsed ? <Menu size={32} /> : <ChevronLeft size={32} />}
          </button>
        </div>

        {/* Profile */}
        <div
          className={`flex items-center gap-3 p-3 mb-6 cursor-pointer rounded-xl hover:bg-blue-50 transition ${collapsed ? "justify-center" : ""
            }`}
          onClick={() => setActiveTab("Profile")}
        >
          <FaUserCircle size={40} className="text-[#002E6E]" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-700">{user.name || "User"}</span>
              <span className="text-sm text-gray-500 capitalize">{user.role}</span>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-8 flex-1">
  {tabs
    .filter((tab) => tab.roles.includes(user.role))
    .map((tab) => {
      const Icon = tabIcons[tab.key];
      const isActive = activeTab === tab.key;
      return (
        <button
          key={tab.key}
          className={`relative flex items-center gap-3 text-left px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${isActive ? "bg-[#002E6E] text-white shadow-lg" : "text-gray-700 hover:bg-[#0043A4] group"} 
            ${collapsed ? "justify-center p-3" : ""}`}
          onClick={() => setActiveTab(tab.key)}
        >
          <Icon
            size={collapsed ? 28 : 20}
            className={`transition-transform duration-300 
              ${isActive ? "text-white" : "text-gray-700 group-hover:text-white"} 
              group-hover:scale-125`}
          />
          {collapsed ? (
            <span className="absolute left-20 bg-white shadow-md rounded-md px-2 py-1 text-gray-700 whitespace-nowrap 
              opacity-0 group-hover:opacity-100 group-hover:left-12 group-hover:text-white transition-all duration-300">
              {tab.label}
            </span>
          ) : (
            <span className={`group-hover:text-white transition-colors`}>
              {tab.label}
            </span>
          )}
        </button>
      );
    })}
</nav>



      </aside>

      {/* Main content */}
      <main className="flex-1 lg:p-5">
        <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[80vh]">{renderContent()}</div>
      </main>
    </div>
  );
}
