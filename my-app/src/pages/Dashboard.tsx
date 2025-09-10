import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

// Pages
import Store from "./Store";
import Appointments from "./Appointments";
import Home from "./Home";
import Doctors from "./Doctors";

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

  // Debug logs
  useEffect(() => {
    console.log("[Dashboard] User state changed:", user);
    if (!user) {
      console.log("[Dashboard] No user found, redirecting to login...");
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    console.log("[Dashboard] Logging out user:", user);
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  if (!user) return null; // Avoid rendering if user is null

  const tabs = [
    { key: "home", label: "Home", roles: ["normal", "doctor", "pharmacy"] },
    { key: "doctor", label: "Doctors", roles: ["normal"] },
    { key: "store", label: "Store 🏪", roles: ["pharmacy"] },
    { key: "appointments", label: "Appointments 📅", roles: ["doctor"] },
  ];

  const renderContent = () => {
    console.log("[Dashboard] Rendering content for tab:", activeTab);

    switch (activeTab) {
      case "home":
        return <Home />;
      case "doctor":
        return user.role === "normal" ? <Doctors /> : <div>Access Denied</div>;
      case "store":
        return user.role === "pharmacy" ? <Store /> : <div>Access Denied</div>;
      case "appointments":
        return user.role === "doctor" ? <Appointments /> : <div>Access Denied</div>;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-purple-700">Dashboard</h2>
        <nav className="flex flex-col gap-4">
          {tabs
            .filter((tab) => tab.roles.includes(user.role))
            .map((tab) => (
              <button
                key={tab.key}
                className={`text-left p-2 rounded font-semibold ${
                  activeTab === tab.key ? "bg-purple-100" : ""
                }`}
                onClick={() => {
                  console.log(`[Dashboard] Switching tab to: ${tab.key}`);
                  setActiveTab(tab.key);
                }}
              >
                {tab.label}
              </button>
            ))}

          <Button onClick={handleLogout} variant="secondary">
            Logout 🔒
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-12">{renderContent()}</main>
    </div>
  );
}
