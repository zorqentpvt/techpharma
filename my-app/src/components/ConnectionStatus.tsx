import React, { useEffect, useState } from "react";

type BackendStatus = "checking" | "connected" | "error" | "unreachable";

interface ConnectionStatusProps {
  backendUrl?: string;      // URL to ping your backend
  checkInterval?: number;   // Interval in ms
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  backendUrl = "/api/health",
  checkInterval = 10000,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  // Track internet connection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Check backend connection
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkBackend = async () => {
      try {
        const res = await fetch(backendUrl, { cache: "no-store" });
        setBackendStatus(res.ok ? "connected" : "error");
      } catch {
        setBackendStatus("unreachable");
      }
    };

    checkBackend();
    interval = setInterval(checkBackend, checkInterval);

    return () => clearInterval(interval);
  }, [backendUrl, checkInterval]);

  return (
    <div className="p-4 rounded-2xl shadow-md bg-white max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-2">Connection Status</h2>
      <div className="space-y-2">
        <p>
          🌐 Internet:{" "}
          <span className={isOnline ? "text-green-600" : "text-red-600"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </p>
        <p>
          🖥️ Backend:{" "}
          <span
            className={
              backendStatus === "connected"
                ? "text-green-600"
                : backendStatus === "checking"
                ? "text-yellow-600"
                : "text-red-600"
            }
          >
            {backendStatus}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ConnectionStatus;
