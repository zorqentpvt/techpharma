import { Medicine } from "../api/medapi";
import React from "react";
import medpic from "../assets/med.jpg";
import { addtocart } from "../api/medapir";

interface MedicineResultsProps {
  results: any[];
  userRole: string;
  handleBuy: (med: Medicine) => void;
  cart: (med: Medicine) => void;
}

// ✅ Use your backend base URL here
const BASE_URL = "http://localhost:8080";

// ✅ Utility to correctly resolve image URLs
const resolveImageUrl = (img: string | undefined | null) => {
  if (!img) return medpic; // fallback to default image
  if (img.startsWith("http")) return img; // already full URL
  return `${BASE_URL}/${img.replace(/^\/?/, "")}`; // prepend backend URL
};

export function MedicineResults({
  results,
  userRole,
  handleBuy,
  cart,
}: MedicineResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-gray-500 col-span-full text-center text-lg">
        Use the search box to find medicines.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((med, idx) => (
        <div
          key={idx}
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col gap-3"
        >
          {/* ✅ Fixed: robust image handling */}
          <img
            src={resolveImageUrl(med.image || med.photo)}
            alt={med.name}
            className="w-32 h-32 rounded-full object-cover border"
            onError={(e) => {
              e.currentTarget.src = medpic; // fallback if image fails
            }}
          />

          <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
          <p className="text-sm text-gray-600">
            Pharmacy: {med.pharmacy?.name || "Unknown"}
          </p>
          <p className="text-sm text-gray-600">
            Phone: {med.pharmacy?.phoneNumber || "N/A"}
          </p>

          <span
            className={`px-2 py-1 w-fit rounded-full text-xs font-semibold ${
              med.quantity > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {med.quantity > 0 ? `In Stock: ` : "Out of Stock"}
          </span>

          <p className="text-sm text-gray-500">{med.contents}</p>
          <p className="text-lg font-semibold text-[#002E6E] tracking-wide"> Price: ₹{med.price}</p>


          {userRole === "normal" && med.quantity > 0 && (
            <div className="mt-auto flex gap-2">
              <button
                onClick={() => handleBuy(med)}
                className="flex-1 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#002E6E] hover:bg-[#0043A4] transition"
              >
                Buy Now
              </button>
              <button
                onClick={() => addtocart(med.id)}
                className="flex-1 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#002E6E] hover:bg-[#0043A4] transition"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
