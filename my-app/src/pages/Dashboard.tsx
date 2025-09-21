import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

// Pages
import Store from "./Store";
import Appointments from "./Appointments";
import Home from "./Home";
import Doctors from "./Doctors";
import Schedule  from "./schedule";

// Utility to get user from localStorage
const getUserFromStorage = () => {
  const stored = localStorage.getItem("user");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error("Failed to parse user from localStorage:", err);
    return null;
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromStorage());
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (!user) {
      console.log("[Dashboard] No user found, redirecting to login...");
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  if (!user) return null;

  const tabs = [
    { key: "home", label: "Home", roles: ["normal", "doctor", "pharmacy"], icon: "" },
    { key: "doctor", label: "Doctors", roles: ["normal"], icon: "" },
    { key: "schedule", label: "Schedule", roles: ["doctor"], icon: "" },
    { key: "consultings", label: "Consultings and Report", roles: ["doctor"], icon: "" },
    { key: "consult", label: "Consultation", roles: ["normal"], icon: "" },
    { key: "chatbot", label: "Chatbot", roles: ["normal"], icon: "" },
    { key: "store", label: "Store", roles: ["pharmacy"], icon: "" },
    { key: "delivery", label: "Delivery", roles: ["pharmacy"], icon: "" },
    { key: "appointments", label: "Appointments", roles: ["doctor"], icon: "" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "doctor":
        return user.role === "normal" ? <Doctors /> : <div>Access Denied</div>;
      case "store":
        return user.role === "pharmacy" ? <Store /> : <div>Access Denied</div>;
      case "appointments":
        return user.role === "doctor" ? <Appointments /> : <div>Access Denied</div>;
      case "schedule":
        return user.role === "doctor" ? <Schedule /> : <div>Access Denied</div>;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-gray-50 via-blue-100 to-blue-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-blue-50 shadow-2xl p-6">
        <h2 className="text-2xl font-extrabold mb-8 text-indigo-800">Dashboard</h2>

        {/* Nav Links */}
        <nav className="flex flex-col gap-3 flex-1">
          {tabs
            .filter((tab) => tab.roles.includes(user.role))
            .map((tab) => (
              <button
                key={tab.key}
                className={`flex items-center gap-3 text-left px-4 py-2 rounded-lg font-medium transition-all
                  ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
        </nav>

        {/* Logout at bottom */}
        <div className="mt-8">
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
          >
             Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[80vh]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
