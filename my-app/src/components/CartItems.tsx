import React from "react";
import medpic from "../assets/med.jpg";

type Product = {
  id: string; // use string since API returns UUIDs
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
};

type CartItemsProps = {
  products: Product[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};
// ✅ Use your backend base URL here
const BASE_URL = "http://localhost:8080";

// ✅ Utility to correctly resolve image URLs
const resolveImageUrl = (img: string | undefined | null): string => {
  if (!img) return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  
  // If it's already a data URL (blob/preview), return as-is
  if (img.startsWith("data:")) return img;
  
  // If it's already a full HTTP URL, return as-is
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  
  // Otherwise, prepend the backend URL
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`;
};
const CartItems: React.FC<CartItemsProps> = ({ products, onQuantityChange, onRemove }) => {
  console.log("Rendering CartItems with products:", products);
  return (
    <>
      <ul className="p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 rounded-2xl">
        {products.map((product) => (
          <li
            key={product.id}
            className="sm:flex items-center py-6 border-b border-gray-200 dark:border-gray-700/60"
          >
<img
  className="rounded-xs mr-5 w-32 h-32 object-cover shrink-0" // limit width & height
  src={resolveImageUrl(product.image) || medpic} // fallback image
  alt={product.name}
/>

            <div className="grow">
              <h3 className="text-2xl font-semibold text-blue-800 mb-1">{product.name}</h3>
              <div className="text-sm mb-2">{product.description}</div>
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex flex-wrap items-center space-x-2 mr-2">
                  <div className="inline-flex text-sm font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2 py-0.5">
                    ${(product.price * product.quantity).toFixed(2)}
                  </div>
                  {/* Quantity selector */}
                  <input
                    type="number"
                    min={1}
                    value={product.quantity}
                    onChange={(e) => onQuantityChange(product.id, Number(e.target.value))}
                    className="w-16 text-center border rounded px-1 py-0.5"
                  />
                </div>
                <button
                  className="text-xs rounded-2xl text-blue-50 bg-blue-500 hover:bg-blue-50 hover:text-blue-800 p-1.5 pt-0.5 pb-0.5"
                  onClick={() => onRemove(product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 text-left px-4 py-2 rounded-lg hover:shadow-xl pt-3 mt-6 w-40 font-medium transition-all
      bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
        <a className="text-sm font-medium text-blue-50" href="/dashboard/medicine">
          Back To Shopping
        </a>
      </div>
    </>
  );
};

export default CartItems;
