import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Store from "./pages/Store";
import Transaction from "./pages/Transaction";
import Error from "./components/Error";
import Orders from "./pages/Orders";
import ConnectionStatus from "./components/ConnectionStatus";
import Medicines from "./pages/Medicines";
import Cart from "./pages/Cart";
import SignupForm from "./pages/SignupForm";
import "./index.css";
import React from "react";
import Consultings from "./pages/Consultings";

function App() {
  return (
    <div className="p-0">
      
      {/* Global Notification */}
      <div className="fixed top-2 right-2 z-50 opacity-70">
        <ConnectionStatus backendUrl="/api/health" checkInterval={5000} />
      </div>
      
     

      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/Signup-form" element={<SignupForm />} />

        {/* Dashboard layout route */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="store" element={<Store />} />
          <Route path="consult" element={<Consultings />} />
          <Route path="medicine" element={<Medicines />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cart" element={<Cart />} />
          <Route path="transaction" element={<Transaction />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Error message="Page not found" />} />
      </Routes>
    </div>
  );
}

export default App;
