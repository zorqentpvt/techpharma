import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Store from "./pages/Store";
import Transaction from "./pages/transaction";
import Error from "./components/Error";
import Orders from "./pages/Orders";
import ConnectionStatus from "./components/ConnectionStatus";
import Medicines from "./pages/Medicines";
import Cart from "./pages/Cart";
import React from "react";

function App() {
  return (
    <div className="p-4">
      {/* Global Notification */}
      <ConnectionStatus backendUrl="/api/health" checkInterval={5000} />
     

      <Routes>
        <Route path="/" element={<SignIn />} />

        {/* Dashboard layout route */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="store" element={<Store />} />
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
