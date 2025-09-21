import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function NetworkNotification() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
      ⚠️ You are offline. Check your internet connection.
    </div>
  );
}
