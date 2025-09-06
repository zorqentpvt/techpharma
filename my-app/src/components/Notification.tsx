interface NotificationProps {
    message: string;
    type?: "success" | "error" | "info";
    dismissible?: boolean;
  }
  
  export default function Notification({
    message,
    type = "info",
    dismissible = false,
  }: NotificationProps) {
    const colors: Record<string, string> = {
      success: "bg-green-50 border-green-400 text-green-800",
      error: "bg-red-50 border-red-400 text-red-800",
      info: "bg-blue-50 border-blue-400 text-blue-800",
    };
  
    const icons: Record<string, JSX.Element> = {
      success: <span className="font-bold mr-2">✔️</span>,
      error: <span className="font-bold mr-2">❌</span>,
      info: <span className="font-bold mr-2">ℹ️</span>,
    };
  
    return (
      <div
        className={`flex items-center p-4 mb-4 rounded-lg border-l-4 ${colors[type]} shadow-sm`}
      >
        {icons[type]}
        <span className="text-sm md:text-base">{message}</span>
        {dismissible && (
          <button className="ml-auto text-gray-500 hover:text-gray-700">
            ×
          </button>
        )}
      </div>
    );
  }
  