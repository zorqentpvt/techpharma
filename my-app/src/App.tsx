import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignupForm from "./pages/SignupForm";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Store from "./pages/Store";
import Transaction from "./pages/Transaction";
import Error from "./components/Error";
import Orders from "./pages/Orders";
import ConnectionStatus from "./components/ConnectionStatus";
import Medicines from "./pages/Medicines";
import Cart from "./pages/Cart";
import Consultings from "./pages/Consultings";
import ChatbotInterface from "./pages/ChatbotInterface";
import Pay from "./pages/Pay";
import Doctors from "./pages/Doctors";
import Schedule from "./pages/Schedule";
import Appointments from "./pages/Appointments";
import ProfilePage from "./pages/Profile";
import VideoCall from "./pages/VideoCall";

function App() {
  return (
    <div className="p-0">
      {/* Global Notification */}
      <div className="fixed top-2 right-2 z-50 opacity-70">
        <ConnectionStatus backendUrl="/api/health" checkInterval={5000} />
      </div>

      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signup-form" element={<SignupForm />} />
        <Route path="/videocall" element={<VideoCall />} />

        {/* Dashboard with nested routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          {/* Default /dashboard shows Home */}
          <Route index element={<Home />} />

          {/* All other dashboard pages */}
          <Route path="store" element={<Store />} />
          <Route path="pay" element={<Pay />} />
          <Route path="chatbot" element={<ChatbotInterface />} />
          <Route path="consult" element={<Consultings />} />
          <Route path="medicine" element={<Medicines />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cart" element={<Cart />} />
          <Route path="transaction" element={<Transaction />} />
          <Route path="doctor" element={<Doctors />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Redirect /dashboard/logout to root */}
          <Route path="logout" element={<Navigate to="/" replace />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Error message="Page not found" />} />
      </Routes>
    </div>
  );
}

export default App;
