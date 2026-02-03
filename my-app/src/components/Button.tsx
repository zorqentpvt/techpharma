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
    "px-6 py-1.5 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-100";

  const variants: Record<string, string> = {
    primary:
      " bg-blue-600  text-white  hover:bg-blue-800 shadow-lg hover:shadow-xl",
    secondary:
      "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.0 }}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {children}
    </motion.button>
  );
}
