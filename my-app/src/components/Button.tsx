import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
}: ButtonProps) {
  const baseClasses =
    "px-6 py-3 rounded-xl font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:to-blue-650 shadow-lg hover:shadow-xl",
    secondary:
      "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {children}
    </motion.button>
  );
}
