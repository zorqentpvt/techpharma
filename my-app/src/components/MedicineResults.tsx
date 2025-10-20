import { Medicine } from "../api/medapi";
import React from "react";
import medpic from "../assets/med.jpg";
import { addtocart  } from "../api/medapir";

interface MedicineResultsProps {
  results: any[];
  userRole: string;
  handleBuy: (med: Medicine) => void;
  cart: (med: Medicine) => void;
}

export function MedicineResults({ results, userRole, handleBuy, cart }: MedicineResultsProps) {
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
          <img
            src={med.photo || medpic}
            alt={med.name}
            className="w-32 h-32 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = med.photo;
            }}
          />
          <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
          <p className="text-sm text-gray-600">Pharmacy: {med.pharmacy.name}</p>
          <p className="text-sm text-gray-600">Phone: {med.pharmacy.phoneNumber}</p>
          
          <span
            className={`px-2 py-1 w-fit rounded-full text-xs font-semibold ${
              med.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {med.quantity > 0 ? `In Stock: ${med.quantity}` : "Out of Stock"}
          </span>
          <p className="text-sm text-gray-500">{med.contents}</p>
          <p className="text-sm text-gray-500">Price : ₹{med.price}</p>

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
