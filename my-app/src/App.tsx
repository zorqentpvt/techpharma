import { Routes, Route, Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Store from "./pages/Store";           // import Store page
import Transaction from "./pages/transaction";    // import Transaction page
import Error from "./components/Error";
import Notification from "./components/Notification";
import NetworkNotification from "./components/NetworkNotification";

function App() {
  return (
    <div className="p-4">
      {/* Global Notification */}
      <Notification message="Welcome to the app 🎉" type="success" />
      <NetworkNotification />

      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/store" element={<Store />} />            {/* Add store route */}
        <Route path="/transaction" element={<Transaction />} /> {/* Transaction route */}
        <Route path="*" element={<Error message="Page not found" />} />
      </Routes>
    </div>
  );
}

export default App;
